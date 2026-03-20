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
