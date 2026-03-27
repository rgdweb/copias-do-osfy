# 🤖 Bot WhatsApp Profissional v3.5

Bot de atendimento automatizado para WhatsApp com IA integrada e menus interativos.

## ✨ Recursos

- **Menus Interativos** - Popup com lista de opções clicáveis
- **Protocolo de Atendimento** - Número único para cada conversa
- **IA Integrada** - Respostas inteligentes via Groq (Llama 3.1)
- **Botões de Navegação** - Menu, Atendente, Encerrar
- **Painel Web** - Interface para configurar tudo
- **Base de Conhecimento** - Edite informações sem código

## 🚀 Instalação

### 1. Requisitos
- Node.js 18 ou superior
- NPM ou Yarn

### 2. Instalar dependências
```bash
npm install
```

### 3. Iniciar o bot
```bash
npm start
```

### 4. Acessar o painel
Abra no navegador: `http://localhost:3000`

### 5. Conectar WhatsApp
- Clique em "Gerar QR Code"
- Escaneie com o WhatsApp (Aparelhos > Conectar aparelho)

## ⚙️ Configuração

### Chave da IA (Groq)
1. Acesse https://console.groq.com/keys
2. Crie uma chave gratuita
3. Cole na aba "IA" do painel

### Dados da Empresa
- Preencha as abas: Empresa, Serviços, Horários, Pagamento
- Adicione informações extras na aba "Informações"

## 📋 Comandos

Envie pelo WhatsApp:

| Comando | Função |
|---------|--------|
| `!bot off` | Pausa o bot para o cliente |
| `!bot on` | Reativa o bot |
| `!bot status` | Mostra status atual |

## 📁 Estrutura

```
├── server.js           # Código principal
├── config.json         # Configurações (IA, modelo)
├── base-conhecimento.json  # Dados da empresa
├── package.json        # Dependências
├── public/
│   └── index.html      # Painel web
└── README.md           # Este arquivo
```

## 🔧 Hospedagem

Este bot precisa rodar 24/7. Opções recomendadas:

- **VPS** (DigitalOcean, Linode, Vultr)
- **Railway.app**
- **Seu próprio computador** (ligado sempre)

⚠️ **Não funciona na Vercel** (precisa de Puppeteer)

## 📞 Suporte

Em caso de dúvidas, consulte o painel web em `http://localhost:3000`

---

Desenvolvido com ❤️ usando whatsapp-web.js e Groq AI
