# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

# Argumentos para forçar invalidação de cache
ARG CACHEBUST=1
ARG BUILD_TIME

WORKDIR /app

# CRITICAL: Copiar código fonte PRIMEIRO (antes de npm install)
# Isso força o Docker a detectar mudanças no código
COPY . .

# CACHE BUSTING AGRESSIVO: Criar arquivo único por build
RUN echo "FORCE REBUILD: ${CACHEBUST}-$(date +%s)" > /tmp/cachebust.txt && \
    echo "BUILD_TIME: ${BUILD_TIME}" >> /tmp/cachebust.txt && \
    cat /tmp/cachebust.txt

# Limpar TODOS os caches possíveis
RUN npm cache clean --force && \
    rm -rf node_modules && \
    rm -rf ~/.npm && \
    rm -rf .npm && \
    npm install --no-cache

# Definir variáveis de build
ARG BUILD_TIME
ARG CACHEBUST=1

# Forçar rebuild exibindo CACHEBUST
RUN echo "CACHEBUST: ${CACHEBUST}" && \
    echo "BUILD_TIME: ${BUILD_TIME}"

ENV VITE_BUILD_TIME=${BUILD_TIME}
ENV VITE_APP_VERSION=1.0.0

# CACHE BUSTING: Limpar cache do Vite e fazer build limpo
RUN rm -rf node_modules/.vite && \
    rm -rf dist && \
    rm -rf .vite && \
    npm run build

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