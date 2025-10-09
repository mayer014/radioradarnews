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

⚠️ IMPORTANTE: O TÍTULO DEVE SER COMPLETAMENTE REESCRITO - nunca use o título original igual, pois isso viola direitos autorais e prejudica o SEO no Google.

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
    // Force fresh fetch - no caching
    const timestamp = new Date().getTime();
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
    if (promptValue && typeof promptValue === 'string' && promptValue.length > 0) {
      console.log(`✅ Using custom system prompt from database (${promptValue.length} chars) - fetched at ${new Date().toISOString()}`);
      return promptValue;
    }

    console.warn('⚠️ No custom prompt found in database, using fallback');
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

  const requestId = `REQ_${Date.now()}`;
  console.log(`🔵 [${requestId}] ==================== AI Rewriter Service called at ${new Date().toISOString()} ====================`);

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    console.log(`🔑 [${requestId}] LOVABLE_API_KEY configured:`, !!LOVABLE_API_KEY);
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured in secrets');
    }

    // Get preferred model from configuration
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log(`🔧 [${requestId}] Supabase credentials found:`, { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY });
    
    let selectedModel = 'google/gemini-2.5-flash'; // Default (Gemini 2.5 Flash)
    let SYSTEM_PROMPT = FALLBACK_SYSTEM_PROMPT; // Start with fallback
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Fetch custom prompt from database
        console.log(`📚 [${requestId}] Fetching custom system prompt from database...`);
        SYSTEM_PROMPT = await getSystemPrompt(supabase);
        console.log(`✅ [${requestId}] System prompt loaded - Length: ${SYSTEM_PROMPT.length} chars`);
        console.log(`📝 [${requestId}] First 200 chars of prompt:`, SYSTEM_PROMPT.substring(0, 200));
        
        // Fetch preferred model (optional)
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('category', 'ai')
          .in('key', ['ai_gateway_preferred_model','groq_preferred_model'])
          .maybeSingle();
          
        const preferred = data?.value?.model as string | undefined;
        const allowed = [
          'google/gemini-2.5-pro',
          'google/gemini-2.5-flash',
          'google/gemini-2.5-flash-lite',
          'openai/gpt-5',
          'openai/gpt-5-mini',
          'openai/gpt-5-nano'
        ];
        if (preferred && allowed.includes(preferred)) {
          selectedModel = preferred;
          console.log(`Using preferred AI gateway model: ${selectedModel}`);
        } else if (preferred) {
          console.log(`Ignoring unsupported preferred model from DB: ${preferred}`);
        }
      } catch (configError) {
        console.warn('Could not load configurations from database, using defaults:', configError);
      }
    } else {
      console.warn('Supabase environment not configured, using default prompt and model');
    }

    const { title, content, url }: RewriteRequest = await req.json();
    console.log(`📥 [${requestId}] Request received:`, { 
      titleLength: title?.length, 
      contentLength: content?.length, 
      url: url?.substring(0, 50) + '...' 
    });

    if (!title || !content || !url) {
      console.error(`❌ [${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, content, url' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const cleanedContent = cleanTextContent(content);
    console.log(`🧹 [${requestId}] Content cleaned - Original: ${content.length} chars, Cleaned: ${cleanedContent.length} chars`);

    const userPrompt = `
TAREFA: Reescreva o conteúdo abaixo em formato jornalístico, retornando APENAS o JSON conforme instruções do sistema.

CONTEÚDO ORIGINAL:
Título: ${title}
Fonte: ${url}
Conteúdo: ${cleanedContent}
`;

    console.log(`🤖 [${requestId}] Calling Lovable AI Gateway with model: ${selectedModel}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] AI Gateway error:`, response.status, errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded (429). Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required (402). Please add credits to Lovable AI.');
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;
    console.log(`✅ [${requestId}] Groq API response received - Content length: ${aiContent?.length || 0} chars`);
    console.log(`🔍 [${requestId}] AI Response preview (first 300 chars):`, aiContent?.substring(0, 300));
    
    if (!aiContent) {
      console.error(`❌ [${requestId}] No content returned from Groq API`);
      throw new Error('No content returned from Groq API');
    }

    console.log(`📊 [${requestId}] Parsing AI JSON response...`);

    // Parse AI response
    const rewrittenContent = parseAIResponse(aiContent, url, title);
    console.log(`✅ [${requestId}] Content successfully rewritten and parsed`);
    console.log(`📤 [${requestId}] Result - Title: "${rewrittenContent.title}"`);
    console.log(`📤 [${requestId}] Result - Content length: ${rewrittenContent.content_html.length} chars`);
    console.log(`📤 [${requestId}] Result - Has ${(rewrittenContent.content_html.match(/<p/g) || []).length} paragraphs`);

    return new Response(JSON.stringify(rewrittenContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorId = `ERR_${Date.now()}`;
    console.error(`❌ [${errorId}] Error in ai-rewriter-service:`, error);
    console.error(`❌ [${errorId}] Error stack:`, error instanceof Error ? error.stack : 'No stack available');
    
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

function parseAIResponse(content: string, sourceUrl: string, originalTitle: string): RewrittenContent {
  try {
    const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    const titleCandidate: string = parsed.title || parsed.titulo || 'Título não disponível';
    const contentHtml: string = parsed.content_html || parsed.content || parsed.html || '<p>Conteúdo não disponível</p>';
    const category: string = parsed.category_suggestion || parsed.category || 'Notícias';
    const imagePrompt: string = parsed.image_prompt || parsed.imagePrompt || 'Imagem ilustrativa';
    const srcUrl: string = parsed.source_url || parsed.sourceUrl || sourceUrl;
    const srcDomain: string = parsed.source_domain || parsed.sourceDomain || getDomainFromUrl(sourceUrl);

    let result: RewrittenContent = {
      title: titleCandidate,
      slug: (parsed.slug || titleCandidate).toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').substring(0, 60),
      lead: parsed.lead || parsed.subtitulo || parsed.linha_fina || 'Lead não disponível',
      content_html: contentHtml,
      excerpt: parsed.excerpt || parsed.resumo || 'Resumo não disponível',
      category_suggestion: category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      image_prompt: imagePrompt,
      source_url: srcUrl,
      source_domain: srcDomain,
      published_at_suggestion: parsed.published_at_suggestion || new Date().toISOString()
    };

    // Enforce at most 3 paragraphs if the model returned more
    const paragraphs = result.content_html.match(/<p[\s\S]*?<\/p>/gi);
    if (paragraphs && paragraphs.length > 3) {
      result.content_html = paragraphs.slice(0, 3).join('\n\n');
    }

    // Ensure title is different from the original
    if (originalTitle && result.title && result.title.trim().toLowerCase() === originalTitle.trim().toLowerCase()) {
      result.title = forceRewriteTitle(originalTitle);
      result.slug = result.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').substring(0, 60);
    }

    return result;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    const domain = getDomainFromUrl(sourceUrl);
    return {
      title: forceRewriteTitle(originalTitle || 'Conteúdo reescrito automaticamente'),
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

function forceRewriteTitle(original: string): string {
  try {
    let t = original || '';
    const replacements: Array<[RegExp, string]> = [
      [/\bsobe\b/gi, 'cresce'],
      [/\bcai\b/gi, 'recuo'],
      [/\binterrompendo\b/gi, 'após'],
      [/\bmeses seguidos\b/gi, 'sequência de meses'],
      [/\bsem crescimento\b/gi, 'sem avanço']
    ];
    replacements.forEach(([re, sub]) => t = t.replace(re, sub));
    if (t.trim().toLowerCase() === (original || '').trim().toLowerCase()) {
      t = t.replace(/:?\s*$/, '') + ' — entenda o caso';
    }
    // Cap at 100 chars
    if (t.length > 100) t = t.slice(0, 100).replace(/\s+\S*$/, '');
    return t;
  } catch {
    return (original || 'Artigo') + ' — entenda o caso';
  }
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'fonte-desconhecida';
  }
}