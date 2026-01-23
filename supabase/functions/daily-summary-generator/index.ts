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

    // PRIORIDADE: GROQ_API_KEY (LLM externa do usuário)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    
    console.log(`🔑 [${requestId}] API Keys status:`, {
      groqConfigured: !!GROQ_API_KEY,
      provider: GROQ_API_KEY ? 'GROQ (sem consumir créditos Lovable)' : 'NONE'
    });

    if (!GROQ_API_KEY) {
      console.error(`❌ [${requestId}] GROQ_API_KEY não configurada. Configure no Painel Admin → Configurações.`);
      return new Response(
        JSON.stringify({ 
          error: 'LLM externa não configurada',
          message: 'Configure GROQ_API_KEY no Supabase Secrets para usar esta funcionalidade.',
          details: 'Nenhuma LLM externa está configurada. Configure sua chave API no Painel Admin → Configurações.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar modelo preferido do banco
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let selectedModel = 'llama-3.1-8b-instant';
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        selectedModel = await getPreferredGroqModel(supabase);
      } catch (configError) {
        console.warn('Could not load Groq model preference, using default:', configError);
      }
    }

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

    // Usar exclusivamente Groq API
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
        max_tokens: 4096
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] Groq API error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições da Groq excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da Groq');
    }

    console.log(`✅ [${requestId}] Resposta da Groq recebida - Length: ${content.length} chars`);

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
