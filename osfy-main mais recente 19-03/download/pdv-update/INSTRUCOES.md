# PDV - Ponto de Venda - Arquivos para Atualização

## 📋 Lista de Arquivos

### 1. Schema do Banco de Dados
```
prisma/schema.prisma
```

### 2. Componentes
```
src/components/ui/signature-canvas.tsx
```

### 3. APIs (Routes)
```
src/app/api/painel/pdv/produtos/route.ts
src/app/api/painel/pdv/produtos/[id]/route.ts
src/app/api/painel/pdv/categorias/route.ts
src/app/api/painel/pdv/categorias/[id]/route.ts
src/app/api/painel/pdv/caixa/route.ts
src/app/api/painel/pdv/caixa/fechar/route.ts
src/app/api/painel/pdv/vendas/route.ts
src/app/api/painel/dashboard/route.ts (MODIFICADO)
```

### 4. Páginas do Painel
```
src/app/painel/layout.tsx (MODIFICADO)
src/app/painel/page.tsx (MODIFICADO)
src/app/painel/pdv/page.tsx (NOVO - Frente de Caixa)
src/app/painel/pdv/produtos/page.tsx (NOVO)
src/app/painel/pdv/categorias/page.tsx (NOVO)
src/app/painel/pdv/vendas/page.tsx (NOVO)
```

### 5. Páginas de Impressão (Corrigidas)
```
src/app/painel/os/[id]/client.tsx (2 vias - A4 Paisagem)
src/app/os/[id]/client.tsx (1 via - A4 Normal)
```

---

## 🚀 Instruções de Deploy

### Passo 1: Atualizar GitHub
Substitua/Crie todos os arquivos listados acima

### Passo 2: Rodar Migration no Vercel
```bash
npx prisma db push
```

### Passo 3: Redeploy
O Vercel fará deploy automático após o push

---

## ⚡ Atalhos do PDV

| Tecla | Função |
|-------|--------|
| F2 | Buscar produto |
| F3 | Venda avulsa |
| F4 | Finalizar venda |

## 💰 Formas de Pagamento

- 💵 Dinheiro (com troco)
- 📱 PIX
- 💳 Cartão Crédito
- 💳 Cartão Débito

## 📦 Funcionalidades

- ✅ Leitor código de barras USB (automático via teclado)
- ✅ Venda avulsa (sem produto cadastrado)
- ✅ Carrinho com edição de quantidade
- ✅ Cálculo automático de troco
- ✅ Cupom fiscal para impressão
- ✅ Abertura/fechamento de caixa
- ✅ Controle de estoque
- ✅ Histórico de vendas
