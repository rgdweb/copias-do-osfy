# TecOS - Servidor de Imagens

## Instalação Rápida

1. Extraia o ZIP na pasta `/public_html/` do seu servidor
2. Acesse pelo browser: `https://seusite.com.br/tecos-uploads/`
3. Deve aparecer erro de método = funcionando! ✅

## ⚠️ IMPORTANTE - Edite o config.php

Abra o arquivo `config.php` e altere:

```php
// Mude para uma chave forte!
define('API_KEY', 'SuaChaveMuitoSeguraAqui_123!@#');

// Mude para seu domínio real!
define('BASE_URL', 'https://seudominio.com.br/tecos-uploads');
```

## Estrutura após instalação

```
/public_html/tecos-uploads/
├── .htaccess           # Segurança (não mexer)
├── config.php          # Configurações (EDITAR!)
├── upload.php          # Script de upload (não mexer)
├── delete.php          # Script de exclusão (não mexer)
├── README.txt          # Este arquivo
└── lojas/              # Criar pasta vazia com permissão 755
```

## Permissões

- Pastas: 755
- Arquivos PHP: 644

## Depois de configurar

Me mande:
1. URL do servidor (ex: https://seusite.com.br/tecos-uploads/upload.php)
2. API_KEY que você definiu

Que eu configuro no TecOS! 🚀
