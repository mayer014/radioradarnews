import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Simple rate limiter to prevent abuse
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const requests = rateLimiter.get(identifier) || [];
  
  // Clean old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS) {
    const oldestRequest = Math.min(...validRequests);
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  validRequests.push(now);
  rateLimiter.set(identifier, validRequests);
  
  // Cleanup old entries periodically
  if (rateLimiter.size > 1000) {
    for (const [key, times] of rateLimiter.entries()) {
      if (times.every(t => now - t > RATE_LIMIT_WINDOW)) {
        rateLimiter.delete(key);
      }
    }
  }
  
  return { allowed: true };
}

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

// Modelos Groq permitidos
const ALLOWED_GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

// ==== CENTRALIZAÇÃO DE API KEY ====
// Busca a API key diretamente do banco de dados (tabela ai_configurations)
// Isso permite gerenciamento 100% pelo Painel Admin, sem depender de secrets
async function getGroqApiKeyFromDatabase(supabaseClient: any): Promise<string | null> {
  try {
    // Buscar configuração do Groq na tabela ai_configurations
    const { data, error } = await supabaseClient
      .from('ai_configurations')
      .select('api_key_encrypted, config_json')
      .eq('provider_name', 'groq')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar API key do banco:', error);
      return null;
    }

    if (data?.api_key_encrypted) {
      console.log('✅ API key Groq carregada do banco de dados (Painel Admin)');
      return data.api_key_encrypted;
    }

    return null;
  } catch (error) {
    console.warn('Exception ao buscar API key do banco:', error);
    return null;
  }
}

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
    if (promptValue && typeof promptValue === 'string' && promptValue.length > 0) {
      console.log(`✅ Using custom system prompt from database (${promptValue.length} chars)`);
      return promptValue;
    }

    console.warn('⚠️ No custom prompt found in database, using fallback');
    return FALLBACK_SYSTEM_PROMPT;
  } catch (error) {
    console.warn('Exception fetching system prompt from database, using fallback:', error);
    return FALLBACK_SYSTEM_PROMPT;
  }
}

// Função para buscar modelo preferido do banco
async function getPreferredGroqModel(supabaseClient: any): Promise<string> {
  try {
    const { data } = await supabaseClient
      .from('settings')
      .select('value')
      .eq('category', 'ai')
      .eq('key', 'groq_preferred_model')
      .maybeSingle();
      
    const model = data?.value?.model as string | undefined;
    if (model && ALLOWED_GROQ_MODELS.includes(model)) {
      return model;
    }
  } catch (error) {
    console.warn('Error fetching preferred Groq model:', error);
  }
  return 'llama-3.1-8b-instant'; // Default Groq model
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `REQ_${Date.now()}`;
  console.log(`🔵 [${requestId}] ==================== AI Rewriter Service called at ${new Date().toISOString()} ====================`);

  try {
    // SECURITY: Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIp);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ [${requestId}] Rate limit exceeded for ${clientIp}`);
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
        retryAfter: rateLimitCheck.retryAfter
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': rateLimitCheck.retryAfter!.toString()
        }
      });
    }

    // Get Supabase client
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`❌ [${requestId}] Supabase configuration missing`);
      throw new Error('Supabase configuration missing');
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ==== BUSCA CENTRALIZADA DA API KEY ====
    // PRIORIDADE 1: Buscar do banco de dados (Painel Admin → Configurações)
    let GROQ_API_KEY = await getGroqApiKeyFromDatabase(supabase);
    
    // PRIORIDADE 2: Fallback para env var (compatibilidade)
    if (!GROQ_API_KEY) {
      GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || null;
      if (GROQ_API_KEY) {
        console.log(`⚠️ [${requestId}] Usando GROQ_API_KEY de env vars (configure no Painel Admin para autonomia total)`);
      }
    }
    
    console.log(`🔑 [${requestId}] API Key status:`, {
      source: GROQ_API_KEY ? 'database/env' : 'NONE',
      provider: GROQ_API_KEY ? 'GROQ (LLM externa - sem consumir créditos Lovable)' : 'NONE'
    });

    if (!GROQ_API_KEY) {
      console.error(`❌ [${requestId}] Nenhuma API key Groq configurada. Configure no Painel Admin → Configurações.`);
      return new Response(
        JSON.stringify({ 
          error: 'LLM externa não configurada',
          message: 'Configure sua chave API Groq no Painel Admin → Configurações → IA.',
          details: 'Este sistema utiliza exclusivamente LLM externa configurada pelo usuário. Acesse Painel Admin → Configurações para adicionar sua chave Groq.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let SYSTEM_PROMPT = FALLBACK_SYSTEM_PROMPT;
    let selectedModel = 'llama-3.1-8b-instant';
    
    // Fetch custom prompt and model
    console.log(`📚 [${requestId}] Fetching custom system prompt from database...`);
    SYSTEM_PROMPT = await getSystemPrompt(supabase);
    console.log(`✅ [${requestId}] System prompt loaded - Length: ${SYSTEM_PROMPT.length} chars`);
    
    selectedModel = await getPreferredGroqModel(supabase);
    console.log(`🎯 [${requestId}] Using Groq model: ${selectedModel}`);

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

    let response: Response;
    const providerUsed = 'Groq';

    // Usar EXCLUSIVAMENTE Groq API (LLM externa do usuário)
    console.log(`🚀 [${requestId}] Calling Groq API with model: ${selectedModel} (LLM externa - SEM consumir créditos Lovable)`);
    
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] Groq API error:`, response.status, errorText);
      
      // NÃO fazer fallback para Lovable AI - registrar erro claro
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requisições Groq excedido',
            message: 'Aguarde alguns minutos e tente novamente.',
            details: 'A API da Groq está temporariamente indisponível devido a limite de requisições.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'GROQ_API_KEY inválida',
            message: 'Verifique se sua chave API da Groq está correta no Painel Admin → Configurações.',
            details: 'A chave API configurada foi rejeitada pela Groq.'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;
    console.log(`✅ [${requestId}] Groq response received - Content length: ${aiContent?.length || 0} chars`);
    
    if (!aiContent) {
      console.error(`❌ [${requestId}] No content returned from Groq`);
      throw new Error('No content returned from Groq');
    }

    console.log(`📊 [${requestId}] Parsing AI JSON response...`);

    // Parse AI response
    const rewrittenContent = parseAIResponse(aiContent, url, title);
    console.log(`✅ [${requestId}] Content successfully rewritten using Groq (LLM externa)`);
    console.log(`📤 [${requestId}] Result - Title: "${rewrittenContent.title}"`);
    console.log(`📤 [${requestId}] Result - Content length: ${rewrittenContent.content_html.length} chars`);

    return new Response(JSON.stringify({
      ...rewrittenContent,
      _meta: {
        provider: 'Groq',
        model: selectedModel,
        timestamp: new Date().toISOString(),
        note: 'Gerado usando LLM externa configurada pelo usuário (sem consumir créditos Lovable)'
      }
    }), {
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
    .substring(0, 8000);
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
