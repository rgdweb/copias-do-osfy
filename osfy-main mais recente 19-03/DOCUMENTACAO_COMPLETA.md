# TecOS - Sistema de Gestão de Ordens de Serviço

## 📋 Visão Geral

TecOS é um SaaS multi-loja para assistências técnicas, desenvolvido com Next.js 16, PostgreSQL (Neon) e Prisma ORM.

---

## 🔗 Links Importantes

| Item | URL |
|------|-----|
| **Site Principal** | https://tec-os.vercel.app |
| **GitHub** | https://github.com/rgdweb/osfy.git |
| **Branch Produção** | `main` |
| **Vercel Dashboard** | https://vercel.com/sites-projects-5055e519/tec-os |

---

## 🔐 Credenciais

### GitHub
- **Token**: (veja com o desenvolvedor)
- **Repositório**: `https://github.com/rgdweb/osfy.git`

### Servidor de Imagens (Upload)
- **URL Upload**: `https://sorteiomax.com.br/tecos-uploads/upload.php`
- **URL Delete**: `https://sorteiomax.com.br/tecos-uploads/delete.php`
- **URL Base Imagens**: `https://sorteiomax.com.br/tecos-uploads/`
- **API Key**: `a8f7d9e2b4c1m6n3p5q0r9s2t8u1v4w7`

### Banco de Dados (Neon PostgreSQL)
- Configurado via variável de ambiente `DATABASE_URL` no Vercel

---

## 🚀 Comandos Importantes

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento (porta 3000)
npm run build        # Gera Prisma Client + Aplica migrações + Build de produção
npm run start        # Inicia servidor de produção
```

### Banco de Dados
```bash
npm run db:push      # Aplica schema ao banco (sem migrações)
npm run db:generate  # Gera Prisma Client
npm run db:migrate   # Cria e aplica migrações
npm run db:reset     # Reseta banco e executa seed
npm run db:seed      # Popula banco com dados iniciais
```

### Git
```bash
git add . && git commit -m "mensagem" && git push origin main
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # APIs REST
│   │   ├── auth/               # Autenticação
│   │   ├── painel/             # APIs do painel da loja
│   │   │   ├── os/             # Ordens de serviço
│   │   │   ├── clientes/       # Clientes
│   │   │   ├── pdv/            # Ponto de venda
│   │   │   │   ├── produtos/   # Produtos
│   │   │   │   ├── vendas/     # Vendas
│   │   │   │   ├── categorias/ # Categorias
│   │   │   │   └── caixa/      # Controle de caixa
│   │   │   ├── upload/         # Upload de imagens
│   │   │   └── dashboard/      # Estatísticas
│   │   ├── superadmin/         # APIs do super admin
│   │   └── lojas/              # Cadastro de lojas
│   ├── painel/                 # Painel da loja
│   │   ├── os/                 # Ordens de serviço
│   │   ├── clientes/           # Clientes
│   │   ├── pdv/                # Ponto de venda
│   │   │   ├── produtos/       # Gerenciar produtos
│   │   │   ├── vendas/         # Histórico de vendas
│   │   │   └── categorias/     # Categorias
│   │   └── configuracoes/      # Configurações da loja
│   ├── superadmin/             # Painel super admin
│   ├── loja/[slug]/            # Página pública da loja
│   └── os/[id]/                # Página pública da OS
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   └── painel/                 # Componentes do painel
├── lib/
│   ├── auth/                   # Sistema de autenticação JWT
│   ├── db.ts                   # Cliente Prisma
│   └── upload.ts               # Utilitários de upload
├── types/                      # Tipos TypeScript
└── prisma/
    ├── schema.prisma           # Schema do banco de dados
    └── seed.ts                 # Dados iniciais
```

---

## 🗄️ Schema do Banco de Dados

### Modelos Principais

| Modelo | Descrição |
|--------|-----------|
| `SuperAdmin` | Administradores do sistema |
| `Loja` | Lojas/empresas cadastradas |
| `Usuario` | Usuários das lojas (admin/técnico) |
| `Cliente` | Clientes das lojas |
| `OrdemServico` | Ordens de serviço |
| `HistoricoOS` | Histórico de status das OS |
| `FotoOS` | Fotos das ordens de serviço |
| `Assinatura` | Assinaturas digitais |
| `Categoria` | Categorias de produtos |
| `Produto` | Produtos do estoque |
| `Venda` | Vendas do PDV |
| `ItemVenda` | Itens de cada venda |
| `Caixa` | Controle de caixa |
| `Fatura` | Faturas de cobrança |

---

## 🔧 Sistema de Upload de Imagens

### Como Funciona
1. Frontend envia arquivo para `/api/painel/upload`
2. API encaminha para servidor PHP externo (`sorteiomax.com.br`)
3. Servidor PHP salva em pasta organizada por loja
4. URL da imagem é retornada e salva no banco

### Tipos de Upload
- `logo` - Logo da loja
- `produto` - Foto do produto
- `os` - Foto da ordem de serviço
- `banner` - Banner da loja
- `usuario` - Foto do usuário

### Estrutura de Pastas no Servidor
```
tecos-uploads/
├── {lojaId}/
│   ├── logo/
│   ├── produto/
│   ├── os/
│   └── usuario/
```

---

## 🔐 Sistema de Autenticação

### Tipos de Usuário
1. **superadmin** - Administrador do sistema
2. **loja** - Dono da loja (acesso completo)
3. **usuario** - Funcionário (admin/técnico)

### Fluxo de Login
1. POST `/api/auth/login` (loja) ou `/api/auth/superadmin` (superadmin)
2. Validação de email/senha
3. Geração de token JWT (validade: 7 dias)
4. Token armazenado em cookie HTTP-only

### Proteção de Rotas
- Middleware verifica token em rotas protegidas
- APIs usam `getCurrentUser()` para obter usuário logado
- `user.lojaId` para filtrar dados por loja

---

## ⚠️ Problemas Conhecidos e Soluções

### 1. Imagem não aparece (INVALID_IMAGE_OPTIMIZE_REQUEST)
**Causa**: Componente `<Image>` do Next.js não aceita URLs externas sem configuração
**Solução**: Usar `<img>` HTML normal para imagens externas

### 2. Branch errado no Git (master vs main)
**Causa**: Git configurado para master, mas Vercel monitora main
**Solução**: Sempre usar `git push origin main`

### 3. Build falhando no Vercel
**Causa**: Arquivos de sistema no repositório
**Solução**: Verificar `.gitignore` e remover arquivos indevidos

### 4. Dados não aparecem nas listagens
**Causa**: Schema atualizado mas banco sem novos campos
**Solução**: Usar `select` com campos específicos ou rodar `prisma db push`

---

## 📱 Páginas Principais

### Painel da Loja
- `/painel` - Dashboard
- `/painel/os` - Lista de OS
- `/painel/os/nova` - Nova OS
- `/painel/os/[id]` - Detalhes da OS
- `/painel/clientes` - Lista de clientes
- `/painel/pdv` - Frente de caixa
- `/painel/pdv/produtos` - Gerenciar produtos
- `/painel/pdv/vendas` - Histórico de vendas
- `/painel/pdv/categorias` - Categorias
- `/painel/configuracoes` - Configurações

### Super Admin
- `/superadmin` - Dashboard
- `/superadmin/lojas` - Gerenciar lojas
- `/superadmin/faturas` - Faturas
- `/superadmin/configuracoes` - Configurações do sistema

### Páginas Públicas
- `/loja/[slug]` - Página da loja
- `/os/[id]` - Acompanhamento de OS pelo cliente

---

## 🔄 Deploy Automático

O deploy é feito automaticamente pelo Vercel quando há push na branch `main`.

### Comando de Build
```
prisma generate && prisma db push --accept-data-loss && next build
```

Isso garante que:
1. Prisma Client é gerado
2. Schema é sincronizado com o banco
3. Build do Next.js é executado

---

## 📞 Contato e Suporte

- **Desenvolvedor**: rgdweb
- **GitHub**: https://github.com/rgdweb

---

## 📝 Changelog

### 2026-03-19
- ✅ Corrigido erro de soma do orçamento na OS (agora inclui orçamento + serviço + peças)
- ✅ Corrigido erro nas listagens de OS e Clientes (usando select específico)
- ✅ Adicionado campos cpf e endereco ao modelo Cliente
- ✅ Adicionado foto do produto no grid do PDV
- ✅ Implementado exclusão de imagens quando loja é apagada
- ✅ Configurado build para aplicar migrações automaticamente

### Anterior
- ✅ Sistema de upload de imagens funcionando
- ✅ Logo da loja aparecendo na página pública
- ✅ Perfil do painel da loja funcionando
- ✅ Sistema de autenticação JWT customizado
