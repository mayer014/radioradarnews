#!/bin/bash

# ===================================================================
# Script de Deploy ULTRA FORÇADO para Easypanel
# ===================================================================
# Este script usa múltiplas estratégias para invalidar cache Docker:
# 1. Cria arquivo .dockertimestamp com timestamp único
# 2. Adiciona comentário no App.tsx
# 3. Força commit e push
# ===================================================================

set -e

echo "🔥 INICIANDO DEPLOY ULTRA FORÇADO PARA EASYPANEL..."
echo ""

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este diretório não é um repositório Git!"
    exit 1
fi

# Gerar valores únicos
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CACHEBUST=$(date +%s)
RANDOM_HASH=$(echo $RANDOM | md5sum | head -c 16)

echo "═══════════════════════════════════════════════════════"
echo "📅 Timestamp: ${TIMESTAMP}"
echo "🔄 Cache Bust: ${CACHEBUST}"
echo "🎲 Random Hash: ${RANDOM_HASH}"
echo "═══════════════════════════════════════════════════════"
echo ""

# ESTRATÉGIA 1: Criar arquivo .dockertimestamp (força invalidação)
echo "📝 Criando .dockertimestamp..."
cat > .dockertimestamp << EOF
DEPLOY_TIME=${TIMESTAMP}
CACHEBUST=${CACHEBUST}
RANDOM_HASH=${RANDOM_HASH}
HOSTNAME=$(hostname)
USER=$(whoami)
EOF

# ESTRATÉGIA 2: Adicionar comentário com timestamp no App.tsx
echo "✏️  Adicionando timestamp ao App.tsx..."
if grep -q "// Deploy:" src/App.tsx; then
    sed -i '1d' src/App.tsx
fi
sed -i "1i // Deploy: ${TIMESTAMP} - Hash: ${RANDOM_HASH}" src/App.tsx

# ESTRATÉGIA 3: Criar arquivo de versão para o build
echo "📦 Criando arquivo de versão..."
mkdir -p public
echo "${TIMESTAMP}" > public/version.txt
echo "${CACHEBUST}" >> public/version.txt

# Verificar mudanças
if [[ -z $(git status -s) ]]; then
    echo "⚠️  Nenhuma mudança detectada. Algo está errado!"
    exit 1
fi

echo ""
echo "📋 Mudanças detectadas:"
git status -s
echo ""

# Commit e push
echo "📦 Fazendo commit das mudanças..."
git add .
git commit -m "🔥 ULTRA FORCE DEPLOY - ${TIMESTAMP} [HASH: ${RANDOM_HASH}]"

echo "⬆️  Enviando para repositório remoto..."
git push

echo ""
echo "✅ DEPLOY ULTRA FORÇADO INICIADO COM SUCESSO!"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 PRÓXIMOS PASSOS:"
echo "═══════════════════════════════════════════════════════"
echo "1. Aguarde o Easypanel detectar o push (30-60 segundos)"
echo "2. Acompanhe o build nos logs do Easypanel"
echo "3. O build deve mostrar: 'FORCE REBUILD - COMPLETE CACHE INVALIDATION'"
echo "4. Após o deploy, limpe o cache do navegador (Ctrl+Shift+Delete)"
echo "5. Verifique a versão no footer do site"
echo ""
echo "🔍 VERIFICAÇÕES:"
echo "   curl https://seu-dominio.com/build-info.txt"
echo "   curl https://seu-dominio.com/version.txt"
echo ""
echo "⏰ Tempo estimado: 3-7 minutos para build completo"
echo "═══════════════════════════════════════════════════════"
