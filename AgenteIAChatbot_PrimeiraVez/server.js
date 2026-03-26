/**
 * AGENTE DE IA + CHATBOT WHATSAPP
 * Backend com Express, WhatsApp Web.js, Groq AI e Socket.IO
 * QR Code aparece no navegador - sem terminal!
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const OpenAI = require("openai");

// =====================================
// CONFIGURAÇÃO
// =====================================
const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, "config.json");

let groqClient = null;
let whatsappClient = null;
let whatsappConectado = false;
let io = null;

// Carregar ou criar config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Erro ao carregar config:", e);
  }
  const defaultConfig = {
    groqApiKey: "",
    useAI: true,
    model: "llama-3.1-8b-instant",
    promptSistema: "Você é o assistente virtual da empresa. Seja simpático, profissional e objetivo. Responda dúvidas sobre horário, preços e serviços. Se não souber algo, peça para a pessoa aguardar que um atendente responderá.",
    flows: [
      {
        id: "1",
        palavras: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "menu"],
        resposta: "Olá! 👋 Sou o assistente virtual.\n\nComo posso ajudar?\n\n1 - Saber mais sobre nós\n2 - Falar com atendente\n3 - Horário de funcionamento\n\nDigite o número ou faça sua pergunta!",
      },
      {
        id: "2",
        palavras: ["1", "saber mais", "como funciona"],
        resposta: "Atendimento disponível! Envie sua dúvida que eu te ajudo ou repasso para um atendente.",
      },
      {
        id: "3",
        palavras: ["2", "atendente", "humano"],
        resposta: "Um atendente humano entrará em contato em breve. Por favor, aguarde.",
      },
      {
        id: "4",
        palavras: ["3", "horário", "horario", "funcionamento"],
        resposta: "Consulte nosso horário de atendimento. (Edite esta resposta na aba Fluxos com o horário da sua empresa)",
      },
    ],
  };
  saveConfig(defaultConfig);
  return defaultConfig;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

let config = loadConfig();

// Inicializar Groq se tiver API key
if (config.groqApiKey && config.groqApiKey.trim()) {
  groqClient = new OpenAI({
    apiKey: config.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// =====================================
// EXPRESS + SOCKET.IO
// =====================================
const app = express();
const server = http.createServer(app);
io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API: Salvar config
app.post("/api/config", (req, res) => {
  config = { ...config, ...req.body };
  saveConfig(config);
  if (config.groqApiKey && config.groqApiKey.trim()) {
    groqClient = new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  res.json({ ok: true });
});

// API: Obter config (sem expor a chave completa por segurança no log)
app.get("/api/config", (req, res) => {
  const safe = { ...config };
  if (safe.groqApiKey) safe.groqApiKey = safe.groqApiKey.substring(0, 8) + "***";
  res.json(safe);
});

// API: Config completa para edição (front envia só se usuário editar)
app.get("/api/config/full", (req, res) => {
  res.json(config);
});

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API: Desconectar WhatsApp
app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    if (whatsappClient) {
      whatsappConectado = false;
      try { await whatsappClient.destroy(); } catch (e) {}
      whatsappClient = null;
      io.emit("status", { conectado: false, mensagem: "Desconectado. Clique em Gerar novo QR Code para conectar novamente." });
    }
    res.json({ ok: true });
  } catch (e) {
    whatsappClient = null;
    res.json({ ok: true });
  }
});

// API: Gerar novo QR Code (reinicia o WhatsApp)
// ?limpar=1 para limpar sessão e tentar do zero (quando trava)
app.post("/api/whatsapp/restart", async (req, res) => {
  try {
    if (whatsappClient) {
      try { await whatsappClient.destroy(); } catch (e) {}
      whatsappClient = null;
    }
    whatsappConectado = false;

    // Limpar sessão se solicitado (resolve "não conecta" ou travamentos)
    if (req.query.limpar === "1") {
      const authPath = path.join(__dirname, ".wwebjs_auth");
      if (fs.existsSync(authPath)) {
        try {
          fs.rmSync(authPath, { recursive: true });
          console.log("Sessão limpa. Iniciando do zero.");
        } catch (e) {
          console.error("Erro ao limpar sessão:", e);
        }
      }
    }

    io.emit("qr", "loading");
    io.emit("status", { conectado: false, mensagem: "Gerando QR Code... Pode levar 1-2 minutos na primeira vez." });
    initWhatsApp(true);
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro ao reiniciar:", e);
    io.emit("status", { conectado: false, mensagem: "Erro. Clique em 'Limpar sessão e tentar' para recomeçar." });
    res.json({ ok: false, erro: e.message });
  }
});

// =====================================
// WHATSAPP
// =====================================
function initWhatsApp(force = false) {
  if (whatsappClient && !force) return;
  if (whatsappClient && force) {
    whatsappClient = null;
  }
  
  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "agente-ia" }),
    authTimeoutMs: 180000, // 3 min para escanear (evita timeout ao conectar)
    puppeteer: {
      headless: true,
      timeout: 120000, // 2 min para o navegador iniciar
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--no-first-run",
      ],
    },
  });

  whatsappClient.on("qr", async (qr) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 300 });
      io.emit("qr", qrDataUrl);
      io.emit("status", { conectado: false, mensagem: "Escaneie o QR Code com seu WhatsApp" });
    } catch (e) {
      console.error("Erro ao gerar QR:", e);
    }
  });

  whatsappClient.on("ready", () => {
    whatsappConectado = true;
    io.emit("qr", null); // limpa QR
    io.emit("status", { conectado: true, mensagem: "WhatsApp conectado!" });
    console.log("✅ WhatsApp conectado.");
  });

  whatsappClient.on("disconnected", () => {
    whatsappConectado = false;
    io.emit("status", { conectado: false, mensagem: "WhatsApp desconectado" });
  });

  whatsappClient.on("auth_failure", (msg) => {
    console.error("Falha na autenticação:", msg);
    io.emit("status", { conectado: false, mensagem: "Falha ao conectar. Clique em 'Limpar sessão e tentar'." });
  });

  whatsappClient.on("message", handleMessage);

  whatsappClient.initialize().catch((err) => {
    console.error("Erro ao inicializar WhatsApp:", err);
    whatsappClient = null;
    io.emit("status", { conectado: false, mensagem: "Erro ao iniciar. Feche outros programas e clique em 'Limpar sessão e tentar'." });
  });
}

// =====================================
// LÓGICA DE MENSAGENS
// =====================================
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function respostaPorFluxo(texto) {
  config = loadConfig();
  const txt = texto.trim().toLowerCase();
  for (const flow of config.flows || []) {
    for (const p of flow.palavras || []) {
      if (txt.includes(p.toLowerCase()) || txt === p.toLowerCase()) {
        return flow.resposta;
      }
    }
  }
  return null;
}

async function respostaPorIA(texto, contexto = "") {
  if (!groqClient || !config.groqApiKey) return null;
  try {
    const completion = await groqClient.chat.completions.create({
      model: config.model || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: config.promptSistema || "Você é um assistente prestativo." },
        ...(contexto ? [{ role: "user", content: contexto }] : []),
        { role: "user", content: texto },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    const res = completion.choices?.[0]?.message?.content;
    return res ? res.trim() : null;
  } catch (e) {
    console.error("Erro Groq:", e.message);
    return null;
  }
}

async function handleMessage(msg) {
  try {
    // Ignorar status e broadcast (evita inundar status com respostas automáticas)
    const from = (msg.from || "").toString();
    if (from.includes("status") || from.includes("broadcast") || msg.broadcast || msg.isStatus) return;
    if (!msg.from || msg.from.endsWith("@g.us")) return;
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    // Ignorar mensagens antigas (evita responder milhares ao conectar)
    const MAX_IDADE_SEGUNDOS = 300; // 5 minutos
    const agora = Math.floor(Date.now() / 1000);
    const ts = msg.timestamp || 0;
    if (ts > 0 && (agora - ts) > MAX_IDADE_SEGUNDOS) return;

    const texto = msg.body ? msg.body.trim() : "";
    if (!texto) return;

    const typing = async () => {
      await delay(800);
      await chat.sendStateTyping();
      await delay(1200);
    };

    // Recarregar config
    config = loadConfig();

    // 1) Tentar resposta por fluxo
    let resposta = await respostaPorFluxo(texto);

    // 2) Se não achou fluxo e IA está ativada, usar Groq
    if (!resposta && config.useAI) {
      resposta = await respostaPorIA(texto);
    }

    // 3) Fallback
    if (!resposta) {
      resposta = "Desculpe, não entendi. Digite 'menu' para ver as opções.";
    }

    await typing();
    await msg.reply(resposta);
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    try {
      await msg.reply("Ocorreu um erro. Tente novamente em instantes.");
    } catch (e) {}
  }
}

// =====================================
// SOCKET.IO - broadcast de status
// =====================================
io.on("connection", (socket) => {
  socket.emit("status", {
    conectado: whatsappConectado,
    mensagem: whatsappConectado ? "WhatsApp conectado!" : "Conecte escaneando o QR Code",
  });
  if (!whatsappConectado) {
    socket.emit("qr", "loading");
  }
});

// =====================================
// INICIAR
// =====================================
  server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🤖 AGENTE DE IA + CHATBOT WHATSAPP                      ║
║                                                          ║
║  Abra no navegador:  http://localhost:${PORT}             ║
║                                                          ║
║  O QR Code aparecerá na tela - escaneie com o WhatsApp!  ║
╚══════════════════════════════════════════════════════════╝
  `);
  io.emit("qr", "loading");
  initWhatsApp();
});
