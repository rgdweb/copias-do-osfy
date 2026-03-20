# Tutorial: Servidor de Imagens na Hospedagem

## O que você vai precisar

### Estrutura de pastas para criar
```
/public_html/tecos-uploads/
  └── lojas/
```

### Arquivos para subir
1. `upload.php` - Script de upload
2. `delete.php` - Script para deletar imagens

---

## Passo 1: Criar Pasta de Uploads

1. Acesse o **cPanel** da sua hospedagem
2. Abra o **Gerenciador de Arquivos**
3. Vá para `/public_html/`
4. Crie uma nova pasta chamada `tecos-uploads`
5. Dentro dela, crie outra pasta chamada `lojas`

**Estrutura final:**
```
/public_html/tecos-uploads/lojas/
```

---

## Passo 2: Criar o Arquivo de Configuração

Crie um arquivo chamado `config.php` dentro de `/public_html/tecos-uploads/`

**Código do config.php:**

```php
<?php
// config.php - Configurações do servidor de imagens

// Chave de API para autenticação (ALTERE PARA UMA CHAVE FORTE!)
define('API_KEY', 'TecOS_2024_SuaChaveSecretaMuitoForte_Aqui!');

// URL base do servidor (ALTERE PARA SEU DOMÍNIO!)
define('BASE_URL', 'https://seusite.com.br/tecos-uploads');

// Tipos de arquivos permitidos
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Tamanho máximo em bytes (10MB)
define('MAX_SIZE', 10 * 1024 * 1024);

// Pasta raiz dos uploads
define('UPLOAD_DIR', __DIR__ . '/lojas/');

// Habilitar logs (true ou false)
define('ENABLE_LOGS', true);

// Função para log
function logUpload($mensagem) {
    if (ENABLE_LOGS) {
        $logFile = __DIR__ . '/uploads.log';
        $data = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$data] $mensagem\n", FILE_APPEND);
    }
}
?>
```

---

## Passo 3: Criar o Script de Upload

Crie um arquivo chamado `upload.php` dentro de `/public_html/tecos-uploads/`

**Código do upload.php:**

```php
<?php
// upload.php - Servidor de imagens TecOS

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Só aceitar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido']);
    exit;
}

// Carregar configurações
require_once __DIR__ . '/config.php';

// Validar API Key
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$apiKey = str_replace('Bearer ', '', $authHeader);

if ($apiKey !== API_KEY) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'erro' => 'Não autorizado']);
    logUpload("Tentativa de acesso não autorizado - IP: " . $_SERVER['REMOTE_ADDR']);
    exit;
}

// Validar parâmetros obrigatórios
$lojaId = $_POST['lojaId'] ?? null;
$tipo = $_POST['tipo'] ?? null;

if (!$lojaId || !$tipo) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros lojaId e tipo são obrigatórios']);
    exit;
}

// Validar tipo
$tiposPermitidos = ['logo', 'produto', 'os', 'banner', 'usuario'];
if (!in_array($tipo, $tiposPermitidos)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Tipo inválido. Permitidos: ' . implode(', ', $tiposPermitidos)]);
    exit;
}

// Validar arquivo enviado
if (!isset($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
    $erros = [
        UPLOAD_ERR_INI_SIZE => 'Arquivo muito grande (limite do servidor)',
        UPLOAD_ERR_FORM_SIZE => 'Arquivo muito grande (limite do formulário)',
        UPLOAD_ERR_PARTIAL => 'Arquivo enviado parcialmente',
        UPLOAD_ERR_NO_FILE => 'Nenhum arquivo enviado',
    ];
    $erro = $erros[$_FILES['arquivo']['error']] ?? 'Erro desconhecido no upload';
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => $erro]);
    exit;
}

$arquivo = $_FILES['arquivo'];

// Validar tipo MIME
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $arquivo['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, ALLOWED_TYPES)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Tipo de arquivo não permitido. Permitidos: JPG, PNG, GIF, WEBP']);
    exit;
}

// Validar tamanho
if ($arquivo['size'] > MAX_SIZE) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Arquivo muito grande. Máximo: 10MB']);
    exit;
}

// Criar pasta da loja
$pastaLoja = UPLOAD_DIR . $lojaId . '/' . $tipo . '/';
if (!is_dir($pastaLoja)) {
    mkdir($pastaLoja, 0755, true);
}

// Gerar nome único para o arquivo
$extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
$nomeArquivo = uniqid() . '_' . time() . '.' . $extensao;
$caminhoCompleto = $pastaLoja . $nomeArquivo;

// Mover arquivo
if (move_uploaded_file($arquivo['tmp_name'], $caminhoCompleto)) {
    $urlPublica = BASE_URL . '/lojas/' . $lojaId . '/' . $tipo . '/' . $nomeArquivo;
    
    logUpload("Upload OK - Loja: $lojaId, Tipo: $tipo, Arquivo: $nomeArquivo");
    
    echo json_encode([
        'sucesso' => true,
        'url' => $urlPublica,
        'arquivo' => $nomeArquivo,
        'tamanho' => $arquivo['size'],
        'tipo' => $mimeType
    ]);
} else {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao salvar arquivo']);
    logUpload("ERRO ao mover arquivo - Loja: $lojaId, Tipo: $tipo");
}
?>
```

---

## Passo 4: Criar Script para Deletar Imagens

Crie um arquivo chamado `delete.php` dentro de `/public_html/tecos-uploads/`

**Código do delete.php:**

```php
<?php
// delete.php - Deletar imagens do TecOS

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Aceitar POST ou DELETE
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido']);
    exit;
}

// Carregar configurações
require_once __DIR__ . '/config.php';

// Validar API Key
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$apiKey = str_replace('Bearer ', '', $authHeader);

if ($apiKey !== API_KEY) {
    http_response_code(401);
    echo json_encode(['sucesso' => false, 'erro' => 'Não autorizado']);
    exit;
}

// Pegar dados (JSON ou POST)
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$lojaId = $input['lojaId'] ?? null;
$arquivo = $input['arquivo'] ?? null;
$tipo = $input['tipo'] ?? null;

if (!$lojaId || !$arquivo) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros lojaId e arquivo são obrigatórios']);
    exit;
}

// Se tipo informado, usar no caminho
if ($tipo) {
    $caminho = UPLOAD_DIR . $lojaId . '/' . $tipo . '/' . basename($arquivo);
} else {
    // Buscar em todas as pastas
    $caminho = null;
    $tipos = ['logo', 'produto', 'os', 'banner', 'usuario'];
    foreach ($tipos as $t) {
        $possivelCaminho = UPLOAD_DIR . $lojaId . '/' . $t . '/' . basename($arquivo);
        if (file_exists($possivelCaminho)) {
            $caminho = $possivelCaminho;
            break;
        }
    }
}

if (!$caminho || !file_exists($caminho)) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'erro' => 'Arquivo não encontrado']);
    exit;
}

// Deletar arquivo
if (unlink($caminho)) {
    logUpload("Delete OK - Loja: $lojaId, Arquivo: $arquivo");
    echo json_encode(['sucesso' => true, 'mensagem' => 'Arquivo deletado com sucesso']);
} else {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro ao deletar arquivo']);
    logUpload("ERRO ao deletar - Loja: $lojaId, Arquivo: $arquivo");
}
?>
```

---

## Passo 5: Criar Arquivo .htaccess (Segurança)

Crie um arquivo chamado `.htaccess` dentro de `/public_html/tecos-uploads/`

**Código do .htaccess:**

```apache
# Proteger arquivos PHP
<FilesMatch "\.(php|phtml)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Permitir acesso apenas aos scripts específicos
<Files "upload.php">
    Order Allow,Deny
    Allow from all
</Files>

<Files "delete.php">
    Order Allow,Deny
    Allow from all
</Files>

# Bloquear acesso ao config e logs
<Files "config.php">
    Order Allow,Deny
    Deny from all
</Files>

<Files "uploads.log">
    Order Allow,Deny
    Deny from all
</Files>

# Permitir imagens
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Desabilitar execução de scripts na pasta de imagens
Options -ExecCGI -Indexes

# Headers de segurança
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
</IfModule>
```

---

## Passo 6: Permissões de Pastas

No Gerenciador de Arquivos do cPanel:

1. Clique com botão direito na pasta `tecos-uploads`
2. Selecione **Change Permissions** (Alterar Permissões)
3. Configure:
   - **Pasta tecos-uploads:** 755
   - **Pasta lojas:** 755

---

## Passo 7: Testar se Funcionou

### Teste via Browser (GET)

Acesse: `https://seusite.com.br/tecos-uploads/upload.php`

Deve retornar erro de método:
```json
{"sucesso": false, "erro": "Método não permitido"}
```

Isso significa que o script está funcionando! ✅

---

## Resumo dos Arquivos

```
/public_html/tecos-uploads/
├── .htaccess           # Segurança
├── config.php          # Configurações
├── upload.php          # Script de upload
├── delete.php          # Script de exclusão
├── uploads.log         # Log (criado automaticamente)
└── lojas/              # Pasta das imagens
    └── {lojaId}/       # Criado automaticamente
        ├── logo/
        ├── produto/
        ├── os/
        ├── banner/
        └── usuario/
```

---

## O que você PRECISA alterar:

### No arquivo `config.php`:

1. **API_KEY** - Mude para uma chave forte e única!
   ```php
   define('API_KEY', 'SuaChaveMuitoSeguraAqui_123!@#');
   ```

2. **BASE_URL** - Mude para seu domínio real!
   ```php
   define('BASE_URL', 'https://seudominio.com.br/tecos-uploads');
   ```

---

## Checklist Final

- [ ] Criar pasta `/public_html/tecos-uploads/lojas/`
- [ ] Criar arquivo `config.php` com suas configurações
- [ ] Criar arquivo `upload.php`
- [ ] Criar arquivo `delete.php`
- [ ] Criar arquivo `.htaccess`
- [ ] Configurar permissões 755 nas pastas
- [ ] Testar acessando a URL no browser
- [ ] Anotar a API_KEY que você criou (vou precisar para configurar no TecOS)
- [ ] Anotar a URL completa do upload (ex: `https://seusite.com.br/tecos-uploads/upload.php`)

---

## Depois de pronto, me mande:

1. ✅ URL do servidor de upload (ex: `https://seusite.com.br/tecos-uploads/upload.php`)
2. ✅ API_KEY que você definiu

Que eu configuro no TecOS e implemento o sistema de upload! 🚀
