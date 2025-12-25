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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles } = await req.json() as { articles: ArticleInput[] };

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum artigo fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log(`[daily-summary] Gerando resumos para ${articles.length} artigos`);

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[daily-summary] Erro da API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos à sua conta Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('[daily-summary] Resposta da IA:', content.substring(0, 200));

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
      console.error('[daily-summary] Erro ao parsear resposta:', parseError);
      
      // Fallback: criar resumos simples se a IA falhar
      summaries = articles.map(a => ({
        title: a.title,
        category: a.category,
        summary: a.excerpt || 'Confira mais detalhes em nosso portal.'
      }));
    }

    console.log(`[daily-summary] ${summaries.length} resumos gerados com sucesso`);

    return new Response(
      JSON.stringify({ summaries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[daily-summary] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
