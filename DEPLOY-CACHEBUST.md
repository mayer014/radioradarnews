# 🔄 Sistema de CACHEBUST Automático

## O que é CACHEBUST?

CACHEBUST é uma técnica que força o navegador a baixar novos arquivos ao invés de usar versões em cache. Isso garante que usuários sempre vejam a versão mais recente do site após um deploy.

## Como Funciona

### 1. Build com Docker

Quando você faz o build da aplicação, o sistema:

```bash
# Gera um identificador único
CACHEBUST=$(git rev-parse --short HEAD)  # Ex: "a3f2c91"
# ou se não houver Git
CACHEBUST=$(date +%s)  # Ex: "1732234567"

# Passa para o Docker build
docker build --build-arg CACHEBUST="${CACHEBUST}" --no-cache -t app:latest .
```

### 2. No Dockerfile

```dockerfile
# Recebe o argumento
ARG CACHEBUST=1

# Limpa cache npm
RUN npm cache clean --force

# Define variáveis de ambiente para o build
ENV VITE_BUILD_TIME=${BUILD_TIME}
ENV VITE_APP_VERSION=1.0.0

# Cria arquivo de informação
RUN echo "Build: ${CACHEBUST}" > /app/dist/build-info.txt
```

### 3. Na Aplicação

```tsx
// Footer.tsx mostra a versão
<p className="text-xs opacity-60">
  v{import.meta.env.VITE_APP_VERSION} | 
  Build: {import.meta.env.VITE_BUILD_TIME}
</p>
```

## Scripts Disponíveis

### 1. Deploy Completo (`deploy.sh`)
```bash
./deploy.sh production
```
- ✅ Gera CACHEBUST automaticamente
- ✅ Build Docker sem cache
- ✅ Para container antigo
- ✅ Inicia novo container
- ✅ Limpa imagens antigas

### 2. Build com CACHEBUST (`scripts/build-with-cachebust.sh`)
```bash
./scripts/build-with-cachebust.sh [nome-app] [tag]
```
- ✅ Build apenas (sem deploy)
- ✅ Cria múltiplas tags
- ✅ Salva informações em JSON
- ✅ Mostra tamanho da imagem

### 3. Build Local (`scripts/local-build.sh`)
```bash
./scripts/local-build.sh
```
- ✅ Build local sem Docker
- ✅ Rápido para desenvolvimento
- ✅ Limpa cache anterior
- ✅ Gera versão com hash Git

## Integração com CI/CD

### GitHub Actions

O arquivo `.github/workflows/deploy.yml` configura:

```yaml
- name: Generate build metadata
  run: |
    echo "cachebust=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    build-args: |
      CACHEBUST=${{ steps.meta.outputs.cachebust }}
```

**Benefícios:**
- ✅ Build automático a cada push
- ✅ Tags múltiplas (latest, branch, hash)
- ✅ Cache otimizado
- ✅ Histórico completo

## Verificação

### 1. No Site
Acesse o rodapé da página:
```
v1.0.0 | Build: 2024-11-22T03:15:42Z
```

### 2. Arquivo de Build
```bash
curl https://seu-dominio.com/build-info.txt
```

Retorna:
```
Build Time: 2024-11-22T03:15:42Z
Version: 1.0.0
Cache Bust: a3f2c91
```

### 3. JSON Local
```bash
cat build-info/last-build.json
```

Retorna:
```json
{
  "timestamp": "2024-11-22T03:15:42Z",
  "cachebust": "a3f2c91",
  "git_hash": "a3f2c91",
  "git_branch": "main",
  "image_name": "portal-noticias",
  "image_tag": "production"
}
```

## Fluxo de Deploy no Easypanel

### 1. Preparar Localmente
```bash
# Build a imagem
./scripts/build-with-cachebust.sh portal-noticias production

# Testar localmente
docker run -p 8080:80 portal-noticias:production
```

### 2. Enviar para Registry (opcional)
```bash
# Tag para registry
docker tag portal-noticias:production registry.example.com/portal-noticias:latest

# Push
docker push registry.example.com/portal-noticias:latest
```

### 3. No Easypanel
- Fazer upload do ZIP do projeto
- Configurar variáveis de ambiente
- Easypanel fará o build automaticamente usando o Dockerfile
- O CACHEBUST será gerado automaticamente

### 4. Forçar Rebuild no Easypanel
Se precisar forçar um rebuild completo:
1. Painel → Seu App → Settings
2. Delete o container atual
3. Clique em "Rebuild"
4. Ou use a opção "Clean Build" se disponível

## Solução de Problemas

### Cache não está invalidando?

1. **Verificar CACHEBUST no build:**
```bash
docker inspect portal-noticias:production | grep CACHEBUST
```

2. **Forçar rebuild completo:**
```bash
./deploy.sh production
# Já usa --no-cache automaticamente
```

3. **Limpar Docker cache:**
```bash
docker builder prune -a -f
docker system prune -a -f
```

4. **No navegador:**
- Ctrl + Shift + R (hard refresh)
- Ctrl + Shift + Delete (limpar cache)
- Usar janela anônima para testar

### Versão antiga ainda aparece?

1. **Verificar se container atualizou:**
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.CreatedAt}}"
```

2. **Verificar logs do container:**
```bash
docker logs portal-noticias-production
```

3. **Verificar arquivo de build:**
```bash
curl https://seu-dominio.com/build-info.txt
```

## Boas Práticas

### ✅ Fazer
- Sempre usar `./deploy.sh` para deploys
- Verificar versão após deploy
- Manter histórico em `build-info/`
- Usar Git para rastrear versões
- Limpar imagens antigas periodicamente

### ❌ Evitar
- Build sem CACHEBUST em produção
- Reutilizar tags de imagem
- Ignorar erros de build
- Deploy sem testar localmente
- Manter muitas imagens antigas

## Automação Completa

Para automação total:

1. **Configure GitHub Actions** (já incluído)
2. **Configure webhook no Easypanel** para auto-deploy
3. **Configure notificações** de deploy bem-sucedido
4. **Configure monitoring** para verificar saúde após deploy

## Resumo

O sistema de CACHEBUST automático garante:
- ✅ Usuários sempre veem a versão mais recente
- ✅ Sem cache de assets antigos
- ✅ Deploy confiável e repetível
- ✅ Rastreabilidade completa
- ✅ Integração com CI/CD
- ✅ Verificação fácil de versões
