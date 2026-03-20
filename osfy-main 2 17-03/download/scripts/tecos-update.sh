#!/bin/bash

#######################################################################################################
#                           TecOS - Script de Atualização                                            #
#######################################################################################################

set -e

# Configurações
INSTALL_DIR="${INSTALL_DIR:-/opt/tecos}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/tecos}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                TecOS - Atualização do Sistema${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$INSTALL_DIR" || exit 1

# Verificar se é um repositório git
if [ -d ".git" ]; then
    # Verificar atualizações
    echo -e "${YELLOW}▶ Verificando atualizações...${NC}"
    git fetch origin
    
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    
    if [ -z "$REMOTE" ]; then
        REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null || echo "")
    fi
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✓ Sistema já está atualizado!${NC}"
        exit 0
    fi
    
    # Mostrar changelog
    echo ""
    echo -e "${CYAN}Atualizações disponíveis:${NC}"
    git log --oneline HEAD..origin/main 2>/dev/null || git log --oneline HEAD..origin/master 2>/dev/null
    echo ""
    
    echo -e "${YELLOW}⚠ Deseja atualizar o sistema?${NC}"
    echo -e -n "${CYAN}(s/N): ${NC}"
    read -r confirm
    
    if [[ ! $confirm =~ ^[SsYy]$ ]]; then
        echo -e "${YELLOW}Operação cancelada.${NC}"
        exit 0
    fi
fi

# Backup antes de atualizar
echo ""
echo -e "${YELLOW}▶ Criando backup de segurança...${NC}"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
cp "$INSTALL_DIR/db/custom.db" "$BACKUP_DIR/tecos_db_pre_update_$DATE.db"
echo -e "${GREEN}✓ Backup criado: $BACKUP_DIR/tecos_db_pre_update_$DATE.db${NC}"

# Atualizar código
if [ -d ".git" ]; then
    echo ""
    echo -e "${YELLOW}▶ Atualizando código-fonte...${NC}"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || {
        echo -e "${RED}✗ Erro ao atualizar código!${NC}"
        exit 1
    }
fi

# Atualizar dependências
echo ""
echo -e "${YELLOW}▶ Atualizando dependências...${NC}"
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi

# Regenerar Prisma
echo ""
echo -e "${YELLOW}▶ Regenerando cliente Prisma...${NC}"
npx prisma generate

# Executar migrações (se houver)
echo ""
echo -e "${YELLOW}▶ Verificando migrações do banco...${NC}"
npx prisma migrate deploy 2>/dev/null || npx prisma db push

# Rebuild
echo ""
echo -e "${YELLOW}▶ Rebuilding aplicação...${NC}"
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi

# Reiniciar aplicação
echo ""
echo -e "${YELLOW}▶ Reiniciando aplicação...${NC}"
pm2 restart tecos

# Verificar status
sleep 2
if pm2 list | grep -q "tecos.*online"; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Atualização concluída com sucesso!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}✗ Erro ao reiniciar aplicação!${NC}"
    echo -e "${YELLOW}Verifique os logs: pm2 logs tecos${NC}"
    exit 1
fi
