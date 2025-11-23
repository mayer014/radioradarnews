# Configuração CORS no Servidor VPS

## Problema Identificado
As imagens hospedadas no VPS (`media.radioradar.news`) estão sendo bloqueadas pelo CORS quando acessadas via canvas HTML5, resultando em imagens com dimensões 0x0 mesmo quando carregadas com sucesso.

## Solução: Configurar Headers CORS no Nginx

### 1. Localizar o arquivo de configuração do Nginx

```bash
# Conectar ao VPS via SSH
ssh usuario@seu-vps-ip

# Localizar a configuração do site
cd /etc/nginx/sites-available/
# ou
cd /etc/nginx/conf.d/

# Encontrar o arquivo de configuração (geralmente media.radioradar.news ou default)
ls -la
```

### 2. Editar a configuração do servidor

```bash
sudo nano /etc/nginx/sites-available/media.radioradar.news
# ou
sudo nano /etc/nginx/conf.d/default.conf
```

### 3. Adicionar configuração CORS

Adicione o seguinte bloco dentro da seção `server { }` ou `location / { }`:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name media.radioradar.news;

    # Configurações SSL existentes...
    
    # Diretório de uploads
    root /var/www/media;
    
    location /uploads/ {
        # Headers CORS obrigatórios
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
        add_header 'Access-Control-Max-Age' '3600' always;
        
        # Importante: permitir credenciais se necessário
        # add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Responder OPTIONS requests (preflight)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
            add_header 'Access-Control-Max-Age' '3600' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' '0';
            return 204;
        }
        
        # Cache de imagens
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Permitir leitura de arquivos
        autoindex off;
        try_files $uri =404;
    }
    
    # Caso queira aplicar CORS em todo o servidor
    location / {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
        
        try_files $uri $uri/ =404;
    }
}
```

### 4. Configuração Alternativa (Mais Restritiva - Recomendado para Produção)

Se quiser limitar apenas aos seus domínios:

```nginx
location /uploads/ {
    # Permitir apenas domínios específicos
    set $cors '';
    if ($http_origin ~* (https?://(localhost|127\.0\.0\.1|radioradar\.news|.*\.lovableproject\.com)(:[0-9]+)?$)) {
        set $cors 'true';
    }
    
    if ($cors = 'true') {
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' '3600' always;
    }
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
        add_header 'Access-Control-Max-Age' '3600' always;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' '0';
        return 204;
    }
    
    expires 30d;
    try_files $uri =404;
}
```

### 5. Testar a configuração

```bash
# Verificar se há erros de sintaxe
sudo nginx -t

# Se estiver OK, recarregar o Nginx
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

### 6. Verificar se CORS está funcionando

```bash
# Testar com curl de outro servidor ou localmente
curl -I -X GET https://media.radioradar.news/uploads/seu-arquivo.jpg \
  -H "Origin: https://radioradar.news"

# Deve retornar headers como:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, OPTIONS
```

## Teste no Browser

Após aplicar as configurações, abra o console do navegador e teste:

```javascript
// Teste rápido de CORS
fetch('https://media.radioradar.news/uploads/1759754975459.webp', {
  method: 'GET',
  mode: 'cors'
})
.then(r => console.log('✅ CORS OK:', r.headers))
.catch(e => console.error('❌ CORS Erro:', e));

// Teste de imagem no canvas
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => console.log('✅ Imagem carregada:', img.naturalWidth, 'x', img.naturalHeight);
img.onerror = () => console.error('❌ Erro ao carregar imagem');
img.src = 'https://media.radioradar.news/uploads/1759754975459.webp';
```

## Pontos Importantes

### ✅ Vantagens com CORS configurado:
- **Performance**: Sem necessidade de proxy
- **Velocidade**: Carregamento direto das imagens
- **Confiabilidade**: Menos pontos de falha
- **Cache**: Browser pode cachear diretamente

### ⚠️ Considerações de Segurança:

1. **`Access-Control-Allow-Origin: *`**
   - Permite qualquer origem
   - Use apenas se o conteúdo é público
   - Preferível para imagens públicas

2. **Domínios específicos**
   - Mais seguro
   - Requer manutenção (adicionar novos domínios)
   - Recomendado para conteúdo sensível

3. **HTTPS obrigatório**
   - CORS funciona melhor com HTTPS
   - Certificado SSL válido é essencial

## Troubleshooting

### Problema: Headers não aparecem
```bash
# Verificar se o módulo headers está habilitado
nginx -V 2>&1 | grep -o with-http_addition_module

# Recarregar completamente o Nginx
sudo systemctl restart nginx
```

### Problema: CORS funciona no curl mas não no browser
- Limpar cache do browser (Ctrl+Shift+Del)
- Testar em aba anônima
- Verificar se há Service Workers interferindo

### Problema: Apenas algumas imagens falham
- Verificar permissões dos arquivos: `chmod 644 /var/www/media/uploads/*`
- Verificar propriedade: `chown www-data:www-data /var/www/media/uploads/*`

## Backup antes de alterar

```bash
# Sempre faça backup da configuração atual
sudo cp /etc/nginx/sites-available/media.radioradar.news /etc/nginx/sites-available/media.radioradar.news.backup
```

## Monitoramento

Após aplicar, monitore os logs:

```bash
# Logs de erro
sudo tail -f /var/log/nginx/error.log

# Logs de acesso
sudo tail -f /var/log/nginx/access.log | grep uploads
```

## Próximos Passos

1. ✅ Aplicar configuração CORS no Nginx
2. ✅ Testar com curl e browser
3. ✅ Remover lógica de proxy forçado do código frontend (uma vez confirmado funcionando)
4. ✅ Monitorar performance e erros
5. ✅ Ajustar cache e CDN se necessário
