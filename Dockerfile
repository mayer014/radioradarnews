# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

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