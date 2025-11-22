#!/bin/bash

# Script para build local rápido (sem Docker)
# Útil para desenvolvimento e testes locais

set -e

echo "🔨 Starting local build..."

# Limpar cache anterior
echo "🧹 Cleaning previous build..."
rm -rf dist/
npm cache clean --force

# Gerar versão e build time
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
    export VITE_APP_VERSION="1.0.0-${GIT_HASH}"
else
    export VITE_APP_VERSION="1.0.0-dev"
fi

export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📦 Version: ${VITE_APP_VERSION}"
echo "⏰ Build time: ${VITE_BUILD_TIME}"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build
echo "🏗️  Building application..."
npm run build

# Criar arquivo de informações
cat > dist/build-info.txt << EOF
Build Information
=================
Version: ${VITE_APP_VERSION}
Build Time: ${VITE_BUILD_TIME}
Git Hash: ${GIT_HASH:-N/A}
Environment: development
EOF

echo "✅ Build completed successfully!"
echo "📊 Build size:"
du -sh dist/

echo ""
echo "🚀 To preview locally, run:"
echo "   npm run preview"
echo ""
echo "📦 To deploy, use:"
echo "   ./deploy.sh production"
