import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: Simple rate limiter to prevent abuse
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute per IP (more restrictive for AI generation)

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

interface ArticleGenerationRequest {
  idea: string;
  category: string;
  tone?: 'formal' | 'informal' | 'investigativo' | 'opinativo';
  length?: 'curto' | 'medio' | 'longo';
}

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  suggestedCategory: string;
  keywords: string[];
}

const JOURNALISM_SYSTEM_PROMPT = `
Você é um jornalista profissional. Gere conteúdo:
- Título novo e técnico (não copie a ideia do usuário)
- Frases diretas, sem enrolação
- Sempre que possível cite ferramentas, versões, preços, empresas reais
- Estruture com <h2>, <h3>, listas e parágrafos curtos
- Não invente instituições fictícias (ex.: IBPA, Observatório de Tendências)
- Se não tiver dado, seja neutro (não invente números)
- Português do Brasil, estilo jornalístico
Retorne SEMPRE um JSON válido conforme solicitado.
`;

// ==== CENTRALIZAÇÃO DE API KEY ====
// Busca a API key diretamente do banco de dados (tabela ai_configurations)
async function getGroqApiKeyFromDatabase(supabaseClient: any): Promise<string | null> {
  try {
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
    if (model && typeof model === 'string') {
      return model;
    }
  } catch (error) {
    console.warn('Error fetching preferred Groq model:', error);
  }
  return 'llama-3.1-8b-instant';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `ARTGEN_${Date.now()}`;
  console.log(`🔵 [${requestId}] AI Article Generator called at ${new Date().toISOString()}`);

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
      throw new Error('Supabase configuration missing');
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // PRIORIDADE 1: Buscar API key do banco de dados (Painel Admin)
    let groqApiKey = await getGroqApiKeyFromDatabase(supabase);
    
    // PRIORIDADE 2: Fallback para env var (compatibilidade)
    if (!groqApiKey) {
      groqApiKey = Deno.env.get('GROQ_API_KEY') || null;
      if (groqApiKey) {
        console.log(`⚠️ [${requestId}] Usando GROQ_API_KEY de env vars (configure no Painel Admin para autonomia total)`);
      }
    }

    if (!groqApiKey) {
      console.error(`❌ [${requestId}] Nenhuma API key Groq configurada`);
      return new Response(
        JSON.stringify({ 
          error: 'LLM externa não configurada',
          message: 'Configure sua chave API Groq no Painel Admin → Configurações.',
          details: 'Nenhuma API key foi encontrada. Acesse Painel Admin → Configurações → IA para adicionar sua chave Groq.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar modelo preferido
    const selectedModel = await getPreferredGroqModel(supabase);
    console.log(`🎯 [${requestId}] Using Groq model: ${selectedModel}`);

    const request: ArticleGenerationRequest = await req.json();

    if (!request.idea || !request.category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: idea, category' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = buildPrompt(request);

    console.log('Calling Groq API for article generation...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: JOURNALISM_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3200
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
    const generatedArticle = parseGeneratedContent(aiContent, request);

    return new Response(JSON.stringify(generatedArticle), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-article-generator-service:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to generate article using AI service'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildPrompt(request: ArticleGenerationRequest): string {
  const toneMap = {
    'formal': 'linguagem técnica e precisa',
    'informal': 'linguagem acessível mas informativa',
    'investigativo': 'análise detalhada com dados concretos',
    'opinativo': 'posicionamento fundamentado com fatos'
  };

  const lengthMap = {
    'curto': '800-1200 palavras',
    'medio': '1200-2000 palavras',
    'longo': '2000-3000 palavras'
  };

  return `
Você é um jornalista especializado que deve criar um artigo TÉCNICO e ESPECÍFICO baseado na ideia: "${request.idea}"

ATENÇÃO: A ideia "${request.idea}" é apenas o PONTO DE PARTIDA. Você deve:
1. REESCREVER COMPLETAMENTE O TÍTULO com informações específicas e técnicas
2. TRANSFORMAR a ideia genérica em conteúdo específico com nomes reais
3. CRIAR um título jornalístico profissional diferente da ideia original

INSTRUÇÕES CRÍTICAS:
- NUNCA use o título da ideia original - crie um título técnico novo
- SEJA EXTREMAMENTE ESPECÍFICO: Cite nomes reais de ferramentas, empresas, versões, preços
- EVITE GENERALIDADES: Nada de "especialistas afirmam" ou "dados mostram"
- INFORMAÇÕES PRÁTICAS: Foque no que é útil, verificável e aplicável
- ESTRUTURA JORNALÍSTICA: Use subtítulos (H2, H3) para organizar

Especificações:
- Categoria: ${request.category}
- Abordagem: ${toneMap[request.tone || 'formal']}
- Extensão: ${lengthMap[request.length || 'medio']}

ESTRUTURA OBRIGATÓRIA DO ARTIGO:
1. **Título Técnico**: Completamente diferente da ideia original (máximo 60 caracteres)
2. **Lead**: 2-3 frases com informação específica e prática
3. **Introdução**: Contexto atual com dados concretos
4. **Desenvolvimento com subtítulos**:
   - Ferramentas/métodos específicos (nomes, versões, preços)
   - Comparações práticas entre opções
   - Tutoriais ou passos específicos
   - Vantagens e limitações de cada opção
5. **Conclusão**: Recomendações práticas específicas

CONTEÚDO DEVE INCLUIR:
- Nomes específicos de softwares, plataformas, ferramentas
- Versões atuais (2024/2025) quando relevante
- Preços aproximados ou faixas de valor
- Requisitos técnicos específicos
- Casos de uso práticos e reais

PROIBIDO:
❌ Usar o título da ideia original
❌ "Especialistas debatem"
❌ "Dados mostram tendência"  
❌ "Mercado em transformação"
❌ Análises genéricas sem especificidade

Retorne JSON válido:
{
  "title": "Título técnico COMPLETAMENTE NOVO e específico",
  "excerpt": "Lead direto com informação técnica específica",
  "content": "Artigo completo em HTML com <h2>, <h3>, <p>, <strong>, <ul>, <li>",
  "suggestedCategory": "${request.category}",
  "keywords": ["ferramenta-específica", "versão-atual", "categoria-técnica"]
}

OBJETIVO: Criar título e conteúdo TÉCNICO, ESPECÍFICO e ÚTIL, completamente diferente da ideia original.
`;
}

function parseGeneratedContent(content: string, request: ArticleGenerationRequest): GeneratedArticle {
  try {
    const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    let title: string = parsed.title || 'Título Gerado pela IA';
    
    // Garantir que o título NÃO copie a ideia original
    const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const ideaN = normalize(request.idea);
    const titleN = normalize(title);
    
    if (!title || titleN === ideaN || ideaN.includes(titleN) || titleN.includes(ideaN)) {
      title = rewriteTitleFromIdea(request.idea);
    }

    return {
      title,
      excerpt: parsed.excerpt || 'Resumo gerado pela IA',
      content: parsed.content || '<p>Conteúdo gerado pela IA</p>',
      suggestedCategory: parsed.suggestedCategory || request.category,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback response
    return {
      title: rewriteTitleFromIdea(request.idea),
      excerpt: 'Artigo gerado automaticamente com base na ideia fornecida.',
      content: '<p>Conteúdo processado automaticamente devido a erro na análise de IA.</p>',
      suggestedCategory: request.category,
      keywords: ['automatico', 'gerado']
    };
  }
}

function rewriteTitleFromIdea(idea: string): string {
  const lower = idea.toLowerCase();
  
  if (/game|games|jogo|jogos/.test(lower)) {
    return 'Unity, Unreal e Godot: guia 2025 para criar jogos';
  }
  
  if (/marketing|digital/.test(lower)) {
    return 'Google Ads vs Meta Ads: análise de ROI para 2025';
  }
  
  if (/programação|desenvolvimento/.test(lower)) {
    return 'Python vs JavaScript: qual linguagem escolher em 2025';
  }
  
  // Regra simples: extrair palavras-chave e criar um rótulo técnico
  const keywords = idea
    .replace(/[:\-–—]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
    .join(' ');
  
  return `Panorama técnico 2025: ${keywords}`;
}