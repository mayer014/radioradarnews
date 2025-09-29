# 🚀 Guia de Configuração da VPS para Armazenamento de Imagens

## 📋 Informações da VPS

- **SSH:** `lovable@168.231.89.162`
- **Porta:** `22`
- **Senha:** `25896589`
- **Domínio:** `media.radioradar.news`

## 🔧 Passo 1: Conectar e Atualizar VPS

```bash
# Conectar via SSH
ssh lovable@168.231.89.162

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

## 📦 Passo 2: Instalar Dependências

```bash
# Instalar Node.js 18+ LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v18.x.x ou superior
npm --version   # Deve mostrar 9.x.x ou superior

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx -y
```

## 📁 Passo 3: Criar Estrutura de Diretórios

```bash
# Criar pasta do servidor
mkdir -p /home/lovable/image-server
cd /home/lovable/image-server

# Criar pastas para uploads
mkdir -p /home/lovable/uploads/articles
mkdir -p /home/lovable/uploads/avatars
mkdir -p /home/lovable/uploads/banners

# Definir permissões
chmod -R 755 /home/lovable/uploads
```

## 🖥️ Passo 4: Criar Servidor Node.js

```bash
# Criar arquivo do servidor
nano /home/lovable/image-server/server.js
```

Cole o seguinte código:

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Chave de API para segurança
const VPS_API_KEY = 'radioradar_vps_2024_secure_key';

// Middleware de autenticação
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${VPS_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Configuração do Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'article';
    const uploadDir = `/home/lovable/uploads/${type}s`;
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname) || '.webp';
    cb(null, `${timestamp}-${randomStr}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Upload de imagem
app.post('/api/upload', authenticateRequest, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const type = req.body.type || 'article';
    const fileUrl = `https://media.radioradar.news/images/${type}s/${req.file.filename}`;

    console.log(`✅ Upload bem-sucedido: ${fileUrl}`);
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      type: type
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Deletar imagem
app.delete('/api/delete/:filename', authenticateRequest, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Buscar arquivo em todas as pastas
    const folders = ['articles', 'avatars', 'banners'];
    let deleted = false;

    for (const folder of folders) {
      const filePath = `/home/lovable/uploads/${folder}/${filename}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        console.log(`🗑️ Arquivo deletado: ${filePath}`);
        break;
      }
    }

    if (deleted) {
      res.json({ success: true, message: 'Arquivo deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

// Listar arquivos (opcional - para debug)
app.get('/api/list/:type', authenticateRequest, (req, res) => {
  try {
    const { type } = req.params;
    const uploadDir = `/home/lovable/uploads/${type}s`;
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => ({
      filename,
      url: `https://media.radioradar.news/images/${type}s/${filename}`,
      size: fs.statSync(path.join(uploadDir, filename)).size
    }));

    res.json({ files, total: files.length });
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de imagens rodando na porta ${PORT}`);
  console.log(`📁 Diretório de uploads: /home/lovable/uploads/`);
  console.log(`🔒 Autenticação: Habilitada`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});
```

Salve e feche (Ctrl+X, Y, Enter).

Agora crie o `package.json`:

```bash
nano /home/lovable/image-server/package.json
```

Cole o seguinte:

```json
{
  "name": "radioradar-image-server",
  "version": "1.0.0",
  "description": "Servidor de imagens para Radio Radar News",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

Salve e instale as dependências:

```bash
cd /home/lovable/image-server
npm install
```

## 🌐 Passo 5: Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/media.radioradar.news
```

Cole a seguinte configuração:

```nginx
server {
    listen 80;
    server_name media.radioradar.news;

    # Logs
    access_log /var/log/nginx/media.radioradar.access.log;
    error_log /var/log/nginx/media.radioradar.error.log;

    # Servir imagens diretamente (melhor performance)
    location /images/ {
        alias /home/lovable/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Compressão
        gzip on;
        gzip_types image/jpeg image/png image/webp image/gif;
        gzip_vary on;
    }

    # API para upload/delete
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Upload até 50MB
        client_max_body_size 50M;
    }
}
```

Ative o site:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/media.radioradar.news /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 Passo 6: Configurar SSL (HTTPS)

```bash
# Obter certificado SSL do Let's Encrypt
sudo certbot --nginx -d media.radioradar.news

# Seguir as instruções:
# - Digite seu email
# - Aceite os termos (Y)
# - Escolha redirecionamento HTTPS (2)

# Testar renovação automática
sudo certbot renew --dry-run
```

## 🚀 Passo 7: Iniciar Servidor com PM2

```bash
# Iniciar servidor
cd /home/lovable/image-server
pm2 start server.js --name "radioradar-images"

# Configurar para iniciar automaticamente
pm2 startup
pm2 save

# Ver status
pm2 status

# Ver logs
pm2 logs radioradar-images

# Comandos úteis:
# pm2 restart radioradar-images
# pm2 stop radioradar-images
# pm2 delete radioradar-images
```

## ✅ Passo 8: Testar Instalação

```bash
# Teste 1: Health check
curl https://media.radioradar.news/api/health

# Teste 2: Upload de teste (substitua o path da imagem)
curl -X POST https://media.radioradar.news/api/upload \
  -H "Authorization: Bearer radioradar_vps_2024_secure_key" \
  -F "file=@/path/to/test-image.jpg" \
  -F "type=article"
```

## 🔧 Passo 9: Configurar Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ver status
sudo ufw status
```

## 📊 Passo 10: Monitoramento e Manutenção

### Logs do PM2
```bash
# Ver logs em tempo real
pm2 logs radioradar-images

# Ver logs salvos
pm2 logs radioradar-images --lines 100
```

### Logs do Nginx
```bash
# Access logs
sudo tail -f /var/log/nginx/media.radioradar.access.log

# Error logs
sudo tail -f /var/log/nginx/media.radioradar.error.log
```

### Espaço em disco
```bash
# Ver uso de disco
df -h

# Ver tamanho da pasta de uploads
du -sh /home/lovable/uploads/

# Ver tamanho por tipo
du -sh /home/lovable/uploads/*/
```

### Limpeza periódica (opcional)
```bash
# Criar script de limpeza de imagens antigas (mais de 90 dias)
nano /home/lovable/cleanup-old-images.sh
```

Cole:
```bash
#!/bin/bash
find /home/lovable/uploads/ -type f -mtime +90 -delete
echo "Limpeza concluída: $(date)" >> /var/log/image-cleanup.log
```

Torne executável e agende:
```bash
chmod +x /home/lovable/cleanup-old-images.sh
# Adicionar ao crontab para executar todo domingo às 3h
(crontab -l 2>/dev/null; echo "0 3 * * 0 /home/lovable/cleanup-old-images.sh") | crontab -
```

## 🎯 Próximos Passos

1. ✅ Acesse o AdminPanel → Aba "Otimização"
2. ✅ Clique em "Verificar Status" no painel de Migração VPS
3. ✅ Clique em "Iniciar Migração Completa"
4. ✅ Aguarde a migração automática de todas as imagens
5. ✅ Teste fazendo upload de novas imagens

## 🆘 Solução de Problemas

### Erro: "Unauthorized" ao fazer upload
```bash
# Verificar se a API key está correta no servidor
grep "VPS_API_KEY" /home/lovable/image-server/server.js
```

### Servidor não inicia
```bash
# Ver logs de erro
pm2 logs radioradar-images --err

# Reiniciar servidor
pm2 restart radioradar-images
```

### Imagens não aparecem
```bash
# Verificar permissões
ls -la /home/lovable/uploads/

# Corrigir permissões se necessário
sudo chmod -R 755 /home/lovable/uploads/
sudo chown -R lovable:lovable /home/lovable/uploads/
```

### Nginx não reinicia
```bash
# Ver erro detalhado
sudo nginx -t

# Ver logs
sudo journalctl -u nginx -n 50
```

## 📈 Performance Esperada

- **Upload:** ~2-5 segundos por imagem (1-5MB)
- **Download:** Servido diretamente pelo Nginx (muito rápido)
- **Cache:** 1 ano de cache no navegador
- **Compressão:** WebP automático (60-80% menor)

## 🎉 Conclusão

Após seguir todos estes passos:

1. ✅ Servidor VPS configurado e rodando
2. ✅ Nginx servindo imagens com SSL
3. ✅ PM2 mantendo servidor ativo 24/7
4. ✅ Firewall configurado e seguro
5. ✅ Sistema pronto para receber uploads do Supabase

**Status esperado:**
- `https://media.radioradar.news/api/health` → `{ "status": "ok" }`
- Upload funcional via AdminPanel
- Imagens servidas em `https://media.radioradar.news/images/...`
