# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

# CACHE KILLER: Argumentos com valores únicos
ARG CACHEBUST=1
ARG BUILD_TIME
ARG RANDOM_HASH

WORKDIR /app

# ETAPA 1: INVALIDAR CACHE COM TIMESTAMP ÚNICO
RUN echo "═══════════════════════════════════════════════════════" && \
    echo "🔥 FORCE REBUILD - COMPLETE CACHE INVALIDATION" && \
    echo "═══════════════════════════════════════════════════════" && \
    echo "CACHEBUST: ${CACHEBUST}" && \
    echo "BUILD_TIME: ${BUILD_TIME}" && \
    echo "RANDOM: $(date +%s%N)" && \
    echo "HOSTNAME: $(hostname)" && \
    echo "PWD: $(pwd)" && \
    echo "═══════════════════════════════════════════════════════" > /tmp/force-rebuild.log

# ETAPA 2: COPIAR CÓDIGO (ANTES de npm install para forçar detecção)
COPY . .

# ETAPA 3: LIMPAR ABSOLUTAMENTE TUDO
RUN echo "🧹 Cleaning all caches..." && \
    npm cache clean --force && \
    rm -rf node_modules && \
    rm -rf ~/.npm && \
    rm -rf ~/.cache && \
    rm -rf .npm && \
    rm -rf /tmp/* && \
    ls -la

# ETAPA 4: INSTALAR SEM CACHE
RUN echo "📦 Installing dependencies without cache..." && \
    npm install --no-cache

# ETAPA 5: DEFINIR VARIÁVEIS DE AMBIENTE
ARG BUILD_TIME
ENV VITE_BUILD_TIME=${BUILD_TIME}
ENV VITE_APP_VERSION=1.0.0

# ETAPA 6: FORCE BUILD INFO (invalida cache se mudou)
RUN echo "Building version: ${VITE_APP_VERSION}" && \
    echo "Build time: ${VITE_BUILD_TIME}" && \
    echo "Cache key: $(date +%s%N)" > /tmp/build-key.txt

# ETAPA 7: LIMPAR CACHE DO VITE E FAZER BUILD LIMPO
RUN echo "🏗️  Starting clean build..." && \
    rm -rf node_modules/.vite && \
    rm -rf node_modules/.cache && \
    rm -rf dist && \
    rm -rf .vite && \
    ls -la && \
    echo "Running build..." && \
    npm run build && \
    echo "✅ Build completed!" && \
    ls -la dist/

# Criar arquivo de informação do build
RUN echo "Build Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" > /app/dist/build-info.txt && \
    echo "Version: 1.0.0" >> /app/dist/build-info.txt && \
    echo "Cache Bust: ${CACHEBUST}" >> /app/dist/build-info.txt

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Copiar arquivos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar script de environment runtime
COPY docker/entrypoint/ /docker-entrypoint.d/

# Tornar o script executável
RUN chmod +x /docker-entrypoint.d/10-env.sh

# Expor porta 80
EXPOSE 80

# Comando padrão (nginx oficial já executa scripts em /docker-entrypoint.d/)
CMD ["nginx", "-g", "daemon off;"]
