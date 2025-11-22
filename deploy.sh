#!/bin/bash

# Deploy script for VPS deployment with dynamic CACHEBUST
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="portal-noticias"
CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"

echo "🚀 Starting deployment for ${ENVIRONMENT} environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Validate environment variables
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your configuration before continuing."
        exit 1
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Gerar CACHEBUST dinâmico
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "")
    CACHEBUST="${GIT_HASH:-$(date +%s)}"
    echo "📌 Using Git commit hash as CACHEBUST: ${GIT_HASH}"
else
    CACHEBUST=$(date +%s)
    echo "📅 Using timestamp as CACHEBUST: ${CACHEBUST}"
fi

BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "⏰ Build time: ${BUILD_TIME}"

echo "📦 Building Docker image with CACHEBUST=${CACHEBUST}..."
docker build \
    --build-arg CACHEBUST="${CACHEBUST}" \
    --build-arg BUILD_TIME="${BUILD_TIME}" \
    --no-cache \
    -t ${APP_NAME}:${ENVIRONMENT} \
    .

echo "🛑 Stopping existing container (if running)..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

echo "🏃 Starting new container..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p 80:80 \
        -p 443:443 \
        --env-file .env \
        -v ./logs:/var/log/nginx \
        ${APP_NAME}:${ENVIRONMENT}
else
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p 8080:80 \
        --env-file .env \
        -v ./logs:/var/log/nginx \
        ${APP_NAME}:${ENVIRONMENT}
fi

echo "🔍 Checking container status..."
sleep 5

if docker ps | grep -q ${CONTAINER_NAME}; then
    echo "✅ Container is running successfully!"
    echo "📊 Container stats:"
    docker stats ${CONTAINER_NAME} --no-stream
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌐 Application is available at: http://your-domain.com"
        echo "🔐 HTTPS will be available after SSL setup"
    else
        echo "🌐 Application is available at: http://localhost:8080"
    fi
    
    echo "📋 Useful commands:"
    echo "  View logs: docker logs ${CONTAINER_NAME}"
    echo "  Stop app: docker stop ${CONTAINER_NAME}"
    echo "  Restart app: docker restart ${CONTAINER_NAME}"
    echo "  Remove app: docker rm -f ${CONTAINER_NAME}"
else
    echo "❌ Container failed to start!"
    echo "📋 Checking logs..."
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo "🎉 Deployment completed successfully!"

# Cleanup old images (keep last 3)
echo "🧹 Cleaning up old images..."
docker images ${APP_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | tail -n +2 | sort -k4 -r | tail -n +4 | awk '{print $3}' | xargs -r docker rmi || true

echo "✨ All done!"