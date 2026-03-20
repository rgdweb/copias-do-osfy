# Planos e Roadmap - TecOS

## 1. Modelo de Negócio (Inspirado no Apex Comércio)

### Planos de Assinatura

| Plano | Mensal | Semestral | Anual |
|-------|--------|-----------|-------|
| **Essencial** | R$ 99,90 | - | R$ 999,00 |
| **Profissional** | R$ 139,90 | - | R$ 1.399,00 |
| **Avançado** | R$ 169,90 | - | R$ 1.699,00 |

### Funcionalidades por Plano

#### Essencial (R$ 99,90/mês)
- Até 3 usuários
- Cadastro de produtos, clientes e fornecedores
- Controle de estoque
- Controle de crediário
- PDV completo (computador e celular)
- Formas de pagamento
- Recibos digitais
- Catálogo online básico

#### Profissional (R$ 139,90/mês)
- Tudo do Essencial +
- Até 5 usuários
- Controle de contas a pagar
- Cadastro de compras
- Importação de compras por XML
- Controle de taxas
- Controle de comissão
- Anexos em Ordens de Serviço
- Link de acompanhamento de OS
- Relatórios automáticos por e-mail

#### Avançado (R$ 169,90/mês)
- Tudo do Profissional +
- Até 10 usuários
- Controle de metas de vendas
- Avaliação de atendimento no recibo
- Relatório DRE
- Assistente inteligente com IA
- Suporte prioritário
- Catálogo online PRO
- Controle de estoque por número de série/IMEI

### Módulos Extras

| Módulo | Valor | Funcionalidades |
|--------|-------|-----------------|
| **Fiscal** | R$ 49,90/mês | NF-e, NFC-e, NFS-e (até 500 emissões/mês), Suporte fiscal |
| **Integrações** | R$ 19,90/mês | WhatsApp, CRMs, Automações, Webhooks, API |

---

## 2. Backup Automático

### Objetivo
Sistema de backup automático dos dados do TecOS para garantir segurança e recuperação de dados.

### Ideias a Debater
- [ ] Backup diário automático
- [ ] Backup para onde? (AWS S3, Google Drive, hospedagem própria)
- [ ] Backup do banco de dados (Neon/PostgreSQL)
- [ ] Backup de arquivos/imagens
- [ ] Retenção: quantos dias manter?
- [ ] Restauração fácil via painel admin

---

## 3. Servidor de Imagens/Arquivos

### Objetivo
Sistema para armazenar logos das lojas, imagens de produtos e anexos de OS.

### Opções Analisadas

#### Opção A: Cloud Storage (Externo)
| Serviço | Grátis | Pago | Prós | Contras |
|---------|--------|------|------|---------|
| Supabase Storage | 1GB | $0.021/GB | Fácil integração | Limite grátis pequeno |
| Cloudflare R2 | 10GB | $0.015/GB | Sem custo bandwidth | Configuração mais complexa |
| Backblaze B2 | 10GB | $0.005/GB | Muito barato | Interface menos amigável |
| Uploadthing | 2GB | $10/mês | Super fácil | Caro após grátis |

#### Opção B: Hospedagem Compartilhada (RECOMENDADO)
**Vantagens:**
- Já tem espaço ilimitado na hospedagem
- Sem custo adicional
- Controle total

**Como implementar:**
1. Criar script PHP na hospedagem (`upload.php`)
2. TecOS envia imagens via POST para o script
3. Script salva nas pastas e retorna URL pública

**Estrutura de pastas sugerida:**
```
/public_html/tecos-uploads/
  ├── lojas/
  │   ├── {lojaId}/
  │   │   ├── logo.png
  │   │   └── produtos/
  │   │       └── {produtoId}.jpg
  │   │   └── os/
  │   │       └── {osId}/
  │   │           └── anexo1.jpg
```

**Script PHP exemplo:**
```php
<?php
// upload.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$apiKey = 'sua_chave_secreta_api';
if ($_POST['apiKey'] !== $apiKey) {
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

$lojaId = $_POST['lojaId'];
$tipo = $_POST['tipo']; // logo, produto, os
$arquivo = $_FILES['arquivo'];

$pasta = "tecos-uploads/lojas/$lojaId/$tipo/";
mkdir($pasta, 0777, true);

$extensao = pathinfo($arquivo['name'], PATHINFO_EXTENSION);
$nomeFinal = uniqid() . '.' . $extensao;
move_uploaded_file($arquivo['tmp_name'], $pasta . $nomeFinal);

echo json_encode([
    'sucesso' => true,
    'url' => "https://seusite.com/$pasta$nomeFinal"
]);
?>
```

#### Opção C: cPanel como Vercel?
**Resposta:** cPanel não tem funcionalidades similares ao Vercel (deploy automático, serverless, preview).

**Alternativas gratuitas similares ao Vercel:**
- **Cloudflare Pages** - Gratuito, deploy via GitHub, serverless functions
- **Netlify** - Gratuito, muito similar ao Vercel
- **Railway** - Tem plano grátis

---

## 4. Status Atual do Projeto

### Já Implementado
- [x] Sistema multi-loja (SaaS)
- [x] Ordens de Serviço
- [x] PDV (Ponto de Venda)
- [x] Controle de Clientes
- [x] Dashboard
- [x] Página pública da loja
- [x] Sistema de autenticação
- [x] Integração Asaas (PIX, Boleto, Cartão)
- [x] Trial 7 dias grátis
- [x] Sistema de bloqueio por inadimplência
- [x] Webhook para confirmação automática de pagamento
- [x] Painel SuperAdmin

### Pendente (Próximos Passos)
- [ ] Sistema de backup automático
- [ ] Servidor de imagens/arquivos
- [ ] Catálogo online para cada loja
- [ ] Controle de estoque avançado
- [ ] Módulo fiscal (NF-e, NFC-e)
- [ ] Integração WhatsApp
- [ ] App mobile (PWA ou nativo)

---

## 5. Anotações para Debate

### Dúvidas a Discutir
1. **Backup:** Onde salvar? AWS S3, Google Drive ou hospedagem própria?
2. **Imagens:** Usar hospedagem compartilhada (ilimitado) ou cloud storage?
3. **Planos:** Manter valores iguais ao Apex ou ajustar?
4. **NF-e:** Usar API terceira (ex: NFe.io) ou sistema próprio?
5. **WhatsApp:** API oficial (paga) ou alternativas?

### Economia
- Usar hospedagem compartilhada para imagens = R$ 0/mês adicional
- Cloudflare R2 para backup = 10GB grátis + barato depois
- Neon PostgreSQL = já está sendo usado (grátis para começar)

---

*Documento criado para registro e debate de ideias. Atualizado conforme evolução do projeto.*
