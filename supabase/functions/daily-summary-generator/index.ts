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

    // Processar TODOS os artigos em lotes automáticos (sem limite)
    const BATCH_SIZE = 15;
    const batches: ArticleInput[][] = [];
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      batches.push(articles.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 [${requestId}] Processando ${articles.length} artigos em ${batches.length} lote(s) de até ${BATCH_SIZE}`);

    const systemPrompt = `Você é um redator de rádio experiente. Crie resumos curtos e objetivos para leitura ao vivo.

REGRAS:
- Cada resumo: 2 a 3 linhas no máximo
- Linguagem jornalística clara e direta
- Texto fluido para leitura em voz alta
- Comece cada resumo de forma diferente
- Mantenha objetividade e informação essencial

FORMATO (JSON):
{"summaries":[{"title":"Título original","category":"Categoria","summary":"Resumo 2-3 linhas"}]}`;

    let allSummaries: ArticleSummary[] = [];
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      
      const articlesText = batch.map((a, i) => 
        `${i + 1}. [${a.category}] ${a.title}\nResumo: ${(a.excerpt || '').substring(0, 120)}`
      ).join('\n\n');

      const userPrompt = `Crie resumos para rádio:\n\n${articlesText}`;

      // Aguardar entre lotes para evitar rate limit
      if (batchIdx > 0) {
        const waitBetween = 5000;
        console.log(`⏳ [${requestId}] Aguardando ${waitBetween/1000}s antes do lote ${batchIdx + 1}...`);
        await new Promise(resolve => setTimeout(resolve, waitBetween));
      }

      let batchSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 [${requestId}] Lote ${batchIdx + 1}/${batches.length} - Tentativa ${attempt}/3`);
        
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
              max_tokens: 2048
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
            
            totalUsage.prompt_tokens += usage.prompt_tokens;
            totalUsage.completion_tokens += usage.completion_tokens;
            totalUsage.total_tokens += usage.total_tokens;

            if (content) {
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  allSummaries = allSummaries.concat(parsed.summaries || []);
                  batchSuccess = true;
                  console.log(`✅ [${requestId}] Lote ${batchIdx + 1} concluído: ${(parsed.summaries || []).length} resumos`);
                }
              } catch {
                console.warn(`⚠️ [${requestId}] Parse error lote ${batchIdx + 1}`);
              }
            }
            break;
          }

          // Rate limit ou request too large
          if (response.status === 429 || response.status === 413) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || '';
            const waitMatch = errorMessage.match(/try again in (\d+\.?\d*)s/i);
            const waitTime = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) : (attempt * 15000);
            
            console.warn(`⚠️ [${requestId}] Rate/size limit lote ${batchIdx + 1}. Aguardando ${waitTime/1000}s...`);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          } else {
            const errorText = await response.text();
            console.error(`❌ [${requestId}] Groq error lote ${batchIdx + 1}:`, response.status, errorText);
            break;
          }
        } catch (fetchError) {
          console.error(`❌ [${requestId}] Fetch error lote ${batchIdx + 1}:`, fetchError);
          break;
        }
      }

      // Fallback para lote que falhou
      if (!batchSuccess) {
        console.warn(`⚠️ [${requestId}] Lote ${batchIdx + 1} falhou, usando excerpts originais`);
        allSummaries = allSummaries.concat(batch.map(a => ({
          title: a.title, category: a.category,
          summary: a.excerpt || 'Confira mais detalhes em nosso portal.'
        })));
      }
    }

    const summaries = allSummaries;
    const usage = totalUsage;
    console.log(`✅ [${requestId}] Total: ${summaries.length} resumos em ${batches.length} lote(s)`);

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
