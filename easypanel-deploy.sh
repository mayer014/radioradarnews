#!/bin/bash

# ===================================================================
# Script de Deploy Forçado para Easypanel
# ===================================================================
# Este script força o Easypanel a fazer rebuild completo da aplicação
# ao criar um commit com mudança timestamp que invalida o cache Docker
# ===================================================================

set -e

echo "🚀 Iniciando deploy forçado para Easypanel..."
echo ""

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este diretório não é um repositório Git!"
    exit 1
fi

# Gerar timestamp único
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CACHEBUST=$(date +%s)

echo "📅 Timestamp: ${TIMESTAMP}"
echo "🔄 Cache Bust: ${CACHEBUST}"
echo ""

# Adicionar comentário com timestamp no App.tsx para forçar mudança
echo "✏️  Adicionando timestamp ao App.tsx..."
sed -i "1i // Deploy: ${TIMESTAMP}" src/App.tsx

# Verificar se há mudanças
if [[ -z $(git status -s) ]]; then
    echo "⚠️  Nenhuma mudança detectada. Criando mudança forçada..."
    echo "// Forced deploy: ${TIMESTAMP}" >> src/App.tsx
fi

# Commit e push
echo "📦 Fazendo commit das mudanças..."
git add .
git commit -m "🚀 Force deploy - ${TIMESTAMP} [CACHEBUST: ${CACHEBUST}]"

echo "⬆️  Enviando para repositório remoto..."
git push

echo ""
echo "✅ Deploy iniciado com sucesso!"
echo ""
echo "📊 Próximos passos:"
echo "1. Aguarde o Easypanel detectar o push (30-60 segundos)"
echo "2. Acompanhe o build nos logs do Easypanel"
echo "3. Após o deploy, verifique a versão no footer do site"
echo ""
echo "🔍 Para verificar se o deploy foi bem-sucedido:"
echo "   curl https://seu-dominio.com/build-info.txt"
echo ""
echo "⏰ Aguarde ~2-5 minutos para o build completo"
