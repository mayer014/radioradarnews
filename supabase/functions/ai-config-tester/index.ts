import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  provider: 'groq' | 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
}

interface TestResponse {
  success: boolean;
  message: string;
  modelTested?: string;
  availableModels?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, apiKey, model }: TestRequest = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider e API key são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let testResult: TestResponse;

    switch (provider) {
      case 'groq':
        testResult = await testGroqAPI(apiKey, model);
        break;
      case 'openai':
        testResult = await testOpenAI(apiKey, model);
        break;
      case 'anthropic':
        testResult = await testAnthropic(apiKey, model);
        break;
      default:
        throw new Error('Provider não suportado');
    }

    return new Response(
      JSON.stringify(testResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no teste de API:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro interno no teste da API' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testGroqAPI(apiKey: string, selectedModel?: string): Promise<TestResponse> {
  const availableModels = [
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant', 
    'llama-3.2-1b-preview',
    'llama-3.2-3b-preview',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ];

  const modelToTest = selectedModel || 'llama-3.1-8b-instant';

  try {
    console.log(`Testando Groq API com modelo: ${modelToTest}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToTest,
        messages: [
          { role: 'system', content: 'Você é um assistente útil.' },
          { role: 'user', content: 'Responda apenas com "OK" para confirmar que está funcionando.' }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      
      let errorMessage = `Erro ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'Chave API inválida ou expirada';
      } else if (response.status === 400) {
        if (errorText.includes('model')) {
          errorMessage = `Modelo "${modelToTest}" não disponível. Tente outro modelo.`;
        } else {
          errorMessage = 'Parâmetros inválidos na requisição';
        }
      } else if (response.status === 429) {
        errorMessage = 'Limite de taxa excedido. Tente novamente em alguns segundos.';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do servidor Groq. Tente novamente mais tarde.';
      }

      return {
        success: false,
        message: errorMessage,
        availableModels
      };
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      return {
        success: false,
        message: 'Resposta inválida da API Groq',
        availableModels
      };
    }

    console.log('Groq API teste bem-sucedido');

    return {
      success: true,
      message: `API Groq testada com sucesso usando o modelo ${modelToTest}`,
      modelTested: modelToTest,
      availableModels
    };

  } catch (error) {
    console.error('Erro na chamada para Groq API:', error);
    return {
      success: false,
      message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      availableModels
    };
  }
}

async function testOpenAI(apiKey: string, selectedModel?: string): Promise<TestResponse> {
  const modelToTest = selectedModel || 'gpt-3.5-turbo';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToTest,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `OpenAI API Error: ${response.status} - ${errorText}`
      };
    }

    return {
      success: true,
      message: `OpenAI API testada com sucesso usando ${modelToTest}`,
      modelTested: modelToTest
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro de conexão OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

async function testAnthropic(apiKey: string, selectedModel?: string): Promise<TestResponse> {
  const modelToTest = selectedModel || 'claude-3-sonnet-20240229';
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelToTest,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Test' }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Anthropic API Error: ${response.status} - ${errorText}`
      };
    }

    return {
      success: true,
      message: `Anthropic API testada com sucesso usando ${modelToTest}`,
      modelTested: modelToTest
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro de conexão Anthropic: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}