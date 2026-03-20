#!/bin/bash

#######################################################################################################
#                           TecOS - Script de Backup Automático                                       #
#######################################################################################################

set -e

# Configurações
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/tecos}"
INSTALL_DIR="${INSTALL_DIR:-/opt/tecos}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                TecOS - Backup Automático${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}▶ Iniciando backup...${NC}"

# Backup do banco de dados
echo "  • Copiando banco de dados..."
cp "$INSTALL_DIR/db/custom.db" "$BACKUP_DIR/tecos_db_$DATE.db"

# Backup do .env
if [ -f "$INSTALL_DIR/.env" ]; then
    echo "  • Copiando configurações..."
    cp "$INSTALL_DIR/.env" "$BACKUP_DIR/tecos_env_$DATE"
fi

# Criar arquivo compactado
echo "  • Compactando arquivos..."
tar -czf "$BACKUP_DIR/tecos_backup_$DATE.tar.gz" -C "$BACKUP_DIR" \
    "tecos_db_$DATE.db" \
    "tecos_env_$DATE" 2>/dev/null || true

# Remover arquivos temporários
rm -f "$BACKUP_DIR/tecos_db_$DATE.db" "$BACKUP_DIR/tecos_env_$DATE"

# Remover backups antigos
echo "  • Removendo backups antigos (> $RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "tecos_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Calcular tamanho
BACKUP_SIZE=$(du -h "$BACKUP_DIR/tecos_backup_$DATE.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}✓ Backup concluído!${NC}"
echo -e "  • Arquivo: $BACKUP_DIR/tecos_backup_$DATE.tar.gz"
echo -e "  • Tamanho: $BACKUP_SIZE"
echo ""

# Listar backups existentes
echo -e "${YELLOW}Backups disponíveis:${NC}"
ls -lh "$BACKUP_DIR"/tecos_backup_*.tar.gz 2>/dev/null | awk '{print "  • " $NF " - " $5}' || echo "  Nenhum backup encontrado"
