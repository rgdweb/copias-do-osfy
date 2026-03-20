#!/bin/bash

#######################################################################################################
#                                                                                                     #
#     ████████╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗                                               #
#     ╚══██╔══╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝                                               #
#        ██║   ███████╗██║     ██║   ██║██║  ██║█████╗                                                 #
#        ██║   ╚════██║██║     ██║   ██║██║  ██║██╔══╝                                                 #
#        ██║   ███████║╚██████╗╚██████╔╝██████╔╝███████╗                                               #
#        ╚═╝   ╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝                                               #
#                                                                                                     #
#                     Instalador Automático - Sistema de Ordens de Serviço                            #
#                              Versão: 1.0.0 | SaaS Multi-Loja                                        #
#                                                                                                     #
#######################################################################################################

set -e

# ========================================
# CONFIGURAÇÕES GLOBAIS
# ========================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configurações do sistema
APP_NAME="TecOS"
APP_PORT="${PORT:-3000}"
INSTALL_DIR="${INSTALL_DIR:-/opt/tecos}"
REPO_URL="${REPO_URL:-}"
NODE_VERSION="18"
PM2_APP_NAME="tecos"

# Arquivo de log
LOG_FILE="/var/log/tecos-install.log"
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/tecos-install.log"

# ========================================
# FUNÇÕES DE UTILIDADE
# ========================================

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
}

print_header() {
    clear
    echo -e "${PURPLE}"
    echo "████████╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗"
    echo "╚══██╔══╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝"
    echo "   ██║   ███████╗██║     ██║   ██║██║  ██║█████╗  "
    echo "   ██║   ╚════██║██║     ██║   ██║██║  ██║██╔══╝  "
    echo "   ██║   ███████║╚██████╗╚██████╔╝██████╔╝███████╗"
    echo "   ╚═╝   ╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝"
    echo -e "${NC}"
    echo -e "${WHITE}     Sistema de Gestão de Ordens de Serviço${NC}"
    echo -e "${CYAN}           Instalador Automático v1.0${NC}"
    echo ""
}

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
    log "WARNING: $1"
}

print_info() {
    echo -e "${CYAN}  ℹ $1${NC}"
    log "INFO: $1"
}

show_progress() {
    local current=$1
    local total=$2
    local message=$3
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r  ${WHITE}["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] ${percent}%% - ${message}${NC}"
    
    if [ "$current" -eq "$total" ]; then
        echo ""
    fi
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado como root ou com sudo."
        echo -e "\n  Use: sudo $0"
        exit 1
    fi
}

check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
    else
        print_error "Sistema operacional não detectado."
        exit 1
    fi
    
    print_info "Sistema detectado: $OS $VER"
    
    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_warning "Este script foi otimizado para Ubuntu/Debian."
        print_warning "Outros sistemas podem requerer ajustes manuais."
        read -p "  Deseja continuar? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
            exit 1
        fi
    fi
}

command_exists() {
    command -v "$1" &> /dev/null
}

# ========================================
# FUNÇÕES DE INSTALAÇÃO
# ========================================

update_system() {
    print_step "Atualizando sistema operacional..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt update -y >> "$LOG_FILE" 2>&1
        apt upgrade -y >> "$LOG_FILE" 2>&1
        apt install -y curl wget git build-essential >> "$LOG_FILE" 2>&1
    elif [[ "$OS" == "centos" ]]; then
        yum update -y >> "$LOG_FILE" 2>&1
        yum install -y curl wget git gcc-c++ make >> "$LOG_FILE" 2>&1
    fi
    
    print_success "Sistema atualizado com sucesso!"
}

install_nodejs() {
    print_step "Instalando Node.js ${NODE_VERSION}..."
    
    if command_exists node; then
        local current_version=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$current_version" -ge "$NODE_VERSION" ]; then
            print_success "Node.js já instalado: $(node -v)"
            return 0
        fi
    fi
    
    print_info "Baixando repositório NodeSource..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - >> "$LOG_FILE" 2>&1
        apt install -y nodejs >> "$LOG_FILE" 2>&1
    elif [[ "$OS" == "centos" ]]; then
        curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | bash - >> "$LOG_FILE" 2>&1
        yum install -y nodejs >> "$LOG_FILE" 2>&1
    fi
    
    print_success "Node.js instalado: $(node -v)"
    print_success "npm instalado: $(npm -v)"
}

install_bun() {
    print_step "Instalando Bun runtime..."
    
    if command_exists bun; then
        print_success "Bun já instalado: $(bun -v)"
        return 0
    fi
    
    print_info "Baixando e instalando Bun..."
    curl -fsSL https://bun.sh/install | bash >> "$LOG_FILE" 2>&1
    
    # Carregar Bun no ambiente atual
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if command_exists bun; then
        print_success "Bun instalado: $(bun -v)"
    else
        print_warning "Bun instalado. Reinicie o terminal para usar."
    fi
}

install_pm2() {
    print_step "Instalando PM2..."
    
    if command_exists pm2; then
        print_success "PM2 já instalado: $(pm2 -v)"
        return 0
    fi
    
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    print_success "PM2 instalado: $(pm2 -v)"
}

install_nginx() {
    print_step "Instalando Nginx..."
    
    if command_exists nginx; then
        print_success "Nginx já instalado: $(nginx -v 2>&1 | cut -d'/' -f2)"
        return 0
    fi
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt install -y nginx >> "$LOG_FILE" 2>&1
    elif [[ "$OS" == "centos" ]]; then
        yum install -y nginx >> "$LOG_FILE" 2>&1
    fi
    
    systemctl enable nginx >> "$LOG_FILE" 2>&1
    systemctl start nginx >> "$LOG_FILE" 2>&1
    
    print_success "Nginx instalado e iniciado!"
}

install_certbot() {
    print_step "Instalando Certbot (para SSL)..."
    
    if command_exists certbot; then
        print_success "Certbot já instalado"
        return 0
    fi
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        apt install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    fi
    
    print_success "Certbot instalado!"
}

# ========================================
# CONFIGURAÇÃO DO PROJETO
# ========================================

setup_project() {
    print_step "Configurando projeto TecOS..."
    
    # Criar diretório de instalação
    mkdir -p "$INSTALL_DIR"
    
    # Se o script está rodando de dentro do projeto, copiar
    if [ -f "$(dirname "$0")/package.json" ]; then
        print_info "Copiando arquivos do projeto..."
        cp -r "$(dirname "$0")/"* "$INSTALL_DIR/" 2>/dev/null || true
        cp -r "$(dirname "$0")/."* "$INSTALL_DIR/" 2>/dev/null || true
    elif [ -f "./package.json" ]; then
        print_info "Copiando arquivos do diretório atual..."
        cp -r ./* "$INSTALL_DIR/" 2>/dev/null || true
        cp -r ./.* "$INSTALL_DIR/" 2>/dev/null || true
    elif [ -n "$REPO_URL" ]; then
        print_info "Clonando repositório..."
        git clone "$REPO_URL" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1
    else
        print_error "Nenhum arquivo de projeto encontrado!"
        print_info "Coloque os arquivos do projeto no mesmo diretório do script"
        print_info "Ou configure a variável REPO_URL"
        exit 1
    fi
    
    cd "$INSTALL_DIR"
    print_success "Projeto configurado em: $INSTALL_DIR"
}

install_dependencies() {
    print_step "Instalando dependências do projeto..."
    
    cd "$INSTALL_DIR"
    
    # Verificar se existe package.json
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado!"
        exit 1
    fi
    
    # Preferir Bun se disponível
    if command_exists bun; then
        print_info "Usando Bun para instalar dependências..."
        bun install >> "$LOG_FILE" 2>&1
    else
        print_info "Usando npm para instalar dependências..."
        npm install >> "$LOG_FILE" 2>&1
    fi
    
    print_success "Dependências instaladas!"
}

setup_database() {
    print_step "Configurando banco de dados..."
    
    cd "$INSTALL_DIR"
    
    # Criar diretório do banco
    mkdir -p db
    
    # Configurar variável de ambiente
    if [ ! -f ".env" ]; then
        echo 'DATABASE_URL="file:./db/custom.db"' > .env
        print_info "Arquivo .env criado"
    fi
    
    # Gerar cliente Prisma
    print_info "Gerando cliente Prisma..."
    npx prisma generate >> "$LOG_FILE" 2>&1
    
    # Executar push do banco
    print_info "Criando estrutura do banco de dados..."
    npx prisma db push >> "$LOG_FILE" 2>&1
    
    # Executar seed se existir
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        print_info "Executando seed inicial..."
        npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts >> "$LOG_FILE" 2>&1 || \
        npx prisma db seed >> "$LOG_FILE" 2>&1 || \
        print_warning "Seed não executado (pode já existir dados)"
    fi
    
    # Verificar se o banco foi criado
    if [ -f "db/custom.db" ]; then
        print_success "Banco de dados criado: db/custom.db"
    else
        print_error "Falha ao criar banco de dados!"
        exit 1
    fi
}

build_project() {
    print_step "Realizando build do projeto..."
    
    cd "$INSTALL_DIR"
    
    print_info "Executando build (isso pode levar alguns minutos)..."
    
    if command_exists bun; then
        bun run build >> "$LOG_FILE" 2>&1
    else
        npm run build >> "$LOG_FILE" 2>&1
    fi
    
    # Verificar se build foi criado
    if [ -d ".next/standalone" ]; then
        print_success "Build concluído com sucesso!"
    else
        print_error "Build falhou! Verifique os logs."
        exit 1
    fi
}

# ========================================
# CONFIGURAÇÃO DO PM2
# ========================================

setup_pm2() {
    print_step "Configurando PM2..."
    
    cd "$INSTALL_DIR"
    
    # Parar instância existente se houver
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
    
    # Criar ecosystem.config.js
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tecos',
    script: '.next/standalone/server.js',
    cwd: '/opt/tecos',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/tecos-error.log',
    out_file: '/var/log/tecos-out.log',
    log_file: '/var/log/tecos.log',
    time: true
  }]
};
EOF
    
    # Iniciar com PM2
    print_info "Iniciando aplicação com PM2..."
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
    
    # Salvar configuração do PM2
    pm2 save >> "$LOG_FILE" 2>&1
    
    # Configurar startup
    local startup_cmd=$(pm2 startup 2>&1 | grep -o 'sudo .*' | head -1)
    if [ -n "$startup_cmd" ]; then
        print_info "Configurando inicialização automática..."
        eval "$startup_cmd" >> "$LOG_FILE" 2>&1 || true
    fi
    
    print_success "PM2 configurado e aplicação iniciada!"
}

# ========================================
# CONFIGURAÇÃO DO NGINX
# ========================================

setup_nginx() {
    print_step "Configurando Nginx..."
    
    local server_name="${DOMAIN:-_}"
    
    # Criar configuração do Nginx
    cat > /etc/nginx/sites-available/tecos << EOF
# TecOS - Configuração do Nginx
# Gerado automaticamente pelo instalador

server {
    listen 80;
    listen [::]:80;
    server_name ${server_name};

    # Logs
    access_log /var/log/nginx/tecos-access.log;
    error_log /var/log/nginx/tecos-error.log;

    # Configurações de segurança
    client_max_body_size 50M;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        
        # Headers do proxy
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass \$http_upgrade;
    }

    # Arquivos estáticos com cache
    location /_next/static {
        alias ${INSTALL_DIR}/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Arquivos públicos
    location /public {
        alias ${INSTALL_DIR}/public;
        expires 30d;
        access_log off;
    }
}
EOF
    
    # Ativar site
    ln -sf /etc/nginx/sites-available/tecos /etc/nginx/sites-enabled/tecos
    
    # Remover site padrão
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    if nginx -t >> "$LOG_FILE" 2>&1; then
        systemctl reload nginx >> "$LOG_FILE" 2>&1
        print_success "Nginx configurado com sucesso!"
    else
        print_error "Erro na configuração do Nginx!"
        exit 1
    fi
}

setup_ssl() {
    print_step "Configurando SSL (opcional)..."
    
    if [ -z "$DOMAIN" ]; then
        print_info "Puleando SSL - Domínio não configurado."
        print_info "Para configurar SSL posteriormente, execute:"
        echo -e "  ${CYAN}sudo certbot --nginx -d seu-dominio.com${NC}"
        return 0
    fi
    
    if command_exists certbot; then
        print_info "Configurando certificado SSL para: $DOMAIN"
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" >> "$LOG_FILE" 2>&1 || {
            print_warning "Falha ao configurar SSL. Configure manualmente depois."
            return 0
        }
        print_success "SSL configurado com sucesso!"
    fi
}

# ========================================
# CONFIGURAÇÃO DE FIREWALL
# ========================================

setup_firewall() {
    print_step "Configurando firewall..."
    
    if command_exists ufw; then
        # Permitir portas necessárias
        ufw allow ssh >> "$LOG_FILE" 2>&1
        ufw allow 'Nginx Full' >> "$LOG_FILE" 2>&1
        
        # Ativar firewall se não estiver ativo
        if ! ufw status | grep -q "Status: active"; then
            print_info "Ativando firewall..."
            echo "y" | ufw enable >> "$LOG_FILE" 2>&1
        fi
        
        print_success "Firewall configurado!"
    else
        print_info "UFW não disponível. Configure o firewall manualmente."
    fi
}

# ========================================
# VERIFICAÇÃO FINAL
# ========================================

verify_installation() {
    print_step "Verificando instalação..."
    
    local errors=0
    
    # Verificar Node.js
    if command_exists node; then
        print_success "Node.js: $(node -v)"
    else
        print_error "Node.js não encontrado!"
        ((errors++))
    fi
    
    # Verificar banco de dados
    if [ -f "$INSTALL_DIR/db/custom.db" ]; then
        print_success "Banco de dados: OK"
    else
        print_error "Banco de dados não encontrado!"
        ((errors++))
    fi
    
    # Verificar build
    if [ -d "$INSTALL_DIR/.next/standalone" ]; then
        print_success "Build: OK"
    else
        print_error "Build não encontrado!"
        ((errors++))
    fi
    
    # Verificar PM2
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        print_success "PM2: Aplicação online"
    else
        print_error "Aplicação não está rodando no PM2!"
        ((errors++))
    fi
    
    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        print_success "Nginx: Ativo"
    else
        print_error "Nginx não está ativo!"
        ((errors++))
    fi
    
    # Testar aplicação
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}" | grep -q "200\|302"; then
        print_success "Aplicação: Respondendo na porta $APP_PORT"
    else
        print_warning "Aplicação pode não estar respondendo corretamente"
    fi
    
    return $errors
}

# ========================================
# RESUMO FINAL
# ========================================

show_summary() {
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP")
    local domain_display="${DOMAIN:-$server_ip}"
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}                      ✓ INSTALAÇÃO CONCLUÍDA!                        ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${WHITE}  O TecOS foi instalado com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}  Acesse o sistema:${NC}"
    echo -e "  ${WHITE}• URL: http://${domain_display}${NC}"
    echo ""
    echo -e "${CYAN}  Credenciais do SuperAdmin:${NC}"
    echo -e "  ${WHITE}• Email: admin@tecos.com${NC}"
    echo -e "  ${WHITE}• Senha: admin123${NC}"
    echo ""
    echo -e "${YELLOW}  ⚠ IMPORTANTE: Altere a senha após o primeiro acesso!${NC}"
    echo ""
    echo -e "${CYAN}  Comandos úteis:${NC}"
    echo -e "  ${WHITE}• Status: pm2 status${NC}"
    echo -e "  ${WHITE}• Logs: pm2 logs tecos${NC}"
    echo -e "  ${WHITE}• Reiniciar: pm2 restart tecos${NC}"
    echo -e "  ${WHITE}• Parar: pm2 stop tecos${NC}"
    echo ""
    echo -e "${CYAN}  Diretório de instalação:${NC}"
    echo -e "  ${WHITE}• $INSTALL_DIR${NC}"
    echo ""
    echo -e "${CYAN}  Logs:${NC}"
    echo -e "  ${WHITE}• Instalação: $LOG_FILE${NC}"
    echo -e "  ${WHITE}• Aplicação: /var/log/tecos.log${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

main() {
    print_header
    
    # Verificar root
    check_root
    
    # Detectar sistema
    check_os
    
    # Solicitar domínio (opcional)
    if [ -z "$DOMAIN" ]; then
        echo -e -n "${CYAN}  Digite seu domínio (opcional, pressione Enter para pular): ${NC}"
        read -r DOMAIN
    fi
    
    # Solicitar email para SSL (se domínio informado)
    if [ -n "$DOMAIN" ] && [ -z "$SSL_EMAIL" ]; then
        echo -e -n "${CYAN}  Digite seu email para SSL (opcional): ${NC}"
        read -r SSL_EMAIL
    fi
    
    echo ""
    print_info "Iniciando instalação... (Log: $LOG_FILE)"
    echo ""
    
    # Total de passos
    local total_steps=12
    local current_step=0
    
    # 1. Atualizar sistema
    ((current_step++))
    show_progress $current_step $total_steps "Atualizando sistema..."
    update_system
    
    # 2. Instalar Node.js
    ((current_step++))
    show_progress $current_step $total_steps "Instalando Node.js..."
    install_nodejs
    
    # 3. Instalar Bun
    ((current_step++))
    show_progress $current_step $total_steps "Instalando Bun..."
    install_bun
    
    # 4. Instalar PM2
    ((current_step++))
    show_progress $current_step $total_steps "Instalando PM2..."
    install_pm2
    
    # 5. Instalar Nginx
    ((current_step++))
    show_progress $current_step $total_steps "Instalando Nginx..."
    install_nginx
    
    # 6. Instalar Certbot
    ((current_step++))
    show_progress $current_step $total_steps "Instalando Certbot..."
    install_certbot
    
    # 7. Configurar projeto
    ((current_step++))
    show_progress $current_step $total_steps "Configurando projeto..."
    setup_project
    
    # 8. Instalar dependências
    ((current_step++))
    show_progress $current_step $total_steps "Instalando dependências..."
    install_dependencies
    
    # 9. Configurar banco
    ((current_step++))
    show_progress $current_step $total_steps "Configurando banco de dados..."
    setup_database
    
    # 10. Build
    ((current_step++))
    show_progress $current_step $total_steps "Realizando build..."
    build_project
    
    # 11. Configurar PM2
    ((current_step++))
    show_progress $current_step $total_steps "Configurando PM2..."
    setup_pm2
    
    # 12. Configurar Nginx
    ((current_step++))
    show_progress $current_step $total_steps "Configurando Nginx..."
    setup_nginx
    
    # Configurações opcionais
    setup_ssl
    setup_firewall
    
    # Verificar instalação
    verify_installation
    
    # Mostrar resumo
    show_summary
}

# ========================================
# EXECUÇÃO
# ========================================

# Tratamento de erros
trap 'print_error "Instalação interrompida! Verifique: $LOG_FILE"; exit 1' ERR

# Executar
main "$@"
