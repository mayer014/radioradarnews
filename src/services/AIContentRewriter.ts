import type { ExtractedContent } from './ContentExtractor';
import { ENV } from '@/config/environment';

export interface RewrittenContent {
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

export class AIContentRewriter {
  private static readonly SYSTEM_PROMPT = `
Você é um assistente especializado em reescrita jornalística.  
Sua tarefa é pegar uma notícia extraída e entregar um resumo curto, objetivo e atrativo para leitura, seguindo as regras abaixo:

1. **Tamanho**: entre 3 e 5 parágrafos no máximo.  
2. **Clareza**: escreva em linguagem jornalística simples, fluida e sem repetições.  
3. **Formatação**:  
   - Separe os parágrafos com **quebra de linha (enter duplo)**, para deixar o texto arejado.  
   - Não use blocos corridos longos.  
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

Formato de resposta (JSON):
{
  "title": "Título reescrito e atrativo",
  "slug": "titulo-em-slug-format", 
  "lead": "Lead/subtítulo da matéria (1-2 frases)",
  "content_html": "Conteúdo HTML com 3-5 parágrafos bem estruturados + seção de fonte no final",
  "excerpt": "Resumo de 2-3 linhas para prévia",
  "category_suggestion": "Categoria sugerida",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "Descrição para gerar imagem ilustrativa",
  "source_url": "URL da fonte original",
  "source_domain": "Domínio da fonte",
  "published_at_suggestion": "Data/hora sugerida em ISO"
}

CRÍTICO: O conteúdo deve ter 3-5 parágrafos bem separados, nunca texto corrido. Use <p></p> para cada parágrafo com quebras duplas entre eles.
`;

  static async rewriteContent(extractedContent: ExtractedContent): Promise<RewrittenContent> {
    try {
      // First try: Use Supabase Edge Function (Groq from secrets)
      return await this.callSupabaseAIRewriter(extractedContent);
    } catch (error) {
      console.error('Supabase AI rewriter failed:', error);
      
      // Fallback: Try localStorage configured providers
      const userPrompt = `
TAREFA: Reescreva o conteúdo abaixo em formato jornalístico, retornando APENAS o JSON conforme instruções do sistema.

CONTEÚDO ORIGINAL:
Título: ${extractedContent.title}
Fonte: ${extractedContent.url}
Conteúdo: ${this.cleanTextContent(extractedContent.content)}
`;

      try {
        return await this.tryAIProviders(userPrompt);
      } catch (fallbackError) {
        console.error('All AI providers failed:', fallbackError);
        throw new Error(`Falha na reescrita por IA: ${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`);
      }
    }
  }

  private static async tryAIProviders(userPrompt: string): Promise<RewrittenContent> {
    // Get configured providers from localStorage
    const configuredProviders = this.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      // No AI providers configured, using fallback
      return await this.createFallbackContent(userPrompt);
    }

    // Try each configured provider
    for (const provider of configuredProviders) {
      try {
        // Trying provider with model
        
        if (provider.id === 'openai') {
          return await this.callOpenAI(userPrompt, provider.model);
        } else if (provider.id === 'anthropic') {
          return await this.callAnthropic(userPrompt, provider.model);
        } else if (provider.id === 'glm') {
          return await this.callGLM(userPrompt, provider.model);
        } else if (provider.id === 'groq') {
          return await this.callGroq(userPrompt, provider.model);
        }
      } catch (error) {
        // Provider failed
        continue;
      }
    }

    // Fallback: use local processing when all AI providers fail
    // All configured providers failed, using fallback
    return await this.createFallbackContent(userPrompt);
  }

  private static async createFallbackContent(userPrompt: string): Promise<RewrittenContent> {
    // Extract content from the prompt
    const titleMatch = userPrompt.match(/Título:\s*(.+)/);
    const sourceMatch = userPrompt.match(/Fonte:\s*(.+)/);
    const contentMatch = userPrompt.match(/Conteúdo:\s*([\s\S]+)/);
    
    const originalTitle = titleMatch?.[1]?.trim() || 'Título não encontrado';
    const sourceUrl = sourceMatch?.[1]?.trim() || '';

    // Remove qualquer bloco de instruções ou exemplos internos do conteúdo capturado
    let originalContent = (contentMatch?.[1] || '').trim();
    originalContent = originalContent
      .replace(/INSTRUÇÕES ESPECÍFICAS:[\s\S]*/i, '')
      .replace(/EXEMPLO DE TRANSFORMAÇÃO:[\s\S]*/i, '')
      .replace(/Objetivo:?[\s\S]*$/i, '')
      .trim();

    // Actually rewrite the content instead of just cleaning it
    const rewrittenContent = this.rewriteContentLocally(originalContent, originalTitle);
    const rewrittenTitle = this.rewriteTitleLocally(originalTitle);
    const domain = sourceUrl ? new URL(sourceUrl).hostname : 'fonte-desconhecida';
    
    // Add formatted source section to content
    const sourceSection = `
<div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
  <p style="font-style: italic; color: #6b7280; font-size: 0.9rem;">
    <strong>Fonte:</strong> 
    <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">
      ${domain} — Leia a matéria completa clicando aqui
    </a>
  </p>
</div>`;
    
    const contentWithSource = rewrittenContent + '\n\n' + sourceSection;
    
    // Generate categorization based on keywords
    const category = this.categorizeContent(rewrittenTitle + ' ' + rewrittenContent);
    const tags = this.extractTags(rewrittenTitle + ' ' + rewrittenContent, domain);
    
    return {
      title: rewrittenTitle,
      slug: rewrittenTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 60),
      lead: this.generateLeadLocally(rewrittenContent),
      content_html: contentWithSource,
      excerpt: rewrittenContent.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
      category_suggestion: category,
      tags,
      image_prompt: `Imagem ilustrativa para: ${rewrittenTitle}`,
      source_url: sourceUrl,
      source_domain: domain,
      published_at_suggestion: new Date().toISOString()
    };
  }

  private static processContentLocally(content: string): string {
    // Basic content processing without AI
    return content
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<!--.*?-->/gs, '')
      .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private static rewriteContentLocally(content: string, title: string): string {
    // Clean the content first
    const cleanContent = this.processContentLocally(content);
    
    // Split into sentences and group into 3-5 paragraphs
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return '<p>Conteúdo não disponível para processamento.</p>';
    
    // Group sentences into 3-5 paragraphs
    const paragraphCount = Math.min(5, Math.max(3, Math.ceil(sentences.length / 3)));
    const sentencesPerParagraph = Math.ceil(sentences.length / paragraphCount);
    
    const paragraphs: string[] = [];
    for (let i = 0; i < paragraphCount; i++) {
      const start = i * sentencesPerParagraph;
      const end = Math.min(start + sentencesPerParagraph, sentences.length);
      const paragraphSentences = sentences.slice(start, end);
      
      if (paragraphSentences.length > 0) {
        const paragraph = paragraphSentences
          .map(s => this.paraphraseText(s.trim()))
          .join('. ')
          .replace(/\.\./g, '.')
          + '.';
        paragraphs.push(paragraph);
      }
    }
    
    // Structure as properly formatted HTML with double line breaks
    let structuredContent = '';
    
    paragraphs.forEach((paragraph, index) => {
      if (index === 0) {
        // First paragraph with emphasis
        structuredContent += `<p><strong>${paragraph}</strong></p>\n\n`;
      } else {
        // Regular paragraphs
        structuredContent += `<p>${paragraph}</p>\n\n`;
      }
    });
    
    return structuredContent.trim();
  }

  private static rewriteTitleLocally(title: string): string {
    // Simple title rewriting with synonyms and restructuring
    const synonyms: Record<string, string[]> = {
      'anunciou': ['divulgou', 'revelou', 'comunicou', 'informou'],
      'disse': ['declarou', 'afirmou', 'comentou', 'explicou'],
      'aconteceu': ['ocorreu', 'sucedeu', 'teve lugar'],
      'novo': ['recente', 'inédito', 'mais recente'],
      'importante': ['relevante', 'significativo', 'fundamental'],
      'governo': ['administração pública', 'gestão municipal', 'prefeitura'],
      'empresa': ['companhia', 'corporação', 'organização'],
      'projeto': ['iniciativa', 'programa', 'plano']
    };

    let rewrittenTitle = title;
    
    // Replace some words with synonyms
    Object.entries(synonyms).forEach(([word, alternatives]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(rewrittenTitle)) {
        const randomSynonym = alternatives[Math.floor(Math.random() * alternatives.length)];
        rewrittenTitle = rewrittenTitle.replace(regex, randomSynonym);
      }
    });
    
    return rewrittenTitle;
  }

  private static paraphraseText(text: string): string {
    // Simple paraphrasing techniques
    let paraphrased = text;
    
    // Replace common words and phrases
    const replacements: Array<[RegExp, string]> = [
      [/\bde acordo com\b/gi, 'segundo'],
      [/\binformou que\b/gi, 'revelou que'],
      [/\bdisse que\b/gi, 'afirmou que'],
      [/\bno entanto\b/gi, 'contudo'],
      [/\bporém\b/gi, 'entretanto'],
      [/\balém disso\b/gi, 'ademais'],
      [/\bpor causa de\b/gi, 'devido a'],
      [/\bem razão de\b/gi, 'por conta de'],
      [/\bmuito importante\b/gi, 'extremamente relevante'],
      [/\bbastante\b/gi, 'consideravelmente'],
      [/\bneste momento\b/gi, 'atualmente'],
      [/\bagora\b/gi, 'neste momento']
    ];
    
    replacements.forEach(([pattern, replacement]) => {
      paraphrased = paraphrased.replace(pattern, replacement);
    });
    
    // Vary sentence structure slightly
    if (paraphrased.includes(', que ')) {
      paraphrased = paraphrased.replace(/, que /, '. Este ');
    }
    
    return paraphrased;
  }

  private static generateSubheading(paragraph: string): string {
    const words = paragraph.split(' ').slice(0, 6);
    const heading = words.join(' ').replace(/[.,!?]$/, '');
    return heading.charAt(0).toUpperCase() + heading.slice(1);
  }

  private static generateLeadLocally(content: string): string {
    // Extract first meaningful paragraph and create a lead
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join('. ').substring(0, 200) + '.';
    } else if (sentences.length === 1) {
      return sentences[0].substring(0, 200) + '.';
    }
    
    return textContent.substring(0, 200) + '...';
  }

  private static categorizeContent(text: string): string {
    const categories = [
      { name: 'Segurança Pública', keywords: ['polícia', 'crime', 'violência', 'segurança', 'delegacia', 'assalto', 'homicídio', 'prisão', 'bandido'] },
      { name: 'Política', keywords: ['governo', 'prefeito', 'vereador', 'política', 'eleição', 'partido', 'deputado', 'senador', 'presidente'] },
      { name: 'Economia', keywords: ['economia', 'dinheiro', 'investimento', 'empresa', 'negócios', 'mercado', 'inflação', 'emprego'] },
      { name: 'Esportes', keywords: ['futebol', 'esporte', 'jogo', 'campeonato', 'atleta', 'time', 'copa', 'olimpíadas'] },
      { name: 'Cultura', keywords: ['cultura', 'arte', 'música', 'teatro', 'cinema', 'festival', 'exposição', 'artista'] }
    ];

    const textLower = text.toLowerCase();
    
    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (textLower.includes(keyword)) {
          return category.name;
        }
      }
    }
    
    return 'Notícias'; // Default category
  }

  private static extractTags(text: string, domain: string): string[] {
    const commonTags = ['notícia', 'informação', domain.replace(/^www\./, '')];
    
    // Extract potential tags from content
    const textLower = text.toLowerCase();
    const keywords = [
      'breaking', 'urgente', 'último', 'atualização',
      'economia', 'política', 'esporte', 'cultura', 'segurança',
      'local', 'nacional', 'internacional'
    ];
    
    const foundTags = keywords.filter(keyword => textLower.includes(keyword));
    
    return [...commonTags, ...foundTags].slice(0, 5);
  }

  private static async callLovableAI(userPrompt: string): Promise<RewrittenContent> {
    // This would use Lovable's native AI if available
    // For now, we'll simulate or use a fallback
    throw new Error('Lovable native AI not implemented');
  }

  private static async callOpenAI(userPrompt: string, model: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OpenAI API key not found');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return this.parseAIResponse(content);
  }

  private static async callAnthropic(userPrompt: string, model: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('Anthropic API key not found');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [
          { role: 'user', content: this.SYSTEM_PROMPT + '\n\n' + userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    
    return this.parseAIResponse(content);
  }

  private static async callGLM(userPrompt: string, model: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('GLM_API_KEY');
    if (!apiKey) throw new Error('GLM API key not found');

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`GLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return this.parseAIResponse(content);
  }

  private static async callGroq(userPrompt: string, model: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('GROQ_API_KEY');
    if (!apiKey) throw new Error('Groq API key not found');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return this.parseAIResponse(content);
  }

  private static async callHuggingFace(userPrompt: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('HUGGINGFACE_API_KEY');
    if (!apiKey) throw new Error('Hugging Face API key not found');

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: this.SYSTEM_PROMPT + '\n\n' + userPrompt,
        options: { wait_for_model: true }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data[0]?.generated_text || data.generated_text;
    
    return this.parseAIResponse(content);
  }

  private static async callSupabaseAIRewriter(extractedContent: ExtractedContent): Promise<RewrittenContent> {
    console.log('Calling Supabase AI rewriter service...');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('ai-rewriter-service', {
      body: {
        title: extractedContent.title,
        content: extractedContent.content,
        url: extractedContent.url
      }
    });

    if (error) {
      console.error('Supabase AI rewriter error:', error);
      throw new Error(`Supabase AI service error: ${error.message}`);
    }

    if (data?.error) {
      console.error('AI rewriter service returned error:', data.error);
      throw new Error(`AI service error: ${data.error}`);
    }

    if (!data) {
      throw new Error('No response from AI rewriter service');
    }

    console.log('Successfully got response from Supabase AI rewriter');
    return data as RewrittenContent;
  }

  private static async callGenericLLM(userPrompt: string): Promise<RewrittenContent> {
    const baseUrl = this.getEnvVar('LLM_BASE_URL');
    const model = this.getEnvVar('LLM_MODEL');
    const apiKey = this.getEnvVar('LLM_API_KEY');
    
    if (!baseUrl || !model) throw new Error('Generic LLM configuration not found');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Generic LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return this.parseAIResponse(content);
  }

  private static parseAIResponse(content: string): RewrittenContent {
    try {
      // Clean the response and extract JSON
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent) as RewrittenContent;
      
      // Validate required fields
      const required = ['title', 'slug', 'lead', 'content_html', 'excerpt', 'category_suggestion', 'tags', 'image_prompt'];
      for (const field of required) {
        if (!(parsed as any)[field]) {
          throw new Error(`Campo obrigatório ausente: ${field}`);
        }
      }

      // Sanitize to ensure no internal instructions leak into output
      const strip = (txt: string) => (txt || '')
        .replace(/INSTRUÇÕES ESPECÍFICAS:[\s\S]*$/i, '')
        .replace(/EXEMPLO DE TRANSFORMAÇÃO:[\s\S]*$/i, '')
        .replace(/Objetivo:?[\s\S]*$/i, '')
        .trim();

      parsed.content_html = strip(parsed.content_html);
      parsed.lead = strip(parsed.lead);
      parsed.excerpt = strip(parsed.excerpt);
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error(`Resposta da IA inválida: ${error instanceof Error ? error.message : 'Formato JSON inválido'}`);
    }
  }

  private static cleanTextContent(html: string): string {
    // Remove HTML tags and clean up text
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove unwanted elements
    temp.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
    
    return temp.textContent || temp.innerText || '';
  }

  private static getEnvVar(name: string): string | undefined {
    // 1) Runtime env.js (Easypanel)
    try {
      const runtime = ENV.RUNTIME_CONFIG as Record<string, string>;
      if (runtime && runtime[name]) return runtime[name];
    } catch {}

    // 2) User-configured localStorage (fallback)
    const providerMappings: Record<string, string> = {
      'OPENAI_API_KEY': 'ai_key_openai',
      'ANTHROPIC_API_KEY': 'ai_key_anthropic',
      'GLM_API_KEY': 'ai_key_glm',
      'GROQ_API_KEY': 'ai_key_groq',
      'HUGGINGFACE_API_KEY': 'ai_key_huggingface',
      'OPENROUTER_API_KEY': 'ai_key_openrouter'
    };

    const localStorageKey = providerMappings[name];
    if (localStorageKey) {
      return localStorage.getItem(localStorageKey) || undefined;
    }

    return undefined;
  }

  static getConfiguredProviders(): Array<{ id: string; name: string; model: string }> {
    const savedConfig = localStorage.getItem('ai_providers_config');
    if (!savedConfig) return [];

    try {
      const config = JSON.parse(savedConfig);
      const providers = [];

      for (const [id, data] of Object.entries(config)) {
        if (typeof data === 'object' && data && 'model' in data && 'status' in data) {
          const providerData = data as { model: string; status: string };
          if (providerData.status === 'success') {
            const providerNames: Record<string, string> = {
              'openai': 'OpenAI',
              'anthropic': 'Anthropic Claude',
              'glm': 'GLM-4.5',
              'groq': 'Groq'
            };
            
            providers.push({
              id,
              name: providerNames[id] || id,
              model: providerData.model
            });
          }
        }
      }

      return providers;
    } catch (error) {
      console.error('Error loading provider config:', error);
      return [];
    }
  }
}