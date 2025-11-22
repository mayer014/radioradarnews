# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

# Argumento para forçar invalidação de cache
ARG CACHEBUST=1

WORKDIR /app

# Copiar package files
COPY package*.json ./

# CACHE BUSTING: Limpar completamente o cache e reinstalar
RUN npm cache clean --force && \
    rm -rf node_modules && \
    rm -rf ~/.npm && \
    npm install --no-cache

# Copiar código fonte
COPY . .

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