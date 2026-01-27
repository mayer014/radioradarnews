
# Plano de Correção: Prompt de Reescrita e Legenda do Feed

## Resumo Executivo
Este plano corrige dois problemas identificados no sistema sem alterar o fluxo existente:

1. **Prompt de Reescrita**: O salvamento usa `update()` que não cria o registro se ele não existir. Vamos mudar para `upsert`.
2. **Legenda Curta**: A função `generateCaption` não inclui o resumo da matéria. Vamos adicionar o campo `excerpt` e formatar melhor a legenda.

---

## Correção 1: Prompt de Reescrita

### Problema Identificado
O componente `AIPromptEditor.tsx` usa `.update()` para salvar o prompt, mas se o registro na tabela `settings` não existir previamente, o update silenciosamente não faz nada.

### Solução
Substituir `.update()` por `.upsert()` com `onConflict` para garantir que o registro seja criado se não existir, ou atualizado se já existir.

### Arquivo a Modificar
`src/components/AIPromptEditor.tsx`

### Alterações

**Função `handleSave` (linhas 122-167):**
```typescript
// Antes:
const { error } = await supabase
  .from('settings')
  .update({
    value: { ... },
    updated_at: new Date().toISOString()
  })
  .eq('category', 'ai')
  .eq('key', 'rewriter_system_prompt');

// Depois:
const { error } = await supabase
  .from('settings')
  .upsert({
    category: 'ai',
    key: 'rewriter_system_prompt',
    value: {
      prompt: prompt,
      updated_at: new Date().toISOString(),
      default: false
    },
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'category,key'
  });
```

**Função `handleRestore` (linhas 169-210):**
Aplicar a mesma correção de `update()` para `upsert()`.

---

## Correção 2: Legenda do Feed (generateCaption)

### Problema Identificado
A função `generateCaption` em `shareHelpers.ts` não inclui o `excerpt` (resumo) da matéria, resultando em legendas muito curtas para redes sociais.

### Solução
1. Adicionar `excerpt` à interface `CaptionData`
2. Incluir o resumo formatado na legenda gerada
3. Atualizar as chamadas em `ShareMenu.tsx` e `SocialMediaPostModal.tsx`

### Arquivos a Modificar

**1. `src/utils/shareHelpers.ts` (linhas 59-101)**

```typescript
// Antes:
interface CaptionData {
  title: string;
  url: string;
  category: string;
  author?: string;
}

export const generateCaption = ({ title, url, category, author }: CaptionData): string => {
  const hashtags = categoryHashtags[category] || ['#notícias', '#brasil'];
  const authorCredit = author ? `\n\n📝 Por: ${author}` : '';
  
  return `${title}${authorCredit}

🔗 Leia mais: ${url}

${hashtags.join(' ')} #portalnews #notícias`;
};

// Depois:
interface CaptionData {
  title: string;
  url: string;
  category: string;
  author?: string;
  excerpt?: string; // NOVO: resumo da matéria
}

export const generateCaption = ({ title, url, category, author, excerpt }: CaptionData): string => {
  const hashtags = categoryHashtags[category] || ['#notícias', '#brasil'];
  const authorCredit = author ? `\n\n📝 Por: ${author}` : '';
  
  // Formatar excerpt para ter no máximo 200 caracteres
  const summaryText = excerpt 
    ? `\n\n📰 ${excerpt.length > 200 ? excerpt.substring(0, 197) + '...' : excerpt}`
    : '';
  
  return `${title}${summaryText}${authorCredit}

🔗 Leia mais: ${url}

${hashtags.join(' ')} #radioradarnews #notícias`;
};
```

**2. `src/components/share/ShareMenu.tsx` (linha 72)**

```typescript
// Antes:
const caption = generateCaption({ title, url, category, author });

// Depois:
const caption = generateCaption({ title, url, category, author, excerpt });
```

**3. `src/components/SocialMediaPostModal.tsx` (linhas 62-67)**

```typescript
// Antes:
const captionText = generateCaption({
  title: article.title,
  category: article.category,
  url: articleUrl,
  author: isColumnist ? article.columnist_name || undefined : undefined
});

// Depois:
const captionText = generateCaption({
  title: article.title,
  category: article.category,
  url: articleUrl,
  author: isColumnist ? article.columnist_name || undefined : undefined,
  excerpt: article.excerpt // NOVO: incluir resumo
});
```

---

## Exemplo de Resultado

### Legenda Atual (muito curta):
```
Título da Matéria

📝 Por: João Silva

🔗 Leia mais: https://radioradar.news/artigo/123

#política #brasil #governo #democracia #portalnews #notícias
```

### Legenda Corrigida (com resumo):
```
Título da Matéria

📰 Resumo breve da matéria com as informações principais em 2-3 linhas que ajudam o leitor a entender o contexto...

📝 Por: João Silva

🔗 Leia mais: https://radioradar.news/artigo/123

#política #brasil #governo #democracia #radioradarnews #notícias
```

---

## Resumo das Modificações

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/AIPromptEditor.tsx` | Trocar `.update()` por `.upsert()` com `onConflict` |
| `src/utils/shareHelpers.ts` | Adicionar `excerpt` à interface e função |
| `src/components/share/ShareMenu.tsx` | Passar `excerpt` para `generateCaption` |
| `src/components/SocialMediaPostModal.tsx` | Passar `excerpt` para `generateCaption` |

---

## Impacto nas Funcionalidades Existentes

- **Zero quebras**: As alterações são retrocompatíveis
- O campo `excerpt` é opcional (`excerpt?: string`), então chamadas antigas continuam funcionando
- O `upsert` funciona tanto para criar quanto para atualizar registros
- Nenhum fluxo existente é alterado, apenas corrigido
