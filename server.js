/**
 * ============================================
 * BOT WHATSAPP PROFISSIONAL v7.2
 * ============================================
 * 
 * CORREÇÕES v7.2:
 * - Modelo Groq FIXO no código (llama-3.3-70b-versatile)
 * - Não depende mais do config.json para modelo
 * - Saudações funcionando
 * - Detecção de atendente ENTRANDO
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const OpenAI = require("openAI");

// =====================================
// CONFIGURAÇÕES GLOBAIS
// =====================================
const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, "config.json");
const BASE_FILE = path.join(__dirname, "base-conhecimento.json");
const BACKUP_DIR = path.join(__dirname, "backups");
const LOGS_DIR = path.join(__dirname, "logs");

// MODELO GROQ - SEMPRE ATUALIZADO (não mexer)
const MODELO_GROQ = "llama-3.3-70b-versatile";

[BACKUP_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// =====================================
// ESTADO GLOBAL
// =====================================
let groqClient = null;
let whatsappClient = null;
let whatsappConectado = false;
let io = null;
let baseConhecimento = null;
let config = null;

const clientesPausados = new Map();
const sessoesAtendimento = new Map();
const mensagensEnviadasPeloBot = new Map();
const filaProcessamento = new Map();
const ultimaInteracao = new Map();
const atendenteAtivo = new Map();

const estatisticas = {
  mensagensRecebidas: 0,
  mensagensEnviadas: 0,
  atendimentosHoje: 0,
  erros: 0,
  atendenteIntervencoes: 0,
  inicio: new Date().toISOString()
};

// =====================================
// LOGGER
// =====================================
function log(nivel, categoria, mensagem, dados = null) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${nivel}] [${categoria}] ${mensagem}${dados ? ' | ' + JSON.stringify(dados) : ''}\n`;
  
  const cores = { INFO: '\x1b[36m', WARN: '\x1b[33m', ERRO: '\x1b[31m', DEBUG: '\x1b[90m', SUCESSO: '\x1b[32m' };
  console.log(`${cores[nivel] || ''}${logLine.trim()}\x1b[0m`);
  
  const logFile = path.join(LOGS_DIR, `bot_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logLine);
}

// =====================================
// BACKUP
// =====================================
function criarBackup() {
  try {
    if (!baseConhecimento) return;
    const nome = `base_${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, nome), JSON.stringify(baseConhecimento, null, 2));
    const backups = fs.readdirSync(BACKUP_DIR).sort().reverse();
    backups.slice(10).forEach(b => fs.unlinkSync(path.join(BACKUP_DIR, b)));
  } catch (e) {}
}

// =====================================
// CARREGAR/SALVAR
// =====================================
function carregarConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
      // FORÇA modelo correto - ignora se vier errado no config
      cfg.model = MODELO_GROQ;
      return cfg;
    }
  } catch (e) {}
  return {
    groqApiKey: "",
    useAI: true,
    model: MODELO_GROQ,
    numeroAtendente: "5549998418446",
    mensagemForaHorario: "Estamos fora do horário. Deixe sua mensagem que retornamos!",
    horarioAtendimento: { inicio: 8, fim: 18 }
  };
}

function salvarConfig(c) {
  try {
    // FORÇA modelo correto ao salvar
    c.model = MODELO_GROQ;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2));
    config = c;
  } catch (e) {}
}

function carregarBase() {
  try {
    if (fs.existsSync(BASE_FILE)) {
      baseConhecimento = JSON.parse(fs.readFileSync(BASE_FILE, "utf8"));
      log('INFO', 'BASE', 'Base de conhecimento carregada');
      return true;
    }
  } catch (e) {
    log('ERRO', 'BASE', 'Erro ao carregar base: ' + e.message);
  }
  return false;
}

function salvarBase(b) {
  try {
    fs.writeFileSync(BASE_FILE, JSON.stringify(b, null, 2));
    baseConhecimento = b;
    criarBackup();
  } catch (e) {}
}

// Inicialização
config = carregarConfig();
carregarBase();

if (config.groqApiKey?.trim()) {
  groqClient = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });
  log('INFO', 'IA', 'Cliente Groq inicializado com modelo: ' + (config.model || 'llama-3.3-70b-versatile'));
}

// =====================================
// UTILITÁRIOS
// =====================================
function gerarProtocolo() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function horarioAtendimento() {
  const agora = new Date();
  const hora = agora.getHours();
  const dia = agora.getDay();
  
  if (dia >= 1 && dia <= 5) {
    const inicio = config.horarioAtendimento?.inicio || 8;
    const fim = config.horarioAtendimento?.fim || 18;
    return hora >= inicio && hora < fim;
  }
  if (dia === 6) return hora >= 8 && hora < 12;
  return false;
}

function getPeriodoDia() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  return 'noite';
}

function respostaAleatoria(lista) {
  if (!lista || lista.length === 0) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}

// =====================================
// DETECÇÃO DE INTENÇÕES
// =====================================

function detectarSaudacao(texto) {
  const t = normalizar(texto);
  const saudacoes = baseConhecimento?.respostasInteligentes?.saudacoes;
  if (!saudacoes) return null;
  
  const periodo = getPeriodoDia();
  
  // Bom dia
  if (saudacoes.bomDia?.gatilhos?.some(g => t.includes(normalizar(g)))) {
    if (periodo === 'manha') return respostaAleatoria(saudacoes.bomDia.respostas);
    if (periodo === 'tarde') return respostaAleatoria(saudacoes.boaTarde?.respostas);
    return respostaAleatoria(saudacoes.boaNoite?.respostas);
  }
  
  // Boa tarde
  if (saudacoes.boaTarde?.gatilhos?.some(g => t.includes(normalizar(g)))) {
    if (periodo === 'tarde') return respostaAleatoria(saudacoes.boaTarde.respostas);
    if (periodo === 'manha') return respostaAleatoria(saudacoes.bomDia?.respostas);
    return respostaAleatoria(saudacoes.boaNoite?.respostas);
  }
  
  // Boa noite
  if (saudacoes.boaNoite?.gatilhos?.some(g => t.includes(normalizar(g)))) {
    if (periodo === 'noite') return respostaAleatoria(saudacoes.boaNoite.respostas);
    if (periodo === 'manha') return respostaAleatoria(saudacoes.bomDia?.respostas);
    return respostaAleatoria(saudacoes.boaTarde?.respostas);
  }
  
  // Oi/Olá
  if (saudacoes.oiOla?.gatilhos?.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(saudacoes.oiOla.respostas);
  }
  
  return null;
}

function detectarAgradecimento(texto) {
  const t = normalizar(texto);
  const agradecimentos = baseConhecimento?.respostasInteligentes?.agradecimentos;
  if (!agradecimentos?.gatilhos) return null;
  
  if (agradecimentos.gatilhos.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(agradecimentos.respostas);
  }
  return null;
}

function detectarDespedida(texto) {
  const t = normalizar(texto);
  const despedidas = baseConhecimento?.respostasInteligentes?.despedidas;
  if (!despedidas?.gatilhos) return null;
  
  if (despedidas.gatilhos.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(despedidas.respostas);
  }
  return null;
}

function detectarConfirmacao(texto) {
  const t = normalizar(texto);
  const confirmacoes = baseConhecimento?.respostasInteligentes?.confirmacoes;
  if (!confirmacoes?.gatilhos) return null;
  
  if (confirmacoes.gatilhos.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(confirmacoes.respostas);
  }
  return null;
}

function detectarTudoBem(texto) {
  const t = normalizar(texto);
  const tudoBem = baseConhecimento?.respostasInteligentes?.tudoBem;
  if (!tudoBem?.gatilhos) return null;
  
  if (tudoBem.gatilhos.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(tudoBem.respostas);
  }
  return null;
}

function detectarQuemSou(texto) {
  const t = normalizar(texto);
  const quemSou = baseConhecimento?.respostasInteligentes?.quemSou;
  if (!quemSou?.gatilhos) return null;
  
  if (quemSou.gatilhos.some(g => t.includes(normalizar(g)))) {
    return respostaAleatoria(quemSou.respostas);
  }
  return null;
}

function detectarIntencaoTecnico(texto) {
  const t = normalizar(texto);
  const intencao = baseConhecimento?.intencaoTecnico;
  if (!intencao?.gatilhos) return null;
  
  for (const gatilho of intencao.gatilhos) {
    if (t.includes(normalizar(gatilho))) {
      return intencao.respostaPadrao;
    }
  }
  return null;
}

function buscarNaBase(texto) {
  if (!baseConhecimento?.categorias) return null;
  
  const t = normalizar(texto);
  
  for (const [id, cat] of Object.entries(baseConhecimento.categorias)) {
    for (const p of (cat.palavrasChave || [])) {
      if (t.includes(normalizar(p))) {
        return cat.respostaPadrao;
      }
    }
  }
  
  return null;
}

// =====================================
// IA
// =====================================
async function respostaIA(texto, telefone) {
  if (!groqClient || !config.groqApiKey) return null;
  
  try {
    const emp = baseConhecimento?.empresa || {};
    
    const prompt = `Você é um ATENDENTE VIRTUAL de uma assistência técnica de celulares e notebooks.

REGRAS:
1. Seja simpático e profissional
2. Use emojis com moderação (1-2 por msg)
3. Respostas curtas (máx 4 frases)
4. Se não souber, diga para digitar *menu* ou *atendente*
5. NUNCA invente valores exatos
6. Para conserto/orçamento, encaminhe para atendente

DADOS DA EMPRESA:
Nome: ${emp.nome || "Assistência Técnica"}
Endereço: ${emp.endereco || ""}, ${emp.cidade || ""}
WhatsApp: ${emp.telefone || ""}
Horário: ${emp.horarioAtendimento?.semana || ""}
Serviços: ${(emp.servicos || []).join(", ")}
Garantia: ${emp.garantia || "90 dias"}
Pagamento: ${(emp.formasPagamento || []).join(", ")}

PERGUNTA: ${texto}

RESPOSTA:`;

    const comp = await groqClient.chat.completions.create({
      model: MODELO_GROQ,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });
    
    return comp.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    log('ERRO', 'IA', e.message);
    estatisticas.erros++;
    return null;
  }
}

// =====================================
// EXPRESS
// =====================================
const app = express();
const server = http.createServer(app);
io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  const s = { ...config };
  if (s.groqApiKey) s.groqApiKey = s.groqApiKey.substring(0, 8) + "***";
  res.json(s);
});

app.get("/api/config/full", (req, res) => res.json(config));

app.post("/api/config", (req, res) => {
  salvarConfig({ ...config, ...req.body });
  if (config.groqApiKey?.trim()) {
    groqClient = new OpenAI({ apiKey: config.groqApiKey, baseURL: "https://api.groq.com/openai/v1" });
  }
  res.json({ ok: true });
});

app.get("/api/base", (req, res) => res.json(baseConhecimento || {}));

app.post("/api/base", (req, res) => {
  salvarBase(req.body);
  res.json({ ok: true });
});

app.post("/api/empresa", (req, res) => {
  if (!baseConhecimento) baseConhecimento = {};
  baseConhecimento.empresa = { ...baseConhecimento.empresa, ...req.body };
  salvarBase(baseConhecimento);
  res.json({ ok: true });
});

app.get("/api/pausados", (req, res) => {
  const l = [];
  clientesPausados.forEach((v, k) => l.push({ telefone: k, ...v }));
  res.json(l);
});

app.post("/api/pausar", (req, res) => {
  const { telefone, pausar } = req.body;
  if (!telefone) return res.status(400).json({ erro: "Telefone obrigatório" });
  if (pausar) clientesPausados.set(telefone, { pausado: true, desde: new Date().toISOString() });
  else clientesPausados.delete(telefone);
  res.json({ ok: true });
});

app.get("/api/stats", (req, res) => {
  res.json({ ...estatisticas, conectado: whatsappConectado, pausados: clientesPausados.size });
});

app.post("/api/disconnect", async (req, res) => {
  if (whatsappClient) {
    whatsappConectado = false;
    try { await whatsappClient.destroy(); } catch (e) {}
    whatsappClient = null;
  }
  res.json({ ok: true });
});

app.post("/api/restart", async (req, res) => {
  if (whatsappClient) {
    try { await whatsappClient.destroy(); } catch (e) {}
    whatsappClient = null;
  }
  whatsappConectado = false;
  if (req.query.limpar === "1") {
    const auth = path.join(__dirname, ".wwebjs_auth");
    if (fs.existsSync(auth)) fs.rmSync(auth, { recursive: true });
  }
  io.emit("qr", "loading");
  initWhatsApp(true);
  res.json({ ok: true });
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// =====================================
// MENU
// =====================================
function getMenu(protocolo) {
  const emp = baseConhecimento?.empresa?.nome || "nossa assistência";
  return `Olá! Bem-vindo(a) à *${emp}*! 😊

📋 Protocolo: ${protocolo}

*Escolha uma opção:*

1️⃣ Serviços
2️⃣ Horários
3️⃣ Valores
4️⃣ Localização
5️⃣ Pagamento
6️⃣ Garantia
7️⃣ Falar com Atendente

Ou digite sua pergunta!`;
}

// =====================================
// PAUSAR BOT
// =====================================
async function pausarBotParaAtendente(telefone, motivo = "atendente_entrou") {
  if (clientesPausados.has(telefone)) return;
  
  clientesPausados.set(telefone, { pausado: true, motivo, desde: new Date().toISOString() });
  atendenteAtivo.set(telefone, Date.now());
  estatisticas.atendenteIntervencoes++;
  
  log('SUCESSO', 'ATENDENTE', `🛑 Atendente ENTROU - Bot pausado: ${telefone.substring(0, 20)}`);
  
  io.emit("atendente_entrou", { telefone, timestamp: new Date().toISOString() });
  
  const pausados = [];
  clientesPausados.forEach((v, k) => pausados.push({ telefone: k, ...v }));
  io.emit("pausados", pausados);
}

// =====================================
// ENVIAR MENSAGEM
// =====================================
async function enviarMsg(telefone, mensagem) {
  try {
    mensagensEnviadasPeloBot.set(telefone, Date.now());
    await whatsappClient.sendMessage(telefone, mensagem);
    estatisticas.mensagensEnviadas++;
    log('DEBUG', 'ENVIO', `Enviado para ${telefone.substring(0, 20)}`);
  } catch (e) {
    log('ERRO', 'ENVIO', e.message);
    estatisticas.erros++;
  }
}

// =====================================
// ENCAMINHAR ATENDENTE
// =====================================
async function encaminharAtendente(from, motivo = "transferencia") {
  clientesPausados.set(from, { pausado: true, motivo, desde: new Date().toISOString() });
  const sessao = sessoesAtendimento.get(from);
  await enviarMsg(from, `Transferindo para atendente! 👨‍🔧\n\n📋 Protocolo: ${sessao?.protocolo || gerarProtocolo()}\n\nAguarde um momento.\n\n_Digite "bot" para voltar._`);
  log('INFO', 'TRANSFER', `Encaminhado: ${from}`);
}

// =====================================
// WHATSAPP
// =====================================
function initWhatsApp(force = false) {
  if (whatsappClient && !force) return;
  if (whatsappClient && force) whatsappClient = null;

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "bot-pro" }),
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
    log('INFO', 'WPP', 'WhatsApp conectado!');
  });

  whatsappClient.on("disconnected", () => {
    whatsappConectado = false;
    io.emit("status", { conectado: false, mensagem: "Desconectado" });
    log('WARN', 'WPP', 'Desconectado');
  });

  // Detectar quando atendente LÊ
  whatsappClient.on("message_ack", async (msg, ack) => {
    if (ack !== 3 || !msg.fromMe) return;
    const telefone = msg.to;
    if (telefone.includes("@g.us") || telefone.includes("broadcast")) return;
    
    const ult = mensagensEnviadasPeloBot.get(telefone) || 0;
    if (Date.now() - ult < 3000) return;
    
    log('INFO', 'ACK', `📖 Atendente LEU: ${telefone.substring(0, 15)}`);
    await pausarBotParaAtendente(telefone, "atendente_leu");
  });

  // Detectar quando atendente ENVIA
  whatsappClient.on("message_create", async (msg) => {
    if (!msg.fromMe) return;
    const tel = msg.to;
    if (tel.includes("@g.us") || tel.includes("broadcast")) return;
    
    const txt = (msg.body || "").trim().toLowerCase();
    
    if (txt === "!on") {
      clientesPausados.delete(tel);
      atendenteAtivo.delete(tel);
      await whatsappClient.sendMessage(tel, "✅ Bot reativado.");
      return;
    }
    if (txt === "!off") {
      clientesPausados.set(tel, { pausado: true, motivo: "comando" });
      await whatsappClient.sendMessage(tel, "⏸️ Bot pausado.");
      return;
    }
    if (txt === "!status") {
      await whatsappClient.sendMessage(tel, clientesPausados.has(tel) ? "⏸️ PAUSADO" : "✅ ATIVO");
      return;
    }
    
    const ult = mensagensEnviadasPeloBot.get(tel) || 0;
    if (Date.now() - ult < 3000) return;
    
    await pausarBotParaAtendente(tel, "atendente_enviou");
  });

  whatsappClient.on("message", handleMensagem);

  whatsappClient.initialize().catch(err => {
    log('ERRO', 'WPP', 'Falha: ' + err.message);
    estatisticas.erros++;
  });
}

// =====================================
// PROCESSAR MENSAGEM
// =====================================
async function handleMensagem(msg) {
  const from = msg.from || "";
  
  if (from.includes("status") || from.includes("broadcast") || from.includes("@g.us")) return;
  
  try {
    const chat = await msg.getChat();
    if (chat.isGroup) return;
  } catch (e) { return; }
  
  if (msg.timestamp && (Date.now() / 1000 - msg.timestamp) > 300) return;

  const texto = msg.body?.trim() || "";
  if (!texto || texto.length > 1000) return;

  if (filaProcessamento.has(from)) return;
  filaProcessamento.set(from, true);

  estatisticas.mensagensRecebidas++;

  try {
    await processarMensagem(msg, from, texto);
  } catch (e) {
    log('ERRO', 'PROC', e.message);
    estatisticas.erros++;
  } finally {
    filaProcessamento.delete(from);
  }
}

// =====================================
// LÓGICA PRINCIPAL
// =====================================
async function processarMensagem(msg, from, texto) {
  const textoLower = texto.toLowerCase();

  // Verificar pausa
  if (clientesPausados.has(from)) {
    if (textoLower === "bot" || textoLower === "menu" || textoLower === "atendente") {
      clientesPausados.delete(from);
      atendenteAtivo.delete(from);
      log('INFO', 'REATIVAR', `Reativado: ${from.substring(0, 15)}`);
    } else {
      return;
    }
  }

  ultimaInteracao.set(from, Date.now());

  // Typing
  try {
    const chat = await msg.getChat();
    await delay(300);
    await chat.sendStateTyping();
    await delay(500);
  } catch (e) {}

  // 1. INTENÇÃO TÉCNICA → Atendente
  const intencaoTec = detectarIntencaoTecnico(texto);
  if (intencaoTec) {
    log('INFO', 'INTENCAO', `Intenção técnica: ${from.substring(0, 15)}`);
    await encaminharAtendente(from, "intencao_tecnica");
    return;
  }

  // 2. PEDIDO DE ATENDENTE
  if (textoLower.includes("atendente") || textoLower.includes("humano") || textoLower.includes("falar com") || textoLower.includes("pessoa")) {
    await encaminharAtendente(from, "cliente_solicitou");
    return;
  }

  // 3. SAUDAÇÕES (bom dia, boa tarde, oi, olá)
  const saudacao = detectarSaudacao(texto);
  if (saudacao) {
    log('INFO', 'SAUDACAO', `Saudação detectada: ${texto.substring(0, 20)}`);
    
    let sessao = sessoesAtendimento.get(from);
    if (!sessao) {
      sessao = { protocolo: gerarProtocolo(), inicio: new Date().toISOString() };
      sessoesAtendimento.set(from, sessao);
      estatisticas.atendimentosHoje++;
    }
    
    if (!horarioAtendimento() && config.mensagemForaHorario) {
      await enviarMsg(from, `${saudacao}\n\n⚠️ ${config.mensagemForaHorario}\n\n📋 Protocolo: ${sessao.protocolo}`);
      return;
    }
    
    await enviarMsg(from, `${saudacao}\n\n${getMenu(sessao.protocolo)}`);
    return;
  }

  // 4. TUDO BEM / COMO VAI
  const tudoBem = detectarTudoBem(texto);
  if (tudoBem) {
    await enviarMsg(from, tudoBem);
    return;
  }

  // 5. QUEM É VOCÊ
  const quemSou = detectarQuemSou(texto);
  if (quemSou) {
    await enviarMsg(from, quemSou);
    return;
  }

  // 6. AGRADECIMENTOS
  const agradecimento = detectarAgradecimento(texto);
  if (agradecimento) {
    await enviarMsg(from, agradecimento);
    return;
  }

  // 7. DESPEDIDAS
  const despedida = detectarDespedida(texto);
  if (despedida) {
    await enviarMsg(from, despedida);
    return;
  }

  // 8. CONFIRMAÇÕES
  const confirmacao = detectarConfirmacao(texto);
  if (confirmacao) {
    await enviarMsg(from, confirmacao);
    return;
  }

  // 9. MENU NUMÉRICO
  const num = parseInt(texto);
  if (!isNaN(num) && num >= 1 && num <= 7) {
    const cats = baseConhecimento?.categorias || {};
    const resp = {
      1: cats.servicos?.respostaPadrao,
      2: cats.horarios?.respostaPadrao,
      3: cats.valores?.respostaPadrao,
      4: cats.localizacao?.respostaPadrao,
      5: cats.pagamento?.respostaPadrao,
      6: cats.garantia?.respostaPadrao
    };
    
    if (num === 7) {
      await encaminharAtendente(from, "menu");
      return;
    }
    
    await enviarMsg(from, resp[num] || "Opção não encontrada.");
    return;
  }

  // 10. MENU/BOT/INICIO
  if (["menu", "bot", "inicio", "start"].includes(textoLower)) {
    let sessao = sessoesAtendimento.get(from);
    if (!sessao) {
      sessao = { protocolo: gerarProtocolo(), inicio: new Date().toISOString() };
      sessoesAtendimento.set(from, sessao);
      estatisticas.atendimentosHoje++;
    }
    await enviarMsg(from, getMenu(sessao.protocolo));
    return;
  }

  // 11. BUSCAR NA BASE
  const respBase = buscarNaBase(texto);
  if (respBase) {
    log('INFO', 'BASE', `Resposta base: ${from.substring(0, 15)}`);
    await enviarMsg(from, respBase);
    return;
  }

  // 12. IA
  if (config.useAI && groqClient) {
    const respIA = await respostaIA(texto, from);
    if (respIA) {
      log('INFO', 'IA', `Resposta IA: ${from.substring(0, 15)}`);
      await enviarMsg(from, respIA);
      return;
    }
  }

  // 13. FALLBACK
  const fallback = baseConhecimento?.fallback?.resposta || "Algumas informações você Pode Tirar Com técnico. Digite *menu* para ver as opções!";
  await enviarMsg(from, fallback);
}

// =====================================
// SOCKET
// =====================================
io.on("connection", (socket) => {
  socket.emit("status", { conectado: whatsappConectado, mensagem: whatsappConectado ? "Conectado!" : "Aguardando..." });
  if (!whatsappConectado) socket.emit("qr", "loading");
  
  const pausados = [];
  clientesPausados.forEach((v, k) => pausados.push({ telefone: k, ...v }));
  socket.emit("pausados", pausados);
  socket.emit("stats", estatisticas);
});

// =====================================
// LIMPEZA
// =====================================
setInterval(() => {
  const agora = Date.now();
  ultimaInteracao.forEach((ts, tel) => {
    if (agora - ts > 1800000) {
      ultimaInteracao.delete(tel);
      sessoesAtendimento.delete(tel);
    }
  });
}, 60000);

setInterval(criarBackup, 3600000);

// =====================================
// INICIAR
// =====================================
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🤖 BOT WHATSAPP PROFISSIONAL v7.2                      ║
║                                                          ║
║   ✅ Saudações inteligentes (bom dia/tarde/noite)        ║
║   ✅ Agradecimentos, despedidas, confirmações            ║
║   ✅ Detecção de intenção técnica                        ║
║   ✅ Modelo Groq atualizado                              ║
║                                                          ║
║   🌐 Painel: http://localhost:${PORT}                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  log('INFO', 'SISTEMA', 'Bot v7.2 iniciado - Modelo: ' + MODELO_GROQ);
  io.emit("qr", "loading");
  initWhatsApp();
});
