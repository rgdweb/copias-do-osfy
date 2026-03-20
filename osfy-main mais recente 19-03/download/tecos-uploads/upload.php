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
