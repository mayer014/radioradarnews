# Dockerfile otimizado para Easypanel
FROM node:18-alpine

WORKDIR /app

# Copiar package files (apenas npm)
COPY package*.json ./

# Instalar dependências incluindo serve
RUN npm install
RUN npm install -g serve

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta 3000 (padrão Easypanel)
EXPOSE 3000

# Usar serve para SPA com fallback
CMD ["serve", "-s", "dist", "-l", "3000"]