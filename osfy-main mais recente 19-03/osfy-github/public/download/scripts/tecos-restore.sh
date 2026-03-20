#!/bin/bash

#######################################################################################################
#                           TecOS - Script de Restauração                                            #
#######################################################################################################

set -e

# Configurações
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/tecos}"
INSTALL_DIR="${INSTALL_DIR:-/opt/tecos}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                TecOS - Restauração de Backup${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verificar se o diretório de backups existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}✗ Diretório de backups não encontrado: $BACKUP_DIR${NC}"
    exit 1
fi

# Listar backups disponíveis
echo -e "${CYAN}Backups disponíveis:${NC}"
echo ""
backups=($(ls -t "$BACKUP_DIR"/tecos_backup_*.tar.gz 2>/dev/null))

if [ ${#backups[@]} -eq 0 ]; then
    echo -e "${RED}✗ Nenhum backup encontrado!${NC}"
    exit 1
fi

# Listar com números
for i in "${!backups[@]}"; do
    size=$(du -h "${backups[$i]}" | cut -f1)
    date=$(basename "${backups[$i]}" | sed 's/tecos_backup_//' | sed 's/.tar.gz//' | sed 's/_/ /')
    echo -e "  ${YELLOW}$((i+1)))${NC} ${backups[$i]##*/} (${size}) - ${date}"
done

echo ""
echo -e -n "${CYAN}Selecione o backup (1-${#backups[@]}): ${NC}"
read -r selection

# Validar seleção
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
    echo -e "${RED}✗ Seleção inválida!${NC}"
    exit 1
fi

backup_file="${backups[$((selection-1))]}"

echo ""
echo -e "${YELLOW}⚠ ATENÇÃO: Esta operação irá substituir o banco de dados atual!${NC}"
echo -e -n "${CYAN}Deseja continuar? (s/N): ${NC}"
read -r confirm

if [[ ! $confirm =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

# Parar aplicação
echo ""
echo -e "${YELLOW}▶ Parando aplicação...${NC}"
pm2 stop tecos 2>/dev/null || true

# Extrair backup
echo -e "${YELLOW}▶ Extraindo backup...${NC}"
temp_dir=$(mktemp -d)
tar -xzf "$backup_file" -C "$temp_dir"

# Restaurar banco de dados
echo -e "${YELLOW}▶ Restaurando banco de dados...${NC}"
if [ -f "$temp_dir/tecos_db_"*.db ]; then
    cp "$temp_dir"/tecos_db_*.db "$INSTALL_DIR/db/custom.db"
    echo -e "${GREEN}✓ Banco de dados restaurado!${NC}"
fi

# Restaurar .env
if [ -f "$temp_dir/tecos_env_"* ]; then
    cp "$temp_dir"/tecos_env_* "$INSTALL_DIR/.env"
    echo -e "${GREEN}✓ Configurações restauradas!${NC}"
fi

# Limpar
rm -rf "$temp_dir"

# Reiniciar aplicação
echo -e "${YELLOW}▶ Reiniciando aplicação...${NC}"
pm2 start tecos 2>/dev/null || pm2 restart tecos

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Restauração concluída com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
