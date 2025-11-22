#!/bin/bash

# ===================================================================
# Script de Verificação de Deploy
# ===================================================================
# Verifica se o deploy no Easypanel foi bem-sucedido
# ===================================================================

set -e

# URL do site (substitua pela URL real)
SITE_URL="${1:-https://seu-dominio.com}"

echo "🔍 Verificando deploy em: ${SITE_URL}"
echo ""

# Verificar build-info.txt
echo "📄 Verificando build-info.txt..."
BUILD_INFO=$(curl -s "${SITE_URL}/build-info.txt" || echo "Erro ao buscar build-info.txt")

if [[ $BUILD_INFO == *"Build Time"* ]]; then
    echo "✅ build-info.txt encontrado:"
    echo "${BUILD_INFO}"
    echo ""
else
    echo "❌ Erro: build-info.txt não encontrado ou inválido"
    echo ""
fi

# Verificar página principal
echo "🌐 Verificando página principal..."
MAIN_PAGE=$(curl -s "${SITE_URL}" | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1 || echo "Versão não encontrada")

if [[ $MAIN_PAGE != "Versão não encontrada" ]]; then
    echo "✅ Versão encontrada no site: ${MAIN_PAGE}"
    echo ""
else
    echo "⚠️  Versão não encontrada no HTML da página"
    echo ""
fi

# Verificar timestamp no console
echo "🕐 Verificando timestamp de build..."
TIMESTAMP=$(curl -s "${SITE_URL}" | grep -o "Build: [^<]*" | head -1 || echo "Timestamp não encontrado")

if [[ $TIMESTAMP != "Timestamp não encontrado" ]]; then
    echo "✅ ${TIMESTAMP}"
    echo ""
else
    echo "⚠️  Timestamp não encontrado"
    echo ""
fi

echo "📊 Resumo da verificação:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Site URL: ${SITE_URL}"
echo "Build Info: $(echo "${BUILD_INFO}" | grep "Build Time" | cut -d: -f2- || echo "N/A")"
echo "Versão: ${MAIN_PAGE}"
echo "Timestamp: ${TIMESTAMP}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Dica: Use Ctrl+Shift+R no navegador para forçar recarga sem cache"
