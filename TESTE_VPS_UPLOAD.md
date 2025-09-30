# 🧪 Teste de Validação VPS - Upload de Imagens

## 📋 Checklist de Teste

### 1️⃣ Teste Manual - Publicar Artigo com Imagem

1. **Acessar o painel de administração**
   - Ir para `/admin-panel`
   - Clicar em "Criar Artigo"

2. **Preencher dados básicos**
   - Título: "Teste Upload VPS - [DATA/HORA]"
   - Categoria: qualquer
   - Conteúdo: qualquer texto

3. **Fazer upload da imagem**
   - Selecionar uma imagem local
   - **IMPORTANTE**: Abrir DevTools (F12) → Aba Network
   - Observar se aparece: `POST https://media.radioradar.news/api/upload`
   - Status deve ser: `200 OK`
   - Resposta deve ser: `{"success": true, "url": "/uploads/XXXXX.webp"}`

4. **Publicar o artigo**
   - Salvar e publicar

---

## 2️⃣ Validação no Banco de Dados

### Query SQL para verificar últimas imagens

```sql
-- Verificar artigos mais recentes
SELECT 
  id, 
  title, 
  featured_image as image_url,
  created_at
FROM articles
WHERE featured_image IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**✅ Resultado esperado:**
```
image_url: https://media.radioradar.news/uploads/1759184567890-abc123.webp
```

**❌ NÃO deve aparecer:**
- `https://bwxbhircezyhwekdngdk.supabase.co/storage/...`
- `https://cdn.midiamax.com.br/...`
- Qualquer CDN externa

---

## 3️⃣ Validação na VPS

### Verificar arquivo físico criado

```bash
# Conectar na VPS
ssh usuario@media.radioradar.news

# Listar uploads recentes
ls -lht /home/lovable/vps-image-service/uploads | head -10

# Ver logs do serviço
pm2 logs vps-image-service --lines 50
```

**✅ Resultado esperado:**
```
POST /api/upload 200 - - 345.678 ms
Arquivo salvo: /home/lovable/vps-image-service/uploads/1759184567890-abc123.webp
```

---

## 4️⃣ Validação de Outros Tipos de Upload

### Banners
```sql
SELECT id, title, image_url, created_at
FROM banners
WHERE image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
```

### Avatares de Colunistas
```sql
SELECT id, name, avatar, created_at
FROM profiles
WHERE avatar IS NOT NULL
ORDER BY updated_at DESC
LIMIT 3;
```

---

## 📊 Status Atual do Sistema

### Código Corrigido ✅
- `VPSImageService.ts` → POST direto para VPS
- `ImageUpload.tsx` → Usa VPSImageService
- `ImageUploadColumnist.tsx` → Usa VPSImageService
- `BannerManager.tsx` → Usa ImageUpload (que usa VPS)
- `RobustArticleEditor.tsx` → Usa VPSImageService

### Aguardando Teste ⏳
- Upload manual de artigo com imagem
- Verificação no banco de dados
- Confirmação física do arquivo na VPS

---

## 🚨 Troubleshooting

### Se o upload falhar:

1. **Verificar saúde da VPS:**
   ```bash
   curl https://media.radioradar.news/api/health
   # Deve retornar: {"status":"ok"}
   ```

2. **Verificar logs do servidor:**
   ```bash
   pm2 logs vps-image-service --lines 100
   ```

3. **Verificar DevTools do navegador:**
   - Console → Verificar erros JS
   - Network → Ver response do POST

4. **Verificar permissões do diretório:**
   ```bash
   ls -la /home/lovable/vps-image-service/uploads
   # Deve ter permissão 755 ou 775
   ```

---

## ✅ Critérios de Aceite Final

- [ ] POST `/api/upload` aparece no DevTools com status 200
- [ ] URL no banco começa com `https://media.radioradar.news/uploads/`
- [ ] Arquivo físico existe em `/home/lovable/vps-image-service/uploads/`
- [ ] Imagem é acessível via URL pública
- [ ] Nenhuma imagem nova vai para Supabase Storage
