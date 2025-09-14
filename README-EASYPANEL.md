# Deploy no Easypanel - Guia Completo

Este guia explica como fazer deploy da aplicação Portal de Notícias no Easypanel.

## Pré-requisitos

1. Conta no Easypanel
2. Projeto configurado com Supabase
3. Arquivo ZIP do projeto

## Passo a Passo

### 1. Preparar o Projeto

O projeto já está otimizado para Easypanel com:
- Dockerfile simplificado usando apenas npm
- Configuração para servir na porta 3000
- Suporte completo a SPA (Single Page Application)
- Variáveis de ambiente flexíveis

### 2. Configurar Variáveis de Ambiente

No painel do Easypanel, configure as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
VITE_RADIO_STREAM_URL=https://sua-radio-stream.com/stream
VITE_APP_NAME=Portal de Notícias
VITE_APP_DESCRIPTION=Portal de notícias moderno e responsivo
VITE_APP_URL=https://seu-dominio.com
NODE_ENV=production
PORT=3000
```

### 3. Upload do Projeto

1. Faça upload do arquivo ZIP do projeto no Easypanel
2. O sistema detectará automaticamente o Dockerfile
3. Configure a porta 3000 nas configurações da aplicação

### 4. Deploy

1. O Easypanel executará automaticamente:
   ```bash
   npm install
   npm run build
   serve -s dist -l 3000
   ```

2. A aplicação ficará disponível na porta 3000

### 5. Configurações Importantes

- **Porta**: 3000 (configurada no Dockerfile)
- **Build Command**: Automático via Dockerfile
- **Start Command**: `serve -s dist -l 3000`
- **Health Check**: HTTP GET na porta 3000

## Troubleshooting

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que não há erros no código

### Aplicação não carrega
- Verifique se a porta 3000 está configurada corretamente
- Confirme que as variáveis VITE_SUPABASE_* estão corretas

### Rotas não funcionam (404)
- A configuração do `serve -s` já resolve isso automaticamente
- Todas as rotas redirecionam para index.html (SPA)

## Vantagens desta Configuração

✅ Dockerfile otimizado e simples  
✅ Build rápido usando apenas npm  
✅ Suporte completo a SPA  
✅ Variáveis de ambiente flexíveis  
✅ Fallbacks para desenvolvimento  
✅ Configuração de produção robusta  

## Suporte

Se encontrar problemas, verifique:
1. Logs do build no Easypanel
2. Configuração das variáveis de ambiente
3. Status da aplicação Supabase