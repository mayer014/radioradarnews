# 🚀 Guia de Deploy no Easypanel

## Problema: Cache do Docker

Se você fez alterações no código mas a produção ainda mostra a versão antiga, é porque o **Docker está usando cache das layers antigas**.

## ✅ Solução 1: Build Args no Easypanel

### Configurar Build Args Dinâmicos

No painel do Easypanel, vá em:

1. **Seu Projeto** → **Settings** → **Source**
2. Na seção **Build Args**, adicione:

```bash
CACHEBUST=$(date +%s)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

Isso força um novo build a cada deploy.

### Como Funciona

- `CACHEBUST=$(date +%s)`: Gera timestamp único
- `BUILD_TIME`: Registra quando foi feito o build
- Cada valor diferente invalida o cache do Docker

## ✅ Solução 2: Rebuild Manual sem Cache

### Via Interface do Easypanel

1. Vá até **Deployments**
2. Clique nos **3 pontinhos** do último deploy
3. Selecione **"Rebuild without cache"**
4. Aguarde o novo build completar

### Via CLI (se tiver acesso SSH)

```bash
# Parar o container
docker stop radioradar-site

# Remover a imagem antiga
docker rmi easypanel/radioradar-site/radioradar-site

# Fazer build sem cache
docker build --no-cache \
  --build-arg CACHEBUST=$(date +%s) \
  --build-arg BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  -t easypanel/radioradar-site/radioradar-site .

# Reiniciar
docker start radioradar-site
```

## ✅ Solução 3: Configuração Permanente no Easypanel

### Adicionar Hook de Pre-Deploy

Se o Easypanel suportar hooks, crie um script `pre-deploy.sh`:

```bash
#!/bin/bash
# pre-deploy.sh - Limpar cache antes do build

echo "🧹 Limpando cache do Docker..."

# Remover imagens antigas do projeto
docker rmi -f $(docker images -q easypanel/radioradar-site/radioradar-site) 2>/dev/null || true

# Limpar build cache do Docker
docker builder prune -f

echo "✅ Cache limpo, pronto para build fresco"
```

## 🔍 Verificar se o Build Funcionou

### 1. Verificar Build Info

Após o deploy, acesse no navegador:
```
https://seu-dominio.com/build-info.txt
```

Deve mostrar:
```
Build Time: 2025-11-22T03:30:00Z
Version: 1.0.0
Cache Bust: abc123def456
```

### 2. Verificar Console do Navegador

Abra o DevTools (F12) e procure por:
```
Runtime environment loaded: X variables configured
```

### 3. Verificar Logs do Container

No Easypanel, vá em **Logs** e procure por:
```
✅ Generated /usr/share/nginx/html/env.js with runtime environment
🔧 Runtime environment injection completed
```

## 🎯 Checklist de Deploy

Antes de cada deploy importante:

- [ ] Commit e push das alterações no Git
- [ ] Configurar `CACHEBUST` e `BUILD_TIME` como build args
- [ ] Fazer rebuild **sem cache** se for a primeira vez
- [ ] Verificar logs do build para confirmar que usou código novo
- [ ] Testar a URL em produção (Ctrl+F5 para limpar cache do navegador)
- [ ] Verificar `/build-info.txt` para confirmar timestamp novo

## 🐛 Troubleshooting

### Problema: Ainda mostra código antigo

**Solução:**
```bash
# 1. Limpar TUDO do Docker
docker system prune -af --volumes

# 2. Rebuild completo
docker build --no-cache --pull \
  --build-arg CACHEBUST=$(date +%s) \
  -t easypanel/radioradar-site/radioradar-site .
```

### Problema: Variáveis de ambiente não funcionam

**Solução:**
1. Verificar que as variáveis estão configuradas no Easypanel em **Environment**
2. Confirmar que `docker/entrypoint/10-env.sh` está executável
3. Verificar logs do container no startup

### Problema: Build falha com erro de sintaxe

**Solução:**
- Garanta que `BUILD_TIME` está sendo passado como build arg
- Se não configurar build args, o Dockerfile usa valores padrão
- Verifique que não tem comandos shell em variáveis ENV

## 📊 Monitoramento de Builds

### Ver Histórico de Builds

No Easypanel:
1. **Deployments** → ver lista completa
2. Verde = sucesso
3. Vermelho = falhou
4. Cada linha mostra timestamp do build

### Comparar Versões

1. Anote o timestamp do último build com sucesso
2. Compare com `/build-info.txt` em produção
3. Se forem diferentes = cache problemático

## 🔐 Variáveis de Ambiente Necessárias

Configure no Easypanel em **Environment**:

```bash
# Supabase
VITE_SUPABASE_URL=https://bwxbhircezyhwekdngdk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Groq API (opcional)
GROQ_API_KEY=seu_groq_api_key

# URL da aplicação
VITE_APP_URL=https://seu-dominio.com
```

## 📝 Notas Importantes

1. **Build Args vs Environment Variables**:
   - Build Args: Usados DURANTE o build do Docker
   - Environment: Usados em RUNTIME quando container roda

2. **Cache do Docker é bom... mas não sempre**:
   - Cache acelera builds repetidos
   - Mas impede de ver alterações no código
   - Use `--no-cache` quando fizer mudanças importantes

3. **Nginx Cache**:
   - O nginx.conf já está configurado para não cachear
   - Se ainda tiver problemas, adicione headers mais agressivos

## 🎉 Exemplo de Deploy Bem-Sucedido

```bash
##########################################
### Building Docker image
### Sat, 22 Nov 2025 03:30:00 GMT
##########################################

CACHEBUST: 1732245000
BUILD_TIME: 2025-11-22T03:30:00Z
✅ Generated /usr/share/nginx/html/env.js
📋 Configured variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
✅ Build completed successfully

##########################################
### Deploy service: radioradar-site
### Status: Running
##########################################
```

## 🆘 Suporte

Se continuar com problemas:

1. Capture screenshots dos logs de build
2. Verifique o conteúdo de `/build-info.txt`
3. Teste fazer `docker system prune -af` e rebuild
4. Entre em contato com suporte do Easypanel para verificar configuração de build args
