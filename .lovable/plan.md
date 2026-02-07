

# Plano: Arquivo Unico Universal para Artes Sociais (Inclui Colunistas)

## Situacao Atual

O fluxo de postagem ja usa o mesmo componente (`SocialMediaPostModal`) tanto para materias regulares quanto para materias de colunistas. O nome do arquivo atual e `social-art-{articleId}.png`, ou seja, cada artigo (incluindo de colunistas) cria um arquivo separado. Com 40-60 materias/dia + varios colunistas, isso acumula dezenas de imagens.

## Solucao: Um Unico Arquivo Universal

Trocar de `social-art-{articleId}.png` para `social-art-latest.png` em todos os pontos. Assim, independente de quantos artigos ou colunistas publiquem, **sempre existira apenas 1 arquivo** que e sobrescrito a cada geracao.

## Alteracoes

### 1. `src/components/SocialMediaPostModal.tsx`
- Linha 130: Mudar `social-art-${article.id}.png` para `social-art-latest.png`

### 2. `supabase/functions/generate-social-art/index.ts`
- Linha 167: Mudar para sempre usar `social-art-latest.png` (remover condicional com article_id)

### 3. `supabase/functions/vps-image-service/index.ts`
- Sem alteracao necessaria: o regex `/^social-art-.+\.\w+$/` ja aceita `social-art-latest.png`

## Resultado
- Materias regulares: sobrescrevem `social-art-latest.png`
- Materias de colunistas: sobrescrevem o mesmo `social-art-latest.png`
- Total de arquivos de arte social no sistema: **sempre 1**
- Zero quebra de fluxo: o upload funciona identicamente, so o nome muda

