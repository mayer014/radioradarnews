# 🚀 Guia de Deploy para VPS

Este guia detalha como fazer deploy do Portal de Notícias em uma VPS usando Docker.

## ✅ Preparação Concluída

O projeto foi preparado para deploy com as seguintes otimizações:

### 🔄 Migração do LocalStorage
- ✅ Removidas dependências de localStorage
- ✅ Dados agora persistem exclusivamente no Supabase
- ✅ Hook de migração criado para transição suave

### ⚙️ Configurações Centralizadas
- ✅ Arquivo `src/config/environment.ts` criado
- ✅ Todas as configurações centralizadas
- ✅ Cliente Supabase usando configurações centralizadas

### 🏗️ Build de Produção
- ✅ Vite configurado para otimizações de produção
- ✅ Code splitting implementado
- ✅ Minificação de CSS e JS ativada
- ✅ Console.logs removidos em produção

### 🖼️ Otimização de Imagens
- ✅ Componente `LazyImage` criado
- ✅ Lazy loading implementado
- ✅ Utilitários de otimização de imagem
- ✅ Suporte a imagens responsivas

### 🔒 Segurança
- ✅ Headers de segurança configurados
- ✅ CSP (Content Security Policy) definido
- ✅ HTTPS forçado em produção
- ✅ Validação de upload de arquivos
- ✅ Rate limiting implementado

### 🐳 Docker & Deploy
- ✅ Dockerfile multi-stage otimizado
- ✅ Nginx configurado com otimizações
- ✅ Docker Compose configurado
- ✅ Script de deploy automatizado
- ✅ Health checks implementados

## 📋 Pré-requisitos

- VPS com Ubuntu/Debian
- Docker e Docker Compose instalados
- Domínio apontando para o IP da VPS
- Acesso SSH à VPS

## 🛠️ Instalação do Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão
exit
```

## 🔧 Configuração

1. **Clone o projeto na VPS:**
```bash
git clone <seu-repositorio>
cd portal-noticias
```

2. **Configure o arquivo .env:**
```bash
cp .env.example .env
nano .env
```

3. **Edite as configurações:**
```env
# Supabase (já configurado no código)
VITE_SUPABASE_URL=https://bwxbhircezyhwekdngdk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Rádio
VITE_RADIO_STREAM_URL=https://sua-radio-stream.com/stream

# Aplicação
VITE_APP_NAME=Portal de Notícias
VITE_APP_URL=https://seu-dominio.com

# Ambiente
NODE_ENV=production
```

## 🚀 Deploy

### Deploy Automático com CACHEBUST

O sistema agora gera automaticamente um CACHEBUST único para cada build, garantindo que o navegador sempre carregue a versão mais recente.

#### 1. Deploy Completo (Recomendado):
```bash
chmod +x deploy.sh scripts/*.sh
./deploy.sh production
```

O script automaticamente:
- ✅ Gera CACHEBUST baseado no hash do Git (ou timestamp)
- ✅ Adiciona timestamp do build
- ✅ Força rebuild sem cache
- ✅ Cria tags de versão
- ✅ Salva informações do build

#### 2. Build Apenas (sem deploy):
```bash
./scripts/build-with-cachebust.sh portal-noticias latest
```

#### 3. Build Local (desenvolvimento):
```bash
./scripts/local-build.sh
```

### Verificar Versão Implantada

Após o deploy, você pode verificar a versão em:
- **No footer do site**: Versão e timestamp visíveis
- **Arquivo de build**: `http://seu-dominio.com/build-info.txt`
- **Arquivo JSON**: `build-info/last-build.json` (servidor)

### Deploy para Staging:
```bash
./deploy.sh staging
```

## 🌐 Configuração de Domínio

1. **Atualize o nginx.conf se necessário:**
```bash
nano nginx.conf
# Descomente as linhas de redirect HTTPS se usar SSL
```

2. **Configure SSL com Let's Encrypt:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### Logs da aplicação:
```bash
docker logs portal-noticias-production -f
```

### Status do container:
```bash
docker stats portal-noticias-production
```

### Logs do Nginx:
```bash
tail -f logs/access.log
tail -f logs/error.log
```

## 🔄 Atualizações

1. **Pull das mudanças:**
```bash
git pull origin main
```

2. **Redeploy:**
```bash
./deploy.sh production
```

## 🆘 Troubleshooting

### Container não inicia:
```bash
docker logs portal-noticias-production
```

### Porta ocupada:
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

### Problemas de memória:
```bash
free -h
docker system prune -a
```

### Reset completo:
```bash
docker stop portal-noticias-production
docker rm portal-noticias-production
docker rmi portal-noticias:production
./deploy.sh production
```

## 🔒 Backup

### Backup dos dados:
```bash
# Dados do Supabase são automaticamente backupeados
# Para backup local de configurações:
tar -czf backup-$(date +%Y%m%d).tar.gz .env logs/
```

## ⚡ Performance

O site foi otimizado para:
- ✅ Carregamento rápido (< 3s)
- ✅ Bundle size otimizado
- ✅ Lazy loading de imagens
- ✅ Cache de assets estáticos
- ✅ Compressão Gzip
- ✅ Service Worker (PWA)

## 📈 Próximos Passos

1. Configurar CDN (Cloudflare)
2. Implementar analytics
3. Configurar monitoring (Uptime Robot)
4. Backup automatizado
5. CI/CD pipeline

## 🆘 Suporte

Para suporte técnico, verifique:
1. Logs do container
2. Status do Supabase
3. Conectividade de rede
4. Recursos da VPS (CPU/RAM/Disk)