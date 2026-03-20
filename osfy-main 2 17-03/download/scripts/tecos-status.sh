#!/bin/bash

#######################################################################################################
#                           TecOS - Script de Status do Sistema                                      #
#######################################################################################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

INSTALL_DIR="${INSTALL_DIR:-/opt/tecos}"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                TecOS - Status do Sistema${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Sistema Operacional
echo -e "${CYAN}▸ Sistema Operacional:${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "  OS: ${WHITE}$PRETTY_NAME${NC}"
fi
echo -e "  Kernel: ${WHITE}$(uname -r)${NC}"
echo -e "  Uptime: ${WHITE}$(uptime -p)${NC}"
echo ""

# Recursos
echo -e "${CYAN}▸ Recursos do Servidor:${NC}"
# CPU
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo -e "  CPU: ${WHITE}${cpu_usage}%${NC} utilizado"
# Memória
mem_info=$(free -h | grep "Mem:")
mem_used=$(echo $mem_info | awk '{print $3}')
mem_total=$(echo $mem_info | awk '{print $2}')
echo -e "  Memória: ${WHITE}${mem_used} / ${mem_total}${NC}"
# Disco
disk_info=$(df -h / | tail -1)
disk_used=$(echo $disk_info | awk '{print $3}')
disk_total=$(echo $disk_info | awk '{print $2}')
disk_percent=$(echo $disk_info | awk '{print $5}')
echo -e "  Disco: ${WHITE}${disk_used} / ${mem_total} (${disk_percent})${NC}"
echo ""

# Node.js
echo -e "${CYAN}▸ Node.js:${NC}"
if command -v node &> /dev/null; then
    echo -e "  Versão: ${GREEN}$(node -v)${NC}"
else
    echo -e "  Status: ${RED}Não instalado${NC}"
fi

if command -v bun &> /dev/null; then
    echo -e "  Bun: ${GREEN}$(bun -v)${NC}"
fi
echo ""

# Banco de Dados
echo -e "${CYAN}▸ Banco de Dados:${NC}"
if [ -f "$INSTALL_DIR/db/custom.db" ]; then
    db_size=$(du -h "$INSTALL_DIR/db/custom.db" | cut -f1)
    echo -e "  Status: ${GREEN}OK${NC}"
    echo -e "  Arquivo: ${WHITE}$INSTALL_DIR/db/custom.db${NC}"
    echo -e "  Tamanho: ${WHITE}${db_size}${NC}"
    
    # Contar registros
    if command -v sqlite3 &> /dev/null; then
        lojas=$(sqlite3 "$INSTALL_DIR/db/custom.db" "SELECT COUNT(*) FROM Loja;" 2>/dev/null || echo "?")
        os=$(sqlite3 "$INSTALL_DIR/db/custom.db" "SELECT COUNT(*) FROM OrdemServico;" 2>/dev/null || echo "?")
        clientes=$(sqlite3 "$INSTALL_DIR/db/custom.db" "SELECT COUNT(*) FROM Cliente;" 2>/dev/null || echo "?")
        echo -e "  Lojas: ${WHITE}${lojas}${NC}"
        echo -e "  Ordens de Serviço: ${WHITE}${os}${NC}"
        echo -e "  Clientes: ${WHITE}${clientes}${NC}"
    fi
else
    echo -e "  Status: ${RED}Não encontrado${NC}"
fi
echo ""

# PM2
echo -e "${CYAN}▸ PM2 (Process Manager):${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "tecos"; then
        status=$(pm2 list | grep "tecos" | awk '{print $10}')
        if [ "$status" = "online" ]; then
            echo -e "  Status: ${GREEN}Online${NC}"
        else
            echo -e "  Status: ${RED}$status${NC}"
        fi
        # CPU e Memória do processo
        pm2_cpu=$(pm2 show tecos 2>/dev/null | grep "cpu" | awk '{print $4}')
        pm2_mem=$(pm2 show tecos 2>/dev/null | grep "memory" | awk '{print $4}')
        echo -e "  CPU: ${WHITE}${pm2_cpu}%${NC}"
        echo -e "  Memória: ${WHITE}${pm2_mem}${NC}"
        # Uptime
        pm2_uptime=$(pm2 show tecos 2>/dev/null | grep "uptime" | awk '{print $4" "$5}')
        echo -e "  Uptime: ${WHITE}${pm2_uptime}${NC}"
    else
        echo -e "  Status: ${YELLOW}Não configurado${NC}"
    fi
else
    echo -e "  Status: ${RED}Não instalado${NC}"
fi
echo ""

# Nginx
echo -e "${CYAN}▸ Nginx:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  Status: ${GREEN}Ativo${NC}"
else
    echo -e "  Status: ${RED}Inativo${NC}"
fi

# Testar resposta local
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|302"; then
    echo -e "  Aplicação: ${GREEN}Respondendo${NC}"
else
    echo -e "  Aplicação: ${YELLOW}Sem resposta${NC}"
fi
echo ""

# Portas
echo -e "${CYAN}▸ Portas em Uso:${NC}"
echo -e "  3000 (TecOS): $(netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print $7}' || echo 'Livre')"
echo -e "  80 (HTTP): $(netstat -tlnp 2>/dev/null | grep ':80' | awk '{print $7}' || echo 'Livre')"
echo -e "  443 (HTTPS): $(netstat -tlnp 2>/dev/null | grep ':443' | awk '{print $7}' || echo 'Livre')"
echo ""

# Últimos logs
echo -e "${CYAN}▸ Últimos Logs (TecOS):${NC}"
if [ -f "/var/log/tecos-out.log" ]; then
    tail -5 /var/log/tecos-out.log 2>/dev/null | sed 's/^/  /'
elif command -v pm2 &> /dev/null && pm2 list | grep -q "tecos"; then
    pm2 logs tecos --lines 5 --nostream 2>/dev/null | tail -10 | sed 's/^/  /'
else
    echo -e "  ${YELLOW}Nenhum log disponível${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
