# 🚀 Guia de Deploy Forçado no Easypanel

## 🎯 Problema Resolvido

Este guia resolve o problema de **cache Docker persistente** no Easypanel, onde mudanças no código (especialmente em componentes React como `NewsGrid` e `LatestNews`) não aparecem em produção mesmo após rebuild.

## 📋 O Que Foi Implementado

### 1. **Dockerfile Otimizado** ✅
- Cache busting agressivo com `CACHEBUST` e `BUILD_TIME`
- Cópia do código ANTES da instalação de dependências
- Limpeza completa de todos os caches (npm, Vite, node_modules)
- Build forçado com flag `--force`

### 2. **Script de Deploy Forçado** ✅
- `easypanel-deploy.sh`: Força novo deploy com commit timestamp
- Invalida cache do Docker automaticamente
- Gera logs detalhados do processo

### 3. **Script de Verificação** ✅
- `scripts/verify-deploy.sh`: Verifica se deploy foi bem-sucedido
- Checa build-info.txt, versão e timestamp
- Fornece resumo completo

### 4. **Indicador Visual de Versão** ✅
- Footer atualizado com informações detalhadas:
  - Versão da aplicação
  - Timestamp do build
  - Hash de cache único

## 🔧 Como Usar

### Método 1: Deploy Forçado via Script (Recomendado)

```bash
# Tornar o script executável
chmod +x easypanel-deploy.sh

# Executar deploy forçado
./easypanel-deploy.sh
```

**O que o script faz:**
1. Adiciona timestamp ao `App.tsx` (força mudança no código)
2. Cria commit com mensagem única
3. Faz push para o repositório
4. Easypanel detecta mudança e faz rebuild completo

### Método 2: Deploy Manual no Easypanel

1. **Acesse o Easypanel**
2. Vá em **"Implantações"** (Deployments)
3. Clique nos **3 pontinhos (⋮)** da última implantação
4. Selecione **"Rebuild without cache"** ou **"Reconstruir sem cache"**

### Método 3: Commit Manual

```bash
# Adicionar comentário com timestamp em qualquer arquivo
echo "// Deploy: $(date)" >> src/App.tsx

# Commit e push
git add .
git commit -m "Force deploy: $(date)"
git push
```

## ✅ Verificar Se Deploy Foi Bem-Sucedido

### Verificação Automática

```bash
# Executar script de verificação (substitua a URL)
chmod +x scripts/verify-deploy.sh
./scripts/verify-deploy.sh https://seu-dominio.com
```

### Verificação Manual

#### 1. **Checar build-info.txt**
```bash
curl https://seu-dominio.com/build-info.txt
```

Deve retornar:
```
Build Time: 2024-01-XX...
Version: 1.0.0
Cache Bust: XXXXXXXXX
```

#### 2. **Verificar Footer no Site**
- Abra o site em produção
- Role até o final da página
- Verifique:
  - ✅ Versão atualizada
  - ✅ Build timestamp recente
  - ✅ Hash de cache único

#### 3. **Verificar Funcionalidade**
- **Últimas Notícias**: Deve mostrar APENAS notícias gerais (sem artigos de colunistas)
- **Colunistas**: Seção separada mostrando APENAS artigos de colunistas
- **Avatar do Colunista**: Deve aparecer corretamente nos cards

## 🔍 Troubleshooting

### Problema: Deploy não atualiza mesmo após script

**Solução:**
```bash
# 1. Verificar se push foi bem-sucedido
git log --oneline -5

# 2. Forçar novo deploy com mudança maior
echo "/* Force: $(date +%s) */" >> src/App.tsx
git add .
git commit -m "FORCE REBUILD: $(date +%s)"
git push

# 3. No Easypanel, fazer "Restart" + "Rebuild without cache"
```

### Problema: Site mostra versão antiga mesmo após deploy

**Solução:**
```bash
# Limpar cache do navegador
# Chrome/Edge: Ctrl + Shift + Delete → "Cached images and files"
# Firefox: Ctrl + Shift + Delete → "Cache"

# Ou forçar recarga sem cache
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)
```

### Problema: Build falha no Easypanel

**Solução:**
1. Verificar logs do Easypanel para erros específicos
2. Verificar se variáveis de ambiente estão configuradas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Outras variáveis necessárias
3. Tentar rebuild sem cache novamente
4. Se persistir, deletar e recriar app no Easypanel

## 📊 Entendendo o Cache Docker

### Por Que o Cache Persiste?

Docker usa **camadas em cache** para acelerar builds:

```dockerfile
COPY package.json .     # Camada 1 (cached)
RUN npm install         # Camada 2 (cached se package.json não mudou)
COPY . .                # Camada 3 (cached se arquivos não mudaram)
RUN npm run build       # Camada 4 (cached se camadas anteriores não mudaram)
```

**Problema:** Docker pode não detectar mudanças em arquivos se o timestamp/hash for igual.

### Como Resolvemos?

```dockerfile
# 1. CACHEBUST único por build
ARG CACHEBUST=1
RUN echo "FORCE: ${CACHEBUST}" > /tmp/cache.txt

# 2. Copiar código ANTES de npm install
COPY . .                # Força detecção de mudanças
RUN npm install

# 3. Limpar TODOS os caches
RUN rm -rf node_modules/.vite dist .vite

# 4. Build forçado
RUN npm run build -- --force
```

## 🎯 Checklist de Deploy

- [ ] Código commitado e pushed para repositório
- [ ] Executar `easypanel-deploy.sh` OU rebuild manual no Easypanel
- [ ] Aguardar 2-5 minutos para build completo
- [ ] Verificar build-info.txt no site
- [ ] Verificar versão no footer
- [ ] Testar funcionalidades:
  - [ ] Notícias gerais sem artigos de colunistas
  - [ ] Artigos de colunistas separados
  - [ ] Avatares dos colunistas aparecendo
- [ ] Limpar cache do navegador (Ctrl+Shift+R)

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. Verificar logs detalhados do Easypanel
2. Confirmar que todas as variáveis de ambiente estão configuradas
3. Considerar deletar e recriar o app no Easypanel
4. Verificar se há CDN ou cache reverso na frente do Easypanel

## 🎉 Resultado Esperado

Após deploy bem-sucedido:

✅ Footer mostra versão e build atualizados
✅ Últimas Notícias = apenas notícias gerais
✅ Seção de Colunistas separada com artigos de colunistas
✅ Avatares dos colunistas aparecem corretamente
✅ Todas as mudanças de código refletidas em produção
