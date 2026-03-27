@echo off
title Bot WhatsApp
cls
echo.
echo ================================================
echo   BOT WHATSAPP PROFISSIONAL v3.5
echo ================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale o Node.js: https://nodejs.org/
    echo Escolha a versao LTS.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Instalando dependencias...
    echo Aguarde 1-2 minutos.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha na instalacao.
        pause
        exit /b 1
    )
    echo.
)

echo Iniciando...
echo.
echo Abra no navegador: http://localhost:3000
echo.
echo ================================================
echo.

node server.js

pause
