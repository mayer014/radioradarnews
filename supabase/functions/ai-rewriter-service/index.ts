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

// Fallback prompt caso não consiga buscar do banco
const FALLBACK_SYSTEM_PROMPT = `
Você é um assistente especializado em reescrita jornalística.  
Sua tarefa é pegar uma notícia extraída e entregar um resumo curto, objetivo e atrativo para leitura, seguindo as regras abaixo:

1. **Tamanho**: entre 3 e 5 parágrafos no máximo.  
2. **Clareza**: escreva em linguagem jornalística simples, fluida e sem repetições.  
3. **Formatação HTML OBRIGATÓRIA**:  
   - Cada parágrafo deve estar em uma tag <p> com espaçamento: <p style="margin-bottom: 1.5rem;">
   - NUNCA use texto corrido sem tags <p>
   - Exemplo correto:
     <p style="margin-bottom: 1.5rem;">Primeiro parágrafo aqui.</p>
     <p style="margin-bottom: 1.5rem;">Segundo parágrafo aqui.</p>
     <p style="margin-bottom: 1.5rem;">Terceiro parágrafo aqui.</p>
4. **Resumo**: destaque os pontos principais da matéria sem perder o sentido central.  
5. **Fonte obrigatória no final**:  
   - Adicione no último parágrafo a frase formatada como HTML:
   
   <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
     <p style="font-style: italic; color: #6b7280; font-size: 0.9rem;">
       <strong>Fonte:</strong> 
       <a href="[URL_ORIGINAL]" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">
         [DOMINIO_FONTE] — Leia a matéria completa clicando aqui
       </a>
     </p>
   </div>

6. **Estilo**: objetivo, direto, mas mantendo impacto para prender a atenção do leitor.

⚠️ Importante: não copie trechos literais, sempre reescreva em outras palavras para evitar problemas de direitos autorais.

Formato de resposta (JSON válido):
{
  "title": "Título reescrito e atrativo",
  "slug": "titulo-em-slug-format", 
  "lead": "Lead/subtítulo da matéria (1-2 frases)",
  "content_html": "Conteúdo HTML com parágrafos <p style='margin-bottom: 1.5rem;'> bem espaçados + seção de fonte no final",
  "excerpt": "Resumo de 2-3 linhas para prévia",
  "category_suggestion": "Categoria sugerida",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "Descrição para gerar imagem ilustrativa",
  "source_url": "URL da fonte original",
  "source_domain": "Domínio da fonte",
  "published_at_suggestion": "Data/hora sugerida em ISO"
}

CRÍTICO: TODOS os parágrafos devem ter <p style="margin-bottom: 1.5rem;"> para espaçamento adequado. Retorne APENAS o JSON válido.
`;

// Função para buscar o prompt customizado do banco
async function getSystemPrompt(supabaseClient: any): Promise<string> {
  try {
    const { data, error } = await supabaseClient
      .from('settings')
      .select('value')
      .eq('category', 'ai')
      .eq('key', 'rewriter_system_prompt')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching system prompt from database, using fallback:', error);
      return FALLBACK_SYSTEM_PROMPT;
    }

    const promptValue = data?.value?.prompt;
    if (promptValue && typeof promptValue === 'string') {
      console.log('Using custom system prompt from database (length:', promptValue.length, 'chars)');
      return promptValue;
    }

    console.warn('No custom prompt found in database, using fallback');
    return FALLBACK_SYSTEM_PROMPT;
  } catch (error) {
    console.warn('Exception fetching system prompt from database, using fallback:', error);
    return FALLBACK_SYSTEM_PROMPT;
  }
}

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

    // Get preferred model from configuration
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let selectedModel = 'llama-3.1-8b-instant'; // Default
    let SYSTEM_PROMPT = FALLBACK_SYSTEM_PROMPT; // Start with fallback
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Fetch custom prompt from database
        SYSTEM_PROMPT = await getSystemPrompt(supabase);
        
        // Fetch preferred model
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('category', 'ai')
          .eq('key', 'groq_preferred_model')
          .maybeSingle();
          
        if (data?.value?.model) {
          selectedModel = data.value.model;
          console.log(`Using preferred Groq model: ${selectedModel}`);
        }
      } catch (configError) {
        console.warn('Could not load configurations from database, using defaults:', configError);
      }
    } else {
      console.warn('Supabase environment not configured, using default prompt and model');
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
        model: selectedModel,
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
        error: error instanceof Error ? error.message : 'Internal server error',
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