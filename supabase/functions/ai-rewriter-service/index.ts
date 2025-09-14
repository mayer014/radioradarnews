import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RewriteRequest {
  title: string;
  content: string;
  url: string;
}

interface RewrittenContent {
  title: string;
  slug: string;
  lead: string;
  content_html: string;
  excerpt: string;
  category_suggestion: string;
  tags: string[];
  image_prompt: string;
  source_url: string;
  source_domain: string;
  published_at_suggestion: string;
}

const SYSTEM_PROMPT = `
Você é uma assistente editorial especializada em reescrever notícias de forma profissional e ética.

TAREFA: Transforme o conteúdo fornecido em um RESUMO JORNALÍSTICO claro, coeso e atrativo, sem copiar trechos literais.

Diretrizes (internas — não reproduzir no resultado):
1. Produzir entre 3 e 6 parágrafos mantendo fatos, contexto e relevância.
2. Linguagem jornalística objetiva, apropriada para portal de notícias moderno.
3. Não inventar informações; evitar frases idênticas ao texto de origem (SEO).
4. Ao final do texto, incluir: "Fonte: [NOME DO SITE] – Leia a matéria completa em: [LINK DA MATÉRIA ORIGINAL]".

Saída:
- Retorne APENAS um JSON válido com a estrutura abaixo.
- O campo content_html deve conter SOMENTE o texto jornalístico final em HTML (parágrafos, negritos/ênfases quando necessário) seguido da nota de crédito. Não inclua instruções, exemplos, disclaimers ou notas explicativas em nenhum campo.

{
  "title": "Título SEO-friendly (máx 60 chars)",
  "slug": "titulo-em-kebab-case",
  "lead": "Lead de 2-3 frases resumindo a notícia",
  "content_html": "Resumo em 3-6 parágrafos com tags HTML (p, strong, em) + nota de crédito final",
  "excerpt": "Resumo até 160 caracteres",
  "category_suggestion": "Política|Economia|Esportes|Cultura|Segurança Pública|Opinião",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "Descrição objetiva para imagem de capa (PT-BR)",
  "source_url": "URL_ORIGINAL",
  "source_domain": "dominio.com",
  "published_at_suggestion": "2024-01-01T12:00:00Z"
}
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured in secrets');
    }

    const { title, content, url }: RewriteRequest = await req.json();

    if (!title || !content || !url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, content, url' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userPrompt = `
TAREFA: Reescreva o conteúdo abaixo em formato jornalístico, retornando APENAS o JSON conforme instruções do sistema.

CONTEÚDO ORIGINAL:
Título: ${title}
Fonte: ${url}
Conteúdo: ${cleanTextContent(content)}
`;

    console.log('Calling Groq API for content rewriting...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content returned from Groq API');
    }

    console.log('Successfully got response from Groq API');

    // Parse AI response
    const rewrittenContent = parseAIResponse(aiContent, url);

    return new Response(JSON.stringify(rewrittenContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-rewriter-service:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to rewrite content using AI service'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function cleanTextContent(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<!--.*?-->/gs, '')
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 8000); // Limit content length for API
}

function parseAIResponse(content: string, sourceUrl: string): RewrittenContent {
  try {
    const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    return {
      title: parsed.title || 'Título não disponível',
      slug: parsed.slug || 'titulo-nao-disponivel',
      lead: parsed.lead || 'Lead não disponível',
      content_html: parsed.content_html || '<p>Conteúdo não disponível</p>',
      excerpt: parsed.excerpt || 'Resumo não disponível',
      category_suggestion: parsed.category_suggestion || 'Notícias',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      image_prompt: parsed.image_prompt || 'Imagem ilustrativa',
      source_url: parsed.source_url || sourceUrl,
      source_domain: parsed.source_domain || getDomainFromUrl(sourceUrl),
      published_at_suggestion: parsed.published_at_suggestion || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback response
    const domain = getDomainFromUrl(sourceUrl);
    return {
      title: 'Conteúdo reescrito automaticamente',
      slug: 'conteudo-reescrito-automaticamente',
      lead: 'Artigo processado automaticamente devido a erro na análise de IA.',
      content_html: `<p>O conteúdo foi processado mas houve erro na formatação da resposta da IA.</p><p>Fonte: ${domain} – Leia a matéria completa em: ${sourceUrl}</p>`,
      excerpt: 'Artigo processado automaticamente.',
      category_suggestion: 'Notícias',
      tags: ['reescrita', 'automatico'],
      image_prompt: 'Imagem ilustrativa para artigo',
      source_url: sourceUrl,
      source_domain: domain,
      published_at_suggestion: new Date().toISOString()
    };
  }
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'fonte-desconhecida';
  }
}