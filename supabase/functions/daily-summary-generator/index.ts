import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleInput {
  title: string;
  category: string;
  excerpt: string;
  content: string;
}

interface ArticleSummary {
  title: string;
  category: string;
  summary: string;
}

// Modelos Groq permitidos
const ALLOWED_GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

// Tabela de custos por modelo Groq (USD por 1M tokens)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.2-1b-preview': { input: 0.04, output: 0.04 },
  'llama-3.2-3b-preview': { input: 0.06, output: 0.06 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  'gemma2-9b-it': { input: 0.20, output: 0.20 },
};

// Calcula custo estimado em USD
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['llama-3.1-8b-instant'];
  return (inputTokens * costs.input / 1000000) + (outputTokens * costs.output / 1000000);
}

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
    if (model && ALLOWED_GROQ_MODELS.includes(model)) {
      return model;
    }
  } catch (error) {
    console.warn('Error fetching preferred Groq model:', error);
  }
  return 'llama-3.1-8b-instant'; // Default Groq model
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `SUMMARY_${Date.now()}`;
  console.log(`🔵 [${requestId}] Daily Summary Generator called at ${new Date().toISOString()}`);

  try {
    const { articles } = await req.json() as { articles: ArticleInput[] };

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum artigo fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      provider: GROQ_API_KEY ? 'GROQ (sem consumir créditos Lovable)' : 'NONE'
    });

    if (!GROQ_API_KEY) {
      console.error(`❌ [${requestId}] Nenhuma API key Groq configurada. Configure no Painel Admin → Configurações.`);
      return new Response(
        JSON.stringify({ 
          error: 'LLM externa não configurada',
          message: 'Configure sua chave API Groq no Painel Admin → Configurações → IA.',
          details: 'Nenhuma API key foi encontrada. Acesse Painel Admin → Configurações para adicionar sua chave Groq.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar modelo preferido
    const selectedModel = await getPreferredGroqModel(supabase);
    console.log(`🎯 [${requestId}] Using Groq model: ${selectedModel}`);
    console.log(`📰 [${requestId}] Gerando resumos para ${articles.length} artigos usando GROQ (sem consumir créditos Lovable)`);

    // Preparar prompt para a IA
    const articlesText = articles.map((a, i) => 
      `${i + 1}. [${a.category}] ${a.title}\nResumo original: ${a.excerpt}\nConteúdo: ${a.content}`
    ).join('\n\n');

    const systemPrompt = `Você é um redator de rádio experiente. Sua função é criar resumos curtos e objetivos de notícias para leitura ao vivo.

REGRAS:
- Cada resumo deve ter 2 a 3 linhas no máximo
- Use linguagem jornalística clara e direta
- O texto deve fluir naturalmente para leitura em voz alta
- Evite siglas desconhecidas sem explicação
- Não use jargões técnicos complexos
- Comece cada resumo de forma diferente para variar a leitura
- Mantenha a objetividade e a informação essencial

FORMATO DE RESPOSTA (JSON):
{
  "summaries": [
    {
      "title": "Título original da matéria",
      "category": "Categoria da matéria",
      "summary": "Resumo de 2-3 linhas para leitura em rádio"
    }
  ]
}`;

    const userPrompt = `Crie resumos para leitura em rádio das seguintes matérias publicadas hoje:\n\n${articlesText}`;

    // Usar exclusivamente Groq API com retry automático para rate limits
    const maxRetries = 3;
    let lastError: Error | null = null;
    let response: Response | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 [${requestId}] Tentativa ${attempt}/${maxRetries}...`);
      
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        }),
      });

      if (response.ok) {
        break; // Sucesso, sair do loop
      }

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || '';
        
        // Extrair tempo de espera sugerido da mensagem de erro
        const waitMatch = errorMessage.match(/try again in (\d+\.?\d*)s/i);
        const waitTime = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) : (attempt * 10000);
        
        console.warn(`⚠️ [${requestId}] Rate limit atingido. Aguardando ${waitTime/1000}s antes de tentar novamente...`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Última tentativa falhou
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requisições da Groq excedido.',
            message: 'O limite de tokens por minuto foi atingido. Aguarde alguns segundos e tente novamente.',
            retryAfter: Math.ceil(waitTime / 1000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(waitTime / 1000)) } }
        );
      }

      // Outros erros
      const errorText = await response.text();
      console.error(`❌ [${requestId}] Groq API error:`, response.status, errorText);
      lastError = new Error(`Groq API error: ${response.status} - ${errorText}`);
      break;
    }

    if (!response || !response.ok) {
      throw lastError || new Error('Falha na comunicação com Groq API');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    if (!content) {
      throw new Error('Resposta vazia da Groq');
    }

    console.log(`✅ [${requestId}] Resposta da Groq recebida - Length: ${content.length} chars`);
    console.log(`📊 [${requestId}] Token usage:`, usage);

    // Log usage to database
    try {
      const costUsd = calculateCost(usage.prompt_tokens, usage.completion_tokens, selectedModel);
      await supabase.from('llm_usage_logs').insert({
        provider: 'groq',
        model: selectedModel,
        function_name: 'daily-summary-generator',
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: costUsd,
        request_id: requestId,
        metadata: { articles_count: articles.length }
      });
      console.log(`💾 [${requestId}] Usage logged to database`);
    } catch (logError) {
      console.warn(`⚠️ [${requestId}] Failed to log usage:`, logError);
    }

    // Extrair JSON da resposta
    let summaries: ArticleSummary[] = [];
    try {
      // Tentar extrair JSON do conteúdo
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summaries = parsed.summaries || [];
      }
    } catch (parseError) {
      console.error(`⚠️ [${requestId}] Erro ao parsear resposta:`, parseError);
      
      // Fallback: criar resumos simples se a IA falhar no parse
      summaries = articles.map(a => ({
        title: a.title,
        category: a.category,
        summary: a.excerpt || 'Confira mais detalhes em nosso portal.'
      }));
    }

    console.log(`✅ [${requestId}] ${summaries.length} resumos gerados com sucesso usando Groq (sem créditos Lovable)`);

    return new Response(
      JSON.stringify({ 
        summaries,
        _meta: {
          provider: 'Groq',
          model: selectedModel,
          usage: usage,
          timestamp: new Date().toISOString(),
          note: 'Gerado usando LLM externa configurada pelo usuário (sem consumir créditos Lovable)'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Erro:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
