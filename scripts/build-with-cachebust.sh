#!/bin/bash

# Build script with dynamic CACHEBUST
# Automatically generates CACHEBUST from Git commit hash or timestamp

set -e

echo "🔨 Starting build with dynamic CACHEBUST..."

# Determinar CACHEBUST
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Se estiver em um repositório Git, usar hash do commit
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    CACHEBUST="${GIT_HASH:-$(date +%s)}"
    echo "📌 Using Git commit hash: ${GIT_HASH} (branch: ${GIT_BRANCH})"
else
    # Caso contrário, usar timestamp
    CACHEBUST=$(date +%s)
    echo "📅 Using timestamp: ${CACHEBUST}"
fi

# Timestamp do build
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "⏰ Build time: ${BUILD_TIME}"

# Nome da imagem
APP_NAME="${1:-portal-noticias}"
IMAGE_TAG="${2:-latest}"

echo "🐳 Building Docker image: ${APP_NAME}:${IMAGE_TAG}"
echo "🔄 CACHEBUST: ${CACHEBUST}"

# Build da imagem Docker com argumentos
docker build \
    --build-arg CACHEBUST="${CACHEBUST}" \
    --build-arg BUILD_TIME="${BUILD_TIME}" \
    --no-cache \
    -t "${APP_NAME}:${IMAGE_TAG}" \
    -t "${APP_NAME}:${CACHEBUST}" \
    .

echo "✅ Build completed successfully!"
echo "📦 Image tags created:"
echo "   - ${APP_NAME}:${IMAGE_TAG}"
echo "   - ${APP_NAME}:${CACHEBUST}"

# Salvar informações do build
mkdir -p build-info
cat > build-info/last-build.json << EOF
{
  "timestamp": "${BUILD_TIME}",
  "cachebust": "${CACHEBUST}",
  "git_hash": "${GIT_HASH:-N/A}",
  "git_branch": "${GIT_BRANCH:-N/A}",
  "image_name": "${APP_NAME}",
  "image_tag": "${IMAGE_TAG}"
}
EOF

echo "📝 Build info saved to build-info/last-build.json"

# Mostrar tamanho da imagem
echo "📊 Image size:"
docker images "${APP_NAME}:${IMAGE_TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "🎉 Build process completed!"
