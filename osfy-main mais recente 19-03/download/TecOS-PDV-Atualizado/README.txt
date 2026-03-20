# TecOS - Arquivos PDV Atualizados

## Correções Realizadas

1. ✅ Pesquisa de produtos por nome (case-insensitive)
2. ✅ Seleção de impressão (58mm, 80mm, A4) no topo da tela
3. ✅ Cupom não fiscal formatado para cada tipo de impressão

## Estrutura de Arquivos

- prisma/schema.prisma - Banco de dados com tabelas do PDV
- src/app/painel/pdv/ - Páginas do PDV
- src/app/api/painel/pdv/ - APIs do PDV
- src/app/painel/layout.tsx - Menu lateral
- src/app/api/painel/dashboard/route.ts - Dashboard atualizado
- src/lib/db.ts - Configuração PostgreSQL
- src/components/ui/signature-canvas.tsx - Assinatura digital
- src/app/os/[id]/client.tsx - Impressão OS 1 via
- src/app/painel/os/[id]/client.tsx - Impressão OS 2 vias

## Como Atualizar

1. Substitua os arquivos no GitHub mantendo a estrutura de pastas
2. Faça commit e push
3. O Vercel fará deploy automático
4. Execute: npx prisma db push (se necessário)

## Funcionalidades do PDV

- Frente de caixa com leitor de código de barras
- Vendas avulsas (F3)
- Busca de produtos por nome/código (F2)
- Impressão térmica 58mm, 80mm ou A4
- Gestão de produtos e categorias
- Histórico de vendas
- Abrir/Fechar caixa
