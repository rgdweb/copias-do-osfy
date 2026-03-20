# TecOS - Sistema de Ordens de Serviço para Assistências Técnicas

## 📋 INFORMAÇÕES GERAIS

**Nome do Sistema:** TecOS
**Tipo:** SaaS Multi-loja para Assistências Técnicas
**URL de Produção:** https://tec-os.vercel.app
**Repositório GitHub:** https://github.com/rgdweb/osfy
**Branch Principal:** main

---

## 🔧 TECNOLOGIAS UTILIZADAS

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Banco de Dados:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Pagamentos:** Asaas (PIX, Boleto)
- **Deploy:** Vercel (automático via GitHub)

---

## 🔐 CREDENCIAIS E TOKENS

### GitHub
- **Repositório:** https://github.com/rgdweb/osfy
- **Token:** Configurado no ambiente (não expor em arquivos)

### Banco de Dados (Neon)
- Configurado no sistema para sincronização automática
- O Prisma gerencia as migrations

### Asaas (Pagamentos)
- **Sandbox (Testes):**
  - URL API: `https://sandbox.asaas.com/api/v3`
  - API Keys começam com `$aact_`
- **Produção:**
  - URL API: `https://api.asaas.com/v3`
  - API Keys começam com `$aaprod_`
- **Webhook URL:** `https://tec-os.vercel.app/api/webhooks/asaas`

---

## 📁 ESTRUTURA DO PROJETO

```
/home/z/my-project/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── app/
│   │   ├── api/               # APIs Backend
│   │   │   ├── auth/          # Autenticação (login)
│   │   │   ├── lojas/         # Criação de lojas
│   │   │   ├── webhooks/asaas/# Webhook do Asaas
│   │   │   ├── superadmin/    # APIs do superadmin
│   │   │   └── configuracoes-publicas/
│   │   ├── criar-loja/        # Formulário de cadastro
│   │   ├── painel/            # Painel da loja
│   │   ├── superadmin/        # Painel administrativo
│   │   ├── loja/[slug]/       # Página pública da loja
│   │   └── os/[id]/           # Página pública da OS
│   ├── components/            # Componentes React
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── auth/              # Autenticação
│   │   └── asaas.ts           # Integração Asaas
│   └── types/                 # Tipos TypeScript
├── TECOS_SISTEMA.md           # Este arquivo
└── worklog.md                 # Log de trabalho
```

---

## 🗄️ MODELOS DO BANCO DE DADOS

### Loja
- `id`, `nome`, `slug` (único), `responsavel`
- `telefone`, `whatsapp`, `email` (único), `senhaHash`
- `cidade`, `estado`, `endereco`, `descricao`, `logo`
- `horarioAtendimento`, `tiposServico`
- `status` (pendente, ativo, bloqueado, cancelado)
- `plano` (mensal, anual)
- `precoPlano` (valor definido no cadastro)
- `expiraEm`

### Fatura
- `id`, `lojaId`, `numeroFatura`, `valor`, `status`
- `formaPagamento`, `asaasId`, `asaasCustomerId`
- `codigoPix`, `qrCodePix`, `linkBoleto`, `linkPagamento`
- `dataVencimento`, `dataPagamento`, `referencia`

### ConfiguracaoPagamento
- `asaasApiKey`, `asaasAmbiente` (sandbox/producao)
- `valorMensalidade` (padrão: 29.90)
- `valorAnuidade` (padrão: 290.00)
- `diaVencimento` (padrão: 10)
- `diasBloqueio` (padrão: 20)
- `webhookSecret`

### Outros modelos
- `SuperAdmin` - Administradores do sistema
- `Usuario` - Usuários das lojas
- `Cliente` - Clientes das lojas
- `OrdemServico` - Ordens de serviço
- `HistoricoOS`, `FotoOS`, `Assinatura`
- `Categoria`, `Produto`, `Venda`, `ItemVenda` (PDV)
- `Caixa`, `MovimentacaoCaixa`
- `Configuracao`, `ContadorOS`

---

## 💰 SISTEMA DE PAGAMENTOS (ASAAS)

### Fluxo de Cadastro
1. Usuário preenche formulário em `/criar-loja`
2. Escolhe plano: **Mensal (R$29/mês)** ou **Anual (R$290/ano)**
3. Sistema cria loja com status "pendente"
4. Sistema cria cobrança no Asaas automaticamente
5. Tela de sucesso mostra QR Code PIX e links de pagamento
6. **7 dias grátis** para testar o sistema

### Formas de Pagamento Aceitas
- PIX (QR Code + Copia e Cola)
- Boleto Bancário
- Cartão (via link Asaas)

### Webhook
- URL: `https://tec-os.vercel.app/api/webhooks/asaas`
- Recebe notificações de pagamento confirmado
- Atualiza status da fatura automaticamente
- Libera/ativa a loja quando pagamento confirmado

---

## 👤 TIPOS DE USUÁRIO

### SuperAdmin
- Acessa `/superadmin`
- Gerencia todas as lojas
- Configura integração Asaas
- Configura preços e regras de cobrança
- Visualiza faturas e pagamentos

### Loja (Admin)
- Acessa `/painel`
- Gerencia sua loja
- Cria e gerencia OS
- Visualiza clientes
- PDV (Ponto de Venda)

### Cliente
- Acessa `/os/[id]` (público, sem login)
- Acompanha status da OS
- Vê timeline do reparo
- Aprova orçamentos
- Assina digitalmente

---

## 📱 PÁGINAS PRINCIPAIS

### Públicas
- `/` - Landing page do TecOS
- `/criar-loja` - Cadastro de novas lojas
- `/loja/[slug]` - Página pública da loja
- `/os/[id]` - Acompanhamento de OS pelo cliente

### SuperAdmin
- `/superadmin` - Dashboard administrativo
- `/superadmin/lojas` - Gerenciar lojas
- `/superadmin/configuracoes` - Configurações (Site, Asaas, Cobrança)
- `/superadmin/faturas` - Gerenciar faturas

### Painel da Loja
- `/painel` - Dashboard da loja
- `/painel/os` - Lista de OS
- `/painel/os/[id]` - Detalhes da OS
- `/painel/clientes` - Gerenciar clientes
- `/painel/pdv` - Ponto de Venda
- `/painel/caixa` - Controle de caixa
- `/painel/produtos` - Estoque
- `/painel/configuracoes` - Configurações da loja

---

## ⚙️ CONFIGURAÇÕES DO SISTEMA

### Aba "Site" (`/superadmin/configuracoes`)
- Nome do sistema
- Descrição
- Preço mensal (R$)
- Preço anual (R$)
- WhatsApp de contato
- Email de contato
- Termos de Uso
- Política de Privacidade

### Aba "Asaas"
- Ambiente (Sandbox/Produção)
- API Key do Asaas
- Botão "Testar Conexão"
- URL do Webhook (para copiar)
- Token do Webhook

### Aba "Cobrança"
- Valor da Mensalidade
- Valor da Anuidade
- Dia do Vencimento
- Dias para Bloqueio

---

## 🔄 FLUXO DE TRABALHO

### Cadastro de Nova Loja
1. Acessa `/criar-loja`
2. Preenche dados da loja
3. Preenche dados de acesso (email/senha)
4. Preenche localização
5. Seleciona tipos de serviço
6. Escolhe plano (mensal/anual)
7. Aceita termos
8. Sistema cria loja + cobrança Asaas
9. Mostra QR Code PIX para pagamento
10. **7 dias grátis** para usar o sistema
11. Após pagamento, loja é ativada

### Criação de OS
1. Loja acessa `/painel/os`
2. Clica em "Nova OS"
3. Busca ou cria cliente
4. Preenche dados do equipamento
5. Descreve problema
6. Sistema gera número da OS
7. Sistema gera link público para cliente
8. Cliente acompanha online

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Erro P1001 - Banco Neon inacessível
- **Solução:** Removido `prisma db push` do script de build

### Erro CORS no teste Asaas
- **Solução:** Criado backend API `/api/superadmin/asaas/testar`

### Alterações não aparecem no site
- **Causa:** Push para branch errado
- **Solução:** Sempre usar `git push origin main`

### "Chave de API não pertence a este ambiente"
- **Causa:** URL errada para o ambiente
- **Solução:**
  - Sandbox: `https://sandbox.asaas.com/api/v3`
  - Produção: `https://api.asaas.com/v3`

---

## 📝 COMANDOS ÚTEIS

### Git
```bash
# Verificar status
git status

# Adicionar todas mudanças
git add -A

# Commit
git commit -m "mensagem"

# Push para main
git push origin main
```

### Prisma
```bash
# Gerar client
npx prisma generate

# Abrir studio
npx prisma studio

# Criar migration
npx prisma migrate dev --name nome
```

### Next.js
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

---

## 🔮 PRÓXIMAS IMPLEMENTAÇÕES (SUGESTÕES)

- [ ] Sistema de notificação por email
- [ ] Integração WhatsApp para notificar clientes
- [ ] Relatórios e gráficos no dashboard
- [ ] App mobile para técnicos
- [ ] Sistema de agendamento
- [ ] Backup automático
- [ ] Logs de auditoria
- [ ] Multi-idiomas

---

## 📞 CONTATOS

- **GitHub:** https://github.com/rgdweb/osfy
- **Deploy:** https://tec-os.vercel.app
- **Banco:** Neon (PostgreSQL)

---

## 📅 HISTÓRICO DE ATUALIZAÇÕES

### 2025-01-XX - Sistema de Pagamentos e Trials
- **Página de Pagamento Profissional** (`/painel/pagamento`)
  - QR Code PIX grande e legível
  - Opção de boleto bancário
  - Link para página Asaas (cartão, PIX, etc)
  - Histórico de pagamentos
  - Cards de escolha mensal/anual
  
- **Sistema de Trial (7 dias grátis)**
  - Toda nova loja tem 7 dias grátis
  - Contador de dias restantes no painel
  - Página de trial expirado com opções de pagamento
  - Bloqueio automático após trial/pagamento vencido

- **Barra de Aviso no Painel**
  - Verde/âmbar: Trial ativo (dias restantes)
  - Laranja: Pagamento pendente
  - Vermelho: Atrasado (dias de atraso, valor com juros)
  - Vermelho pulsante: Bloqueado

- **APIs de Pagamento**
  - `/api/painel/status-pagamento` - Status completo
  - `/api/painel/gerar-cobranca` - Criar nova cobrança
  
- **Área SuperAdmin para Trials** (`/superadmin/trials`)
  - Estatísticas: total, em trial, expirando, ativas, etc
  - Filtros por status
  - Estender trial (7, 15, 30 dias)
  - Ativar loja manualmente
  - Busca por nome/email/slug

### Anterior
- Implementado sistema de planos mensal/anual
- Cobrança automática via Asaas no cadastro
- QR Code PIX na tela de sucesso
- Configurações de valor anual no superadmin

### Anterior
- Sistema multi-loja funcional
- PDV completo
- Integração Asaas (PIX, Boleto)
- Webhook para confirmação de pagamento
- Páginas públicas de OS e loja

---

**SE PERDER A MEMÓRIA, CONSULTE O GITHUB:**
https://github.com/rgdweb/osfy

**ARQUIVO DE LOG DE TRABALHO:**
/home/z/my-project/worklog.md

**Este arquivo está em:**
/home/z/my-project/TECOS_SISTEMA.md
