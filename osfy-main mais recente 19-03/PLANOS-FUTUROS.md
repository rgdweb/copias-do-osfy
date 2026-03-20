# TecOS - Planejamento de Planos e Funcionalidades Futuras

## Status: AGUARDANDO IMPLEMENTAÇÃO
**Data do planejamento**: Janeiro 2025

---

## 1. Estrutura de Planos

### Teste Grátis
- 7 dias grátis
- Sem compromisso
- Acesso completo para testar

---

### 📊 Tabela de Preços Resumo

| Plano | Mensal | Semestral | Anual |
|-------|--------|-----------|-------|
| **Essencial** | R$ 99,90 | R$ 499,50 | R$ 999,00 |
| **Profissional** ⭐ | R$ 139,90 | R$ 699,50 | R$ 1.399,00 |
| **Avançado** | R$ 169,90 | R$ 849,50 | R$ 1.699,00 |

---

### Módulos Adicionais

| Módulo | Valor Mensal |
|--------|-------------|
| **Fiscal** (NF-e, NFC-e, NFS-e) | R$ 49,90 |
| **Integrações** (WhatsApp, APIs) | R$ 19,90 |

---

### Plano ESSENCIAL

| Período | Valor |
|---------|-------|
| **Mensal** | R$ 99,90/mês |
| **Semestral** | R$ 499,50/semestre |
| **Anual** | R$ 999,00/ano |

| Recurso | Incluso |
|---------|---------|
| Usuários | Até 3 |
| PDV completo | ✅ (computador e celular) |
| Formas de pagamento | ✅ |
| Recibos digitais | ✅ |
| Controle de crediário | ✅ |
| Cadastro de clientes | ✅ |
| Cadastro de produtos | ✅ |
| Cadastro de fornecedores | ✅ |
| Controle de estoque | ✅ |
| Catálogo online básico | ✅ |
| Ordem de serviço | ✅ |
| Assistente virtual | ✅ |
| Inteligência Artificial | 250 créditos |

---

### Plano PROFISSIONAL (MAIS POPULAR)

| Período | Valor |
|---------|-------|
| **Mensal** | R$ 139,90/mês |
| **Semestral** | R$ 699,50/semestre |
| **Anual** | R$ 1.399,00/ano |

| Recurso | Incluso |
|---------|---------|
| Tudo do Essencial | ✅ |
| Usuários | Até 5 |
| Controle de contas a pagar | ✅ |
| Cadastro de compras | ✅ |
| Importação de compras por XML | ✅ |
| Controle de taxas | ✅ |
| Controle de comissão | ✅ |
| Anexos em Ordens de Serviço | ✅ |
| Link de acompanhamento de OS | ✅ |
| Relatórios automáticos por e-mail | ✅ |
| Inteligência Artificial | 1.000 créditos |

---

### Plano AVANÇADO

| Período | Valor |
|---------|-------|
| **Mensal** | R$ 169,90/mês |
| **Semestral** | R$ 849,50/semestre |
| **Anual** | R$ 1.699,00/ano |

| Recurso | Incluso |
|---------|---------|
| Tudo do Profissional | ✅ |
| Usuários | Até 10 |
| Controle de metas de vendas | ✅ |
| Avaliação de atendimento no recibo | ✅ |
| Relatório DRE | ✅ |
| Assistente inteligente com IA | ✅ |
| Suporte prioritário | ✅ |
| Catálogo online PRO | ✅ |
| Controle de estoque por nº série/IMEI | ✅ |
| Inteligência Artificial | 1.000 créditos |

---

## 2. Módulos Adicionais

### Módulo Fiscal - R$ 49,90/mês
- Emissão de NF-e
- Emissão de NFC-e
- Emissão de NFS-e
- Até 500 emissões mensais
- Suporte fiscal especializado
- ⚠️ Obrigatório para quem precisa emitir nota fiscal

### Módulo Integrações/Extensões - R$ 19,90/mês
- Integrações com WhatsApp
- Integrações com CRMs e plataformas externas
- Automações de mensagens e processos
- Webhooks e API (Em breve)
- Ideal para automatizar vendas e atendimento

---

## 3. Planejamento Técnico de Implementação

### Fase 1 - Banco de Dados (Schema)

```prisma
// Nova tabela: Planos
model Plano {
  id            String   @id @default(cuid())
  nome          String   // "essencial", "profissional", "avancado"
  precoMensal   Decimal  @db.Decimal(10, 2)
  precoSemestral Decimal @db.Decimal(10, 2)
  precoAnual    Decimal  @db.Decimal(10, 2)
  usuarios      Int      @default(3)
  creditosIA    Int      @default(250)
  recursos      Json     // Lista de recursos inclusos
  ativo         Boolean  @default(true)
  criadoEm      DateTime @default(now())
  lojas         Loja[]
}

// Atualizar tabela Loja
model Loja {
  // ... campos existentes
  planoId         String?
  plano           Plano?  @relation(fields: [planoId], references: [id])
  cicloCobranca   String  @default("mensal") // "mensal", "semestral", "anual"
  trialInicio     DateTime?
  trialFim        DateTime?
  planoAtivo      Boolean @default(false)
  
  // Contadores de uso
  usuariosAtivos   Int @default(1)
  creditosIAUsados Int @default(0)
  
  // Módulos contratados
  moduloFiscal       Boolean @default(false)
  moduloIntegracoes  Boolean @default(false)
}
```

### Fase 2 - Controle de Acesso

```typescript
// Middleware para verificar limites do plano
interface LimitePlano {
  usuarios: number
  creditosIA: number
  recursos: string[]
  moduloFiscal: boolean
  moduloIntegracoes: boolean
}

// Função para verificar se recurso está disponível
function verificarRecurso(loja: Loja, recurso: string): boolean {
  const plano = loja.plano
  if (!plano) return false
  
  // Verificar se está no período de trial
  if (loja.trialFim && new Date() < loja.trialFim) {
    return true // Trial tem acesso completo
  }
  
  // Verificar se plano está ativo
  if (!loja.planoAtivo) return false
  
  // Verificar se recurso está incluso
  return plano.recursos.includes(recurso)
}
```

### Fase 3 - Fluxo de Pagamento

1. Usuário escolhe plano
2. Sistema cria período de trial (7 dias)
3. Redireciona para pagamento (MercadoPago/Asaas)
4. Webhook confirma pagamento
5. Ativa plano na loja

### Fase 4 - Interfaces a Criar/Modificar

#### Novas Páginas:
- `/planos` - Página de planos e preços
- `/pagamento` - Checkout
- `/painel/configuracoes/plano` - Gerenciar plano atual

#### Modificar:
- Página inicial (já tem preço simples, precisa dos 3 planos)
- Painel admin (verificar recursos antes de mostrar)
- PDV (pode precisar de limites)
- OS (limitar anexos conforme plano)

---

## 4. Priorização de Implementação

### Prioridade ALTA (Fazer primeiro):
1. ✅ Estrutura de planos no banco
2. ✅ Sistema de trial (7 dias)
3. ✅ Página de planos
4. ✅ Bloqueio de recursos por plano

### Prioridade MÉDIA:
5. Integração com gateway de pagamento
6. Sistema de assinatura recorrente
7. Módulos adicionais (Fiscal, Integrações)

### Prioridade BAIXA:
8. Relatórios automáticos por e-mail
9. Assistente IA com créditos
10. Importação XML de compras

---

## 5. Recursos por Plano (Tabela Completa)

### Usuários
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| Usuários | 3 | 5 | 10 |

### Vendas, clientes e atendimento
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| PDV completo | ✅ | ✅ | ✅ |
| Formas de pagamento | ✅ | ✅ | ✅ |
| Avaliação no recibo | ❌ | ❌ | ✅ |
| Recibos digitais | ✅ | ✅ | ✅ |
| Controle de comissões | ❌ | ✅ | ✅ |
| Controle de crediário | ✅ | ✅ | ✅ |
| Cadastro de clientes | ✅ | ✅ | ✅ |
| Metas de vendas | ❌ | ❌ | ✅ |

### Produtos, compras e estoque
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| Cadastro de produtos | ✅ | ✅ | ✅ |
| Catálogo online | ✅ | ✅ | ✅ |
| Catálogo online PRO | ❌ | ❌ | ✅ |
| Compras | ❌ | ✅ | ✅ |
| Importação XML | ❌ | ✅ | ✅ |
| Controle de estoque | ✅ | ✅ | ✅ |
| Estoque por IMEI | ❌ | ❌ | ✅ |
| Cadastro de fornecedores | ✅ | ✅ | ✅ |

### Inteligência e suporte
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| Assistente IA | ❌ | ❌ | ✅ |
| Créditos IA | 250 | 1.000 | 1.000 |
| Assistente virtual | ✅ | ✅ | ✅ |
| Relatórios por email | ❌ | ✅ | ✅ |
| Suporte prioritário | ❌ | ❌ | ✅ |

### Ordens de Serviço
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| Ordem de serviço | ✅ | ✅ | ✅ |
| Link acompanhamento OS | ❌ | ✅ | ✅ |
| Anexos em OS | ❌ | ✅ | ✅ |

### Financeiro
| Recurso | Essencial | Profissional | Avançado |
|---------|-----------|--------------|----------|
| Contas a pagar | ❌ | ✅ | ✅ |
| Controle de taxas | ❌ | ✅ | ✅ |
| Relatório DRE | ❌ | ❌ | ✅ |

---

## 6. Gateway de Pagamento Sugerido

### Opção 1: MercadoPago
- Assinaturas recorrentes
- PIX, Cartão, Boleto
- Webhooks confiáveis
- Taxa: ~4.99% + R$0,39

### Opção 2: Asaas
- Focado em assinaturas
- Melhor para SaaS
- Taxa: ~2.99% + R$0,39 (PIX)
- API mais simples

---

## 7. Checklist de Implementação

- [ ] Criar tabela Planos no schema
- [ ] Atualizar tabela Loja com campos de plano
- [ ] Criar seed dos 3 planos
- [ ] Criar página /planos
- [ ] Criar página /pagamento
- [ ] Implementar sistema de trial (7 dias)
- [ ] Criar middleware de verificação de plano
- [ ] Integrar gateway de pagamento
- [ ] Criar webhooks para confirmação
- [ ] Implementar bloqueios por recurso
- [ ] Criar painel de gerenciamento de plano
- [ ] Implementar módulos adicionais
- [ ] Testes completos

---

**Status**: 📋 PLANEJAMENTO CONCLUÍDO - AGUARDANDO INÍCIO DA IMPLEMENTAÇÃO

*Este documento será atualizado conforme o progresso da implementação.*
