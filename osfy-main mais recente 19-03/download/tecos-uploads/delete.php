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
