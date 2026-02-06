
# Plano: Corrigir Acúmulo de Imagens de Artes Sociais

## Problema
Cada postagem nas redes sociais cria 1-2 imagens novas na VPS (e/ou Supabase Storage) que nunca sao apagadas nem sobrescritas. Com o tempo isso enche o disco da VPS.

## Solucao (3 correcoes, zero quebra de fluxo)

### Correcao 1: Nome fixo por artigo (sobrescrever em vez de acumular)

**Arquivo**: `src/components/SocialMediaPostModal.tsx`

Mudar o nome do arquivo de:
```
social-art-{articleId}-{Date.now()}.png
```
Para um nome fixo por artigo:
```
social-art-{articleId}.png
```

Isso garante que cada artigo tenha no maximo **1 imagem** de arte social na VPS/Storage, sobrescrevendo a anterior automaticamente.

### Correcao 2: Cache da URL para evitar upload duplicado (FB + IG)

**Arquivo**: `src/components/SocialMediaPostModal.tsx`

Adicionar uma variavel de estado `uploadedArtUrl` que armazena a URL apos o primeiro upload. Quando o usuario postar na segunda rede social, reutilizar a URL ja carregada em vez de fazer um novo upload.

Fluxo corrigido:
```text
Gerar Arte --> Postar no Facebook --> Upload (1x) --> Salvar URL
                                                        |
Postar no Instagram ------> Reutilizar URL salva -------+
```

### Correcao 3: Nome fixo na Edge Function vps-image-service

**Arquivo**: `supabase/functions/vps-image-service/index.ts`

Quando o `file_name` recebido ja contiver um nome fixo (como `social-art-{id}.png`), usar esse nome diretamente em vez de gerar um novo nome aleatorio. Isso permite que o VPS sobrescreva o arquivo existente.

### Correcao 4: Nome fixo na Edge Function generate-social-art

**Arquivo**: `supabase/functions/generate-social-art/index.ts`

Mudar o nome do arquivo de `social-art-${Date.now()}.png` para usar o ID do artigo (quando disponivel), garantindo sobrescrita no Supabase Storage via `upsert: true`.

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/SocialMediaPostModal.tsx` | Nome fixo por artigo + cache da URL entre FB/IG |
| `supabase/functions/vps-image-service/index.ts` | Respeitar nome fixo recebido do frontend |
| `supabase/functions/generate-social-art/index.ts` | Nome fixo por artigo no Storage |

## Impacto
- **Zero quebra de fluxo**: As mesmas funcoes continuam sendo chamadas, apenas os nomes de arquivo mudam
- **Reducao imediata**: De ~2 imagens por postagem para no maximo 1 por artigo (sobrescrita)
- **Retrocompativel**: Imagens ja existentes continuam funcionando normalmente
- **Futuro**: Se a VPS encher, as imagens antigas de artigos que nao existem mais podem ser limpas manualmente ou via script agendado
