#!/bin/bash

# Script de configuração CORS para VPS Nginx
# Autor: Portal RRN
# Data: 2025-01-23

set -e

echo "🔧 Configurador CORS para VPS Nginx"
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script precisa ser executado como root${NC}" 
   echo "Use: sudo $0"
   exit 1
fi

# Detectar caminho de configuração do Nginx
NGINX_CONF=""
if [ -f "/etc/nginx/sites-available/media.radioradar.news" ]; then
    NGINX_CONF="/etc/nginx/sites-available/media.radioradar.news"
elif [ -f "/etc/nginx/conf.d/media.radioradar.news.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/media.radioradar.news.conf"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/default.conf"
elif [ -f "/etc/nginx/nginx.conf" ]; then
    NGINX_CONF="/etc/nginx/nginx.conf"
else
    echo -e "${RED}❌ Arquivo de configuração do Nginx não encontrado${NC}"
    echo "Por favor, especifique o caminho manualmente:"
    read -p "Caminho do arquivo de configuração: " NGINX_CONF
fi

echo -e "${GREEN}✓${NC} Arquivo de configuração encontrado: $NGINX_CONF"

# Fazer backup
BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONF" "$BACKUP_FILE"
echo -e "${GREEN}✓${NC} Backup criado: $BACKUP_FILE"
echo ""

# Perguntar tipo de configuração
echo "Escolha o tipo de configuração CORS:"
echo "1) Público (Access-Control-Allow-Origin: *) - Recomendado para imagens públicas"
echo "2) Restrito (Apenas domínios específicos) - Mais seguro"
read -p "Digite 1 ou 2: " CORS_TYPE

if [ "$CORS_TYPE" = "1" ]; then
    echo -e "${YELLOW}⚠${NC}  Aplicando configuração CORS pública..."
    
    # Configuração CORS pública
    CORS_CONFIG='
    # ========================================
    # CORS Configuration - Added by configure-vps-cors.sh
    # ========================================
    location /uploads/ {
        # CORS Headers
        add_header '\''Access-Control-Allow-Origin'\'' '\''*'\'' always;
        add_header '\''Access-Control-Allow-Methods'\'' '\''GET, OPTIONS'\'' always;
        add_header '\''Access-Control-Allow-Headers'\'' '\''Origin, X-Requested-With, Content-Type, Accept, Range'\'' always;
        add_header '\''Access-Control-Max-Age'\'' '\''3600'\'' always;
        add_header '\''Access-Control-Expose-Headers'\'' '\''Content-Length, Content-Range'\'' always;
        
        # Handle preflight requests
        if ($request_method = '\''OPTIONS'\'') {
            add_header '\''Access-Control-Allow-Origin'\'' '\''*'\'' always;
            add_header '\''Access-Control-Allow-Methods'\'' '\''GET, OPTIONS'\'' always;
            add_header '\''Access-Control-Allow-Headers'\'' '\''Origin, X-Requested-With, Content-Type, Accept, Range'\'' always;
            add_header '\''Access-Control-Max-Age'\'' '\''3600'\'' always;
            add_header '\''Content-Type'\'' '\''text/plain; charset=utf-8'\'';
            add_header '\''Content-Length'\'' '\''0'\'';
            return 204;
        }
        
        # Cache configuration
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # File serving
        autoindex off;
        try_files $uri =404;
    }
    # ========================================
    # End CORS Configuration
    # ========================================
    '
    
elif [ "$CORS_TYPE" = "2" ]; then
    echo -e "${GREEN}✓${NC} Aplicando configuração CORS restrita..."
    
    # Configuração CORS restrita
    CORS_CONFIG='
    # ========================================
    # CORS Configuration - Added by configure-vps-cors.sh
    # Restricted to specific domains
    # ========================================
    location /uploads/ {
        # Check if origin is allowed
        set $cors '\'''\'';
        if ($http_origin ~* (https?://(localhost|127\.0\.0\.1|radioradar\.news|.*\.lovableproject\.com)(:[0-9]+)?$)) {
            set $cors '\''true'\'';
        }
        
        # Apply CORS headers if origin is allowed
        if ($cors = '\''true'\'') {
            add_header '\''Access-Control-Allow-Origin'\'' "$http_origin" always;
            add_header '\''Access-Control-Allow-Methods'\'' '\''GET, OPTIONS'\'' always;
            add_header '\''Access-Control-Allow-Headers'\'' '\''Origin, X-Requested-With, Content-Type, Accept, Range'\'' always;
            add_header '\''Access-Control-Allow-Credentials'\'' '\''true'\'' always;
            add_header '\''Access-Control-Max-Age'\'' '\''3600'\'' always;
            add_header '\''Access-Control-Expose-Headers'\'' '\''Content-Length, Content-Range'\'' always;
        }
        
        # Handle preflight requests
        if ($request_method = '\''OPTIONS'\'') {
            if ($cors = '\''true'\'') {
                add_header '\''Access-Control-Allow-Origin'\'' "$http_origin" always;
                add_header '\''Access-Control-Allow-Methods'\'' '\''GET, OPTIONS'\'' always;
                add_header '\''Access-Control-Allow-Headers'\'' '\''Origin, X-Requested-With, Content-Type, Accept, Range'\'' always;
                add_header '\''Access-Control-Max-Age'\'' '\''3600'\'' always;
                add_header '\''Content-Type'\'' '\''text/plain; charset=utf-8'\'';
                add_header '\''Content-Length'\'' '\''0'\'';
                return 204;
            }
        }
        
        # Cache configuration
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # File serving
        autoindex off;
        try_files $uri =404;
    }
    # ========================================
    # End CORS Configuration
    # ========================================
    '
    
else
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
fi

# Verificar se já existe configuração CORS
if grep -q "CORS Configuration" "$NGINX_CONF"; then
    echo -e "${YELLOW}⚠${NC}  Configuração CORS já existe. Deseja substituir?"
    read -p "Digite 's' para sim ou 'n' para não: " REPLACE
    
    if [ "$REPLACE" = "s" ] || [ "$REPLACE" = "S" ]; then
        # Remover configuração antiga
        sed -i '/# ========================================/,/# ========================================/d' "$NGINX_CONF"
        echo -e "${GREEN}✓${NC} Configuração antiga removida"
    else
        echo -e "${YELLOW}⚠${NC}  Configuração não alterada"
        exit 0
    fi
fi

# Adicionar nova configuração
# Encontrar o bloco server e adicionar antes do fechamento
sed -i '/server {/,/}/ {
    /}/i\
'"$CORS_CONFIG"'
}' "$NGINX_CONF"

echo -e "${GREEN}✓${NC} Configuração CORS adicionada"
echo ""

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓${NC} Configuração válida"
    echo ""
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Nginx recarregado com sucesso"
        echo ""
        
        # Testar CORS
        echo "🧪 Testando CORS..."
        sleep 2
        
        TEST_URL="https://media.radioradar.news/uploads/test.jpg"
        CORS_HEADER=$(curl -s -I -X GET "$TEST_URL" -H "Origin: https://radioradar.news" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
        
        if [ -n "$CORS_HEADER" ]; then
            echo -e "${GREEN}✓${NC} CORS funcionando!"
            echo "   $CORS_HEADER"
        else
            echo -e "${YELLOW}⚠${NC}  Não foi possível verificar CORS automaticamente"
            echo "   Teste manualmente acessando uma imagem do VPS"
        fi
        
        echo ""
        echo -e "${GREEN}✅ Configuração concluída com sucesso!${NC}"
        echo ""
        echo "📝 Próximos passos:"
        echo "   1. Teste no browser: https://media.radioradar.news/uploads/seu-arquivo.jpg"
        echo "   2. Verifique os logs: sudo tail -f /var/log/nginx/error.log"
        echo "   3. Em caso de problemas, restaure o backup: sudo cp $BACKUP_FILE $NGINX_CONF"
        echo ""
        
    else
        echo -e "${RED}❌ Erro ao recarregar Nginx${NC}"
        echo "Restaurando backup..."
        cp "$BACKUP_FILE" "$NGINX_CONF"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    nginx -t
    echo ""
    echo "Restaurando backup..."
    cp "$BACKUP_FILE" "$NGINX_CONF"
    exit 1
fi
