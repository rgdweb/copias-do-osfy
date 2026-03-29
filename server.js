/**
 * ============================================
 * 📱 SUA LOJA - SISTEMA DE PREÇOS
 * ============================================
 * Inteligente e Resposta Rápida 🚀
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

// =====================================
// CONFIGURAÇÕES
// =====================================
const PORT = 3000;
const TELAS_FILE = path.join(__dirname, "telas.json");
const BACKUP_DIR = path.join(__dirname, "backups");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// =====================================
// ESTADO GLOBAL
// =====================================
let whatsappClient = null;
let whatsappConectado = false;
let io = null;
let dadosTelas = null;
let botAtivo = true; // Bot começa ativo
let modoTeste = false; // Modo teste desativado por padrão
let numerosTeste = []; // Números autorizados para teste

const clientesPausados = new Set();

const estatisticas = {
  consultasHoje: 0,
  mensagensRecebidas: 0,
  inicio: new Date().toISOString()
};

// =====================================
// LOGGER
// =====================================
function log(nivel, categoria, mensagem) {
  const timestamp = new Date().toISOString();
  const cores = { INFO: '\x1b[36m', WARN: '\x1b[33m', ERRO: '\x1b[31m', SUCESSO: '\x1b[32m' };
  console.log(`${cores[nivel] || ''}[${timestamp}] [${categoria}] ${mensagem}\x1b[0m`);
}

// =====================================
// BACKUP
// =====================================
function criarBackup() {
  try {
    if (!dadosTelas) return;
    const nome = `telas_${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, nome), JSON.stringify(dadosTelas, null, 2));
    const backups = fs.readdirSync(BACKUP_DIR).sort().reverse();
    backups.slice(10).forEach(b => fs.unlinkSync(path.join(BACKUP_DIR, b)));
    log('INFO', 'BACKUP', `Backup criado: ${nome}`);
  } catch (e) {}
}

// =====================================
// CARREGAR/SALVAR
// =====================================
function carregarDados() {
  try {
    if (fs.existsSync(TELAS_FILE)) {
      dadosTelas = JSON.parse(fs.readFileSync(TELAS_FILE, "utf8"));
      // Carregar estado do bot
      if (dadosTelas.botAtivo !== undefined) botAtivo = dadosTelas.botAtivo;
      // Carregar modo teste
      if (dadosTelas.modoTeste !== undefined) modoTeste = dadosTelas.modoTeste;
      // Carregar números de teste
      if (dadosTelas.numerosTeste) numerosTeste = dadosTelas.numerosTeste;
      log('SUCESSO', 'DADOS', `${dadosTelas.telas?.length || 0} telas carregadas | Modo Teste: ${modoTeste ? 'ON' : 'OFF'}`);
      return true;
    }
  } catch (e) {
    log('ERRO', 'DADOS', 'Erro ao carregar: ' + e.message);
  }
  dadosTelas = { empresa: {}, telas: [] };
  return false;
}

function salvarDados() {
  try {
    dadosTelas.botAtivo = botAtivo;
    dadosTelas.modoTeste = modoTeste;
    dadosTelas.numerosTeste = numerosTeste;
    fs.writeFileSync(TELAS_FILE, JSON.stringify(dadosTelas, null, 2));
    criarBackup();
  } catch (e) {
    log('ERRO', 'DADOS', 'Erro ao salvar: ' + e.message);
  }
}

carregarDados();

// =====================================
// MARCAS CONHECIDAS (ordem alfabética)
// =====================================
const MARCAS = [
  'alcatel', 'apple', 'asus', 'huawei', 'honor',
  'iphone', 'lenovo', 'lg', 'motorola', 'moto',
  'multilaser', 'nokia', 'oneplus', 'oppo', 'poco',
  'positivo', 'realme', 'redmi', 'samsung', 'tcl',
  'vivo', 'xiaomi', 'zenfone', 'zte'
];

// Mapear variações para marca padrão
const MARCA_ALIASES = {
  'moto': 'motorola',
  'apple': 'iphone',
  'redmi': 'xiaomi',
  'poco': 'xiaomi',
  'zenfone': 'asus',
  'honor': 'huawei'
};

// =====================================
// PALAVRAS PARA IGNORAR (STOPWORDS)
// =====================================
const STOPWORDS = [
  'bom', 'boa', 'dia', 'tarde', 'noite', 'tudo', 'bem', 'ola', 'olá', 'oi', 'oie', 'oii',
  'gostaria', 'queria', 'quero', 'preciso', 'saber', 'valor', 'preço', 'preco', 'quanto',
  'custa', 'fica', 'qual', 'display', 'tela', 'do', 'da', 'de', 'o', 'a', 'os', 'as',
  'um', 'uma', 'para', 'por', 'que', 'se', 'eu', 'voce', 'você', 'me', 'meu', 'minha',
  'tem', 'tenho', 'favor', 'pfv', 'pf', 'porfavor', 'obg', 'obrigado', 'obrigada',
  'ola', 'hi', 'hello', 'hey', 'amigo', 'amiga', 'amigos'
];

// =====================================
// ESTADO DE CLIENTES AGUARDANDO MARCA
// =====================================
const clientesAguardandoMarca = new Map(); // from -> { termo, marcasEncontradas, produtos }

// =====================================
// UTILITÁRIOS
// =====================================
function normalizar(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrair palavras relevantes (remover stopwords e marcas)
function extrairPalavrasRelevantes(texto) {
  const t = normalizar(texto);
  const palavras = t.split(' ').filter(p => p.length > 0);
  
  // Remover stopwords e marcas
  return palavras.filter(p => {
    const isStopword = STOPWORDS.includes(p);
    const isMarca = MARCAS.includes(p);
    return !isStopword && !isMarca;
  });
}

// Detectar marca na mensagem do cliente
function detectarMarcaNaMensagem(texto) {
  const t = normalizar(texto);
  const palavras = t.split(' ');
  
  for (const p of palavras) {
    if (MARCAS.includes(p)) {
      // Normalizar marca (ex: 'moto' -> 'motorola')
      return MARCA_ALIASES[p] || p;
    }
  }
  return null;
}

// Normalizar marca do cadastro
function normalizarMarca(marca) {
  if (!marca) return null;
  const m = normalizar(marca);
  return MARCA_ALIASES[m] || m;
}

// =====================================
// BUSCAR NO BANCO - LÓGICA POR PALAVRAS E MARCAS
// =====================================
function buscarNoBanco(texto) {
  if (!dadosTelas?.telas) return { disponiveis: [], indisponiveis: [], porMarca: {} };
  
  // Extrair palavras relevantes
  const palavras = extrairPalavrasRelevantes(texto);
  
  // Detectar se cliente já informou a marca
  const marcaInformada = detectarMarcaNaMensagem(texto);
  
  const encontrados = [];
  const indisponiveis = [];
  const porMarca = {};
  
  dadosTelas.telas.forEach(tela => {
    const modeloNorm = normalizar(tela.modelo);
    const marcaTela = normalizarMarca(tela.marca) || 'outros';
    
    // Verificar se alguma palavra relevante está no modelo
    const encontrou = palavras.some(p => modeloNorm.includes(p));
    
    if (encontrou) {
      // Se cliente informou marca, filtrar só essa marca
      if (marcaInformada) {
        if (marcaTela !== marcaInformada) return; // Pula se não for a marca
      }
      
      const item = { ...tela, marcaDetectada: marcaTela };
      
      if (tela.ativo && tela.estoque > 0) {
        encontrados.push(item);
        
        // Agrupar por marca
        if (!porMarca[marcaTela]) porMarca[marcaTela] = [];
        porMarca[marcaTela].push(item);
      } else {
        indisponiveis.push(item);
      }
    }
  });
  
  return { 
    disponiveis: encontrados, 
    indisponiveis: indisponiveis,
    porMarca: porMarca,
    marcasEncontradas: Object.keys(porMarca),
    palavrasBuscadas: palavras
  };
}

// =====================================
// FORMATAR RESPOSTA DA TELA
// =====================================
function formatarRespostaTela(tela) {
  const obs = tela.observacao ? ` ${tela.observacao}` : '';
  return `${tela.modelo} ${tela.tipo}${obs}\tR$ ${tela.preco.toFixed(2)}`;
}

// =====================================
// VERIFICAR NÚMERO DE TESTE
// =====================================
function ehNumeroTeste(from) {
  if (!modoTeste) return false;
  if (numerosTeste.length === 0) return false;
  return numerosTeste.includes(from);
}

// =====================================
// VERIFICAR SE MODO TESTE BLOQUEIA NÚMERO
// =====================================
function modoTesteBloqueia(from) {
  // Se modo teste está desativado, não bloqueia ninguém
  if (!modoTeste) return false;
  // Se modo teste está ativo mas não há números cadastrados, não bloqueia
  if (numerosTeste.length === 0) return false;
  // Se modo teste está ativo e o número NÃO está na lista, BLOQUEIA
  return !numerosTeste.includes(from);
}

// =====================================
// HORÁRIO DE ATENDIMENTO
// =====================================
function horarioAtendimento() {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const dia = agora.getDay();
  
  const horaAtual = hora + minuto / 60;
  
  // Segunda a sexta (1-5): 09:00 às 12:00 e 13:30 às 18:30
  if (dia >= 1 && dia <= 5) {
    if ((horaAtual >= 9 && horaAtual < 12) || (horaAtual >= 13.5 && horaAtual < 18.5)) {
      return true;
    }
  }
  
  // Sábado (6): 09:00 às 13:00
  if (dia === 6) {
    if (horaAtual >= 9 && horaAtual < 13) {
      return true;
    }
  }
  
  return false;
}

function getMensagemForaHorario() {
  const emp = dadosTelas.empresa?.nome || "SUA LOJA";
  return `👋 Olá! Seja bem-vindo(a) à ${emp} 📱🔧

No momento estamos fechados/indisponíveis ⏰

🕘 Nosso horário de atendimento:
📅 Segunda a sexta: 09:00 às 12:00 e 13:30 às 18:30
📅 Sábados: 09:00 às 13:00

💬 Assim que retornarmos ao nosso horário de atendimento, responderemos todas as mensagens com atenção 😊

🙏 Agradecemos o contato e a preferência!`;
}

// =====================================
// EXPRESS
// =====================================
const app = express();
const server = http.createServer(app);
io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API - Dados da empresa
app.get("/api/empresa", (req, res) => res.json(dadosTelas.empresa || {}));

app.post("/api/empresa", (req, res) => {
  dadosTelas.empresa = { ...dadosTelas.empresa, ...req.body };
  salvarDados();
  io.emit("dados_atualizados", { ...dadosTelas, botAtivo });
  res.json({ ok: true });
});

// API - Toggle Bot (Ativar/Desativar)
app.post("/api/bot/toggle", (req, res) => {
  botAtivo = !botAtivo;
  salvarDados();
  io.emit("bot_status", botAtivo);
  io.emit("dados_atualizados", { ...dadosTelas, botAtivo });
  log('INFO', 'BOT', botAtivo ? 'Bot ATIVADO (Online)' : 'Bot DESATIVADO (Offline)');
  res.json({ ativo: botAtivo });
});

// API - Status do Bot
app.get("/api/bot/status", (req, res) => {
  res.json({ ativo: botAtivo, modoTeste, numerosTeste });
});

// API - Toggle Modo Teste
app.post("/api/teste/toggle", (req, res) => {
  modoTeste = !modoTeste;
  salvarDados();
  io.emit("modo_teste_status", { modoTeste, numerosTeste });
  log('INFO', 'TESTE', modoTeste ? 'Modo Teste ATIVADO' : 'Modo Teste DESATIVADO');
  res.json({ modoTeste, numerosTeste });
});

// API - Adicionar número de teste
app.post("/api/teste/numero", (req, res) => {
  const numero = req.body.numero?.trim();
  if (!numero) return res.status(400).json({ erro: "Número obrigatório" });
  
  // Formatar número (adicionar @c.us se não tiver)
  const numeroFormatado = numero.includes('@') ? numero : numero + '@c.us';
  
  if (!numerosTeste.includes(numeroFormatado)) {
    numerosTeste.push(numeroFormatado);
    salvarDados();
    io.emit("modo_teste_status", { modoTeste, numerosTeste });
    log('INFO', 'TESTE', `Número adicionado: ${numero}`);
  }
  
  res.json({ modoTeste, numerosTeste });
});

// API - Remover número de teste
app.delete("/api/teste/numero/:numero", (req, res) => {
  const numero = req.params.numero;
  numerosTeste = numerosTeste.filter(n => n !== numero);
  salvarDados();
  io.emit("modo_teste_status", { modoTeste, numerosTeste });
  log('INFO', 'TESTE', `Número removido: ${numero}`);
  res.json({ modoTeste, numerosTeste });
});

// API - Listar números de teste
app.get("/api/teste/numeros", (req, res) => {
  res.json({ modoTeste, numerosTeste });
});

// API - Listar telas
app.get("/api/telas", (req, res) => {
  const telas = dadosTelas.telas || [];
  const { busca, ativo } = req.query;
  
  let resultado = telas;
  
  if (busca) {
    const buscaNorm = normalizar(busca);
    resultado = resultado.filter(t => 
      normalizar(t.modelo).includes(buscaNorm) ||
      normalizar(t.tipo).includes(buscaNorm)
    );
  }
  
  if (ativo !== undefined) {
    resultado = resultado.filter(t => t.ativo === (ativo === 'true'));
  }
  
  res.json(resultado);
});

// API - Adicionar tela
app.post("/api/telas", (req, res) => {
  const nova = {
    id: Date.now().toString(),
    modelo: req.body.modelo || "",
    marca: req.body.marca || "",
    tipo: req.body.tipo || "",
    observacao: req.body.observacao || "",
    preco: parseFloat(req.body.preco) || 0,
    estoque: parseInt(req.body.estoque) || 0,
    ativo: req.body.ativo !== false
  };
  
  dadosTelas.telas.push(nova);
  salvarDados();
  
  io.emit("tela_adicionada", nova);
  io.emit("stats", { total: dadosTelas.telas.length, ativos: dadosTelas.telas.filter(t => t.ativo).length });
  
  res.json(nova);
});

// API - Atualizar tela
app.put("/api/telas/:id", (req, res) => {
  const idx = dadosTelas.telas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: "Tela não encontrada" });
  
  dadosTelas.telas[idx] = {
    ...dadosTelas.telas[idx],
    ...req.body,
    id: req.params.id
  };
  
  salvarDados();
  io.emit("tela_atualizada", dadosTelas.telas[idx]);
  
  res.json(dadosTelas.telas[idx]);
});

// API - Deletar tela
app.delete("/api/telas/:id", (req, res) => {
  const idx = dadosTelas.telas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: "Tela não encontrada" });
  
  dadosTelas.telas.splice(idx, 1);
  salvarDados();
  
  io.emit("tela_removida", req.params.id);
  
  res.json({ ok: true });
});

// API - Toggle ativo
app.post("/api/telas/:id/toggle", (req, res) => {
  const tela = dadosTelas.telas.find(t => t.id === req.params.id);
  if (!tela) return res.status(404).json({ erro: "Tela não encontrada" });
  
  tela.ativo = !tela.ativo;
  salvarDados();
  
  io.emit("tela_atualizada", tela);
  
  res.json(tela);
});

// API - Estatísticas
app.get("/api/stats", (req, res) => {
  const telas = dadosTelas.telas || [];
  res.json({
    total: telas.length,
    ativos: telas.filter(t => t.ativo).length,
    inativos: telas.filter(t => !t.ativo).length,
    semEstoque: telas.filter(t => t.estoque === 0).length,
    consultasHoje: estatisticas.consultasHoje,
    mensagensRecebidas: estatisticas.mensagensRecebidas,
    conectado: whatsappConectado,
    botAtivo: botAtivo
  });
});

// API - Marcas disponíveis
app.get("/api/marcas", (req, res) => {
  res.json(MARCAS);
});

// WhatsApp - Desconectar
app.post("/api/disconnect", async (req, res) => {
  if (whatsappClient) {
    whatsappConectado = false;
    try { await whatsappClient.destroy(); } catch (e) {}
    whatsappClient = null;
  }
  res.json({ ok: true });
});

// Rota principal
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// =====================================
// WHATSAPP BOT
// =====================================
function initWhatsApp() {
  if (whatsappClient) return;

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "telas-bot" }),
    authTimeoutMs: 180000,
    puppeteer: {
      headless: true,
      timeout: 120000,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    },
  });

  whatsappClient.on("qr", async (qr) => {
    try {
      const img = await QRCode.toDataURL(qr, { width: 300 });
      io.emit("qr", img);
      io.emit("status", { conectado: false, mensagem: "Escaneie o QR Code" });
    } catch (e) {}
  });

  whatsappClient.on("ready", () => {
    whatsappConectado = true;
    io.emit("qr", null);
    io.emit("status", { conectado: true, mensagem: "Conectado!" });
    log('SUCESSO', 'WPP', 'WhatsApp conectado!');
  });

  whatsappClient.on("disconnected", () => {
    whatsappConectado = false;
    io.emit("status", { conectado: false, mensagem: "Desconectado" });
    log('WARN', 'WPP', 'Desconectado');
  });

  whatsappClient.on("message", async (msg) => {
    const from = msg.from || "";
    
    if (from.includes("status") || from.includes("broadcast") || from.includes("@g.us")) return;
    
    try {
      const chat = await msg.getChat();
      if (chat.isGroup) return;
    } catch (e) { return; }
    
    if (msg.timestamp && (Date.now() / 1000 - msg.timestamp) > 300) return;

    const texto = msg.body?.trim() || "";
    if (!texto || texto.length > 500) return;

    // =====================================
    // MODO TESTE - BLOQUEAR NÚMEROS NÃO AUTORIZADOS
    // =====================================
    if (modoTesteBloqueia(from)) {
      log('INFO', 'TESTE', `Mensagem IGNORADA de número não autorizado: ${from.substring(0, 20)}...`);
      return; // Ignora completamente mensagens de números não autorizados
    }

    estatisticas.mensagensRecebidas++;

    await processarMensagem(msg, from, texto);
  });

  whatsappClient.initialize().catch(err => {
    log('ERRO', 'WPP', 'Falha: ' + err.message);
  });
}

// =====================================
// PROCESSAR MENSAGEM
// =====================================
async function processarMensagem(msg, from, texto) {
  const t = normalizar(texto);
  
  // Verificar se é número de teste
  const ehTeste = ehNumeroTeste(from);
  if (ehTeste) {
    log('INFO', 'TESTE', `Mensagem de número de teste: ${from.substring(0, 20)}...`);
  }
  
  // =====================================
  // VERIFICAR SE ESTÁ AGUARDANDO ESCOLHA DE MARCA
  // =====================================
  if (clientesAguardandoMarca.has(from)) {
    const estado = clientesAguardandoMarca.get(from);
    const marcas = estado.marcasEncontradas;
    
    // Verificar se digitou número ou nome da marca
    let marcaEscolhida = null;
    
    // Se digitou número
    if (/^\d+$/.test(t)) {
      const idx = parseInt(t) - 1;
      if (idx >= 0 && idx < marcas.length) {
        marcaEscolhida = marcas[idx];
      }
    } else {
      // Se digitou nome da marca
      marcaEscolhida = MARCA_ALIASES[t] || t;
      if (!marcas.includes(marcaEscolhida)) {
        marcaEscolhida = null;
      }
    }
    
    if (marcaEscolhida) {
      clientesAguardandoMarca.delete(from);
      
      // Retornar produtos da marca escolhida
      const produtos = estado.porMarca[marcaEscolhida] || [];
      
      if (produtos.length > 0) {
        let resposta = `✅ ${marcaEscolhida.toUpperCase()} - ${produtos.length} produto(s) encontrado(s):\n\n`;
        produtos.forEach(tela => {
          resposta += formatarRespostaTela(tela) + '\n';
        });
        
        if (!botAtivo) {
          resposta += '\n⚠️ No momento não temos atendentes disponíveis.';
        }
        
        await msg.reply(resposta);
        log('INFO', 'BUSCA', `Cliente escolheu marca: ${marcaEscolhida}`);
      } else {
        await msg.reply('Nenhum produto encontrado para essa marca.');
      }
      return;
    } else {
      // Resposta inválida
      await msg.reply('Opção inválida. Digite o número ou nome da marca.');
      return;
    }
  }
  
  // Verificar se está pausado (atendente)
  if (clientesPausados.has(from)) {
    if (t === 'bot') {
      clientesPausados.delete(from);
      await msg.reply('🤖 Bot reativado!');
      return;
    }
    return;
  }
  
  // =====================================
  // BOT DESATIVADO (OFFLINE) - AVISA QUE NÃO TEM ATENDENTE
  // =====================================
  if (!botAtivo) {
    // Funciona igual ao bot ativo, mas avisa no final que não tem atendente
    // Números de teste IGNORAM verificação de horário
    
    // 1 - Atendente (mas não tem ninguém)
    if (t === '1' || t.includes('atendente') || t.includes('humano')) {
      await msg.reply('⚠️ No momento não temos atendentes disponíveis.\n\nTodos estão ocupados assim que alguém ficar livre irá atendê-lo.\n\nObrigado pela compreensão!');
      return;
    }
    
    // 2 - Acessórios
    if (t === '2' || t.includes('acessorio')) {
      await msg.reply('📱 Acessórios para celular\n\n⚠️ No momento não temos atendentes disponíveis para fechar seu pedido.\n\nTodos estão ocupados, aguarde que alguém irá atendê-lo.');
      return;
    }
    
    // 3 - Serviços
    if (t === '3' || t.includes('servico') || t.includes('orcamento')) {
      await msg.reply('🔧 Serviços e orçamentos\n\n⚠️ No momento não temos técnicos disponíveis.\n\nTodos estão ocupados, aguarde que alguém irá atendê-lo.');
      return;
    }
    
    // 4 - Outros
    if (t === '4' || t === 'outros') {
      await msg.reply('⚠️ No momento não temos atendentes disponíveis.\n\nTodos estão ocupados, aguarde que alguém irá atendê-lo.');
      return;
    }
    
    // 5 - Finalizar
    if (t === '5' || t.includes('finalizar') || t.includes('obrigado')) {
      await msg.reply('👋 Obrigado pelo contato!');
      return;
    }
    
    // 6 ou 7 - Telas
    if (t === '6' || t === '7') {
      await msg.reply('Me diga o modelo:');
      return;
    }
    
    // Buscar no banco
    const resultadoOffline = buscarNoBanco(texto);
    const { disponiveis, indisponiveis, porMarca, marcasEncontradas, palavrasBuscadas } = resultadoOffline;
    
    if (disponiveis.length > 0 || indisponiveis.length > 0) {
      // Se encontrou em MAIS DE UMA MARCA, perguntar
      if (marcasEncontradas.length > 1) {
        // Salvar estado e perguntar marca
        clientesAguardandoMarca.set(from, {
          porMarca: porMarca,
          marcasEncontradas: marcasEncontradas,
          termo: texto
        });
        
        let msgMarcas = `🔍 Encontrei "${palavrasBuscadas.join(' ')}" em ${marcasEncontradas.length} marcas:\n\n`;
        marcasEncontradas.forEach((marca, idx) => {
          const qtd = porMarca[marca].length;
          msgMarcas += `${idx + 1} - ${marca.toUpperCase()} (${qtd})\n`;
        });
        msgMarcas += '\nDigite o número da marca do seu aparelho:';
        
        await msg.reply(msgMarcas);
        return;
      }
      
      // Encontrou em 1 marca só - retorna direto
      if (disponiveis.length > 0) {
        let resposta = '';
        disponiveis.forEach(tela => {
          resposta += formatarRespostaTela(tela) + '\n';
        });
        resposta += '\n⚠️ No momento não temos atendentes disponíveis para fechar seu pedido.\n\nAssim que alguém ficar livre, irá atendê-lo.';
        await msg.reply(resposta);
        return;
      }
      
      if (indisponiveis.length > 0) {
        await msg.reply('Esse modelo não está disponível no momento.\n\n⚠️ No momento não temos atendentes disponíveis.\n\nTodos estão ocupados, aguarde que alguém irá atendê-lo.');
        return;
      }
    }
    
    // Se mencionou tela/preço mas não encontrou
    if (t.includes('tela') || t.includes('preco') || t.includes('preço') || t.includes('valor')) {
      await msg.reply('Não encontramos esse modelo.\n\n⚠️ No momento não temos atendentes disponíveis.\n\nTodos estão ocupados, aguarde que alguém irá atendê-lo.');
      return;
    }
    
    // Menu
    if (['oi', 'ola', 'olá', 'menu', 'inicio', 'start'].some(p => t.includes(p))) {
      await msg.reply(getMenuOffline());
      return;
    }
    
    // Resposta padrão
    await msg.reply(getMenuOffline());
    return;
  }
  
  // =====================================
  // BOT ATIVADO (ONLINE) - NORMAL
  // =====================================
  
  // 1 - Atendente
  if (t === '1' || t.includes('atendente') || t.includes('humano')) {
    clientesPausados.add(from);
    await msg.reply('✅ Transferindo para atendente!\n\nAguarde um momento.\n\n_Para voltar ao bot, digite "bot"._');
    return;
  }
  
  // 2 - Acessórios
  if (t === '2' || t.includes('acessorio')) {
    await msg.reply('📱 Acessórios para celular\n\nDigite 1 para falar com atendente.');
    return;
  }
  
  // 3 - Serviços
  if (t === '3' || t.includes('servico') || t.includes('orcamento')) {
    await msg.reply('🔧 Serviços e orçamentos\n\nPara orçamentos, digite 1 para falar com técnico.');
    return;
  }
  
  // 4 - Outros
  if (t === '4' || t === 'outros') {
    await msg.reply('Digite 1 para falar com atendente.');
    return;
  }
  
  // 5 - Finalizar
  if (t === '5' || t.includes('finalizar') || t.includes('obrigado')) {
    await msg.reply('👋 Obrigado pelo contato!');
    return;
  }
  
  // 6 ou 7 - Telas
  if (t === '6' || t === '7') {
    // Números de teste ignoram verificação de horário
    if (!ehTeste && !horarioAtendimento()) {
      await msg.reply(getMensagemForaHorario());
      return;
    }
    await msg.reply('Me diga o modelo:');
    return;
  }
  
  // =====================================
  // BUSCAR NO BANCO DE DADOS
  // =====================================
  const resultado = buscarNoBanco(texto);
  const { disponiveis, indisponiveis, porMarca, marcasEncontradas, palavrasBuscadas } = resultado;
  
  if (disponiveis.length > 0 || indisponiveis.length > 0) {
    // Números de teste ignoram verificação de horário
    if (!ehTeste && !horarioAtendimento()) {
      await msg.reply(getMensagemForaHorario());
      return;
    }
    
    estatisticas.consultasHoje++;
    
    // Se encontrou em MAIS DE UMA MARCA, perguntar
    if (marcasEncontradas.length > 1) {
      // Salvar estado e perguntar marca
      clientesAguardandoMarca.set(from, {
        porMarca: porMarca,
        marcasEncontradas: marcasEncontradas,
        termo: texto
      });
      
      let msgMarcas = `🔍 Encontrei "${palavrasBuscadas.join(' ')}" em ${marcasEncontradas.length} marcas:\n\n`;
      marcasEncontradas.forEach((marca, idx) => {
        const qtd = porMarca[marca].length;
        msgMarcas += `${idx + 1} - ${marca.toUpperCase()} (${qtd})\n`;
      });
      msgMarcas += '\nDigite o número da marca do seu aparelho:';
      
      await msg.reply(msgMarcas);
      log('INFO', 'BUSCA', `Perguntando marca: ${marcasEncontradas.join(', ')}${ehTeste ? ' [TESTE]' : ''}`);
      return;
    }
    
    // Encontrou em 1 marca só - retorna direto
    if (disponiveis.length > 0) {
      let resposta = '';
      disponiveis.forEach(tela => {
        resposta += formatarRespostaTela(tela) + '\n';
      });
      await msg.reply(resposta);
      log('INFO', 'BUSCA', `Encontrado: ${disponiveis.length} telas${ehTeste ? ' [TESTE]' : ''}`);
      return;
    }
    
    if (indisponiveis.length > 0) {
      await msg.reply('Esse modelo não está disponível no momento em estoque.\n\nDigite 1 para falar com atendente.');
      return;
    }
  }
  
  // Se mencionou tela/preço mas não encontrou no banco
  if (t.includes('tela') || t.includes('preco') || t.includes('preço') || t.includes('valor')) {
    // Números de teste ignoram verificação de horário
    if (!ehTeste && !horarioAtendimento()) {
      await msg.reply(getMensagemForaHorario());
      return;
    }
    await msg.reply('Não encontramos esse modelo no sistema.\n\nVerifique se digitou corretamente ou digite 1 para falar com atendente.');
    return;
  }
  
  // Menu
  if (['oi', 'ola', 'olá', 'menu', 'inicio', 'start'].some(p => t.includes(p))) {
    await msg.reply(getMenu());
    return;
  }
  
  // Resposta padrão - menu
  await msg.reply(getMenu());
}

function getMenu() {
  const emp = dadosTelas.empresa?.nome || "SUA LOJA";
  return `Olá! Seja bem-vindo(a) à ${emp} 📱

Se for referente a TELAS, especifique o modelo:
Ex: Samsung A20S, Moto G05, Moto G30, iPhone 13

SE NÃO digite uma opção:

1 - Atendente
2 - Acessórios para celular
3 - Serviços e orçamentos
4 - Outros
5 - Finalizar
6 - Telas
7 - Preços de telas`;
}

function getMenuOffline() {
  const emp = dadosTelas.empresa?.nome || "SUA LOJA";
  return `Olá! Seja bem-vindo(a) à ${emp} 📱

Se for referente a TELAS, especifique o modelo:
Ex: Samsung A20S, Moto G05, Moto G30, iPhone 13

⚠️ No momento não temos atendentes disponíveis para fechar pedidos.
Todos estão ocupados, assim que alguém ficar livre irá atendê-lo.

SE NÃO digite uma opção:

1 - Atendente
2 - Acessórios para celular
3 - Serviços e orçamentos
4 - Outros
5 - Finalizar
6 - Telas
7 - Preços de telas`;
}

// =====================================
// SOCKET.IO
// =====================================
io.on("connection", (socket) => {
  socket.emit("status", { conectado: whatsappConectado, mensagem: whatsappConectado ? "Conectado!" : "Aguardando..." });
  socket.emit("bot_status", botAtivo);
  socket.emit("modo_teste_status", { modoTeste, numerosTeste });
  
  if (!whatsappConectado) {
    socket.emit("qr", "loading");
  }
  
  socket.emit("dados_atualizados", { ...dadosTelas, botAtivo, modoTeste, numerosTeste });
  
  socket.emit("stats", {
    total: dadosTelas.telas?.length || 0,
    ativos: dadosTelas.telas?.filter(t => t.ativo).length || 0
  });
});

// =====================================
// INICIAR
// =====================================
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   📱 SUA LOJA - SISTEMA DE PREÇOS                        ║
║   🚀 Inteligente e Resposta Rápida                       ║
║                                                          ║
║   🌐 Painel: http://localhost:${PORT}                      ║
║   🤖 Bot: ${botAtivo ? '🟢 Online' : '🔴 Offline'}                                        ║
║   🧪 Teste: ${modoTeste ? '🟢 Ativo (' + numerosTeste.length + ' núm.)' : '🔴 Inativo'}                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  log('INFO', 'SISTEMA', 'Sistema iniciado - Bot ' + (botAtivo ? 'ONLINE' : 'OFFLINE') + ' | Teste: ' + (modoTeste ? 'ON' : 'OFF'));
  initWhatsApp();
});
