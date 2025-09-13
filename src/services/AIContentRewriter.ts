import type { ExtractedContent } from './ContentExtractor';

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
Você é uma assistente editorial especializada em reescrever notícias de forma profissional e ética.

TAREFA: Transforme o conteúdo fornecido em um RESUMO JORNALÍSTICO claro, coeso e atrativo, sem copiar trechos literais.

Diretrizes (internas — não reproduzir no resultado):
1. Produzir entre 3 e 6 parágrafos mantendo fatos, contexto e relevância.
2. Linguagem jornalística objetiva, apropriada para portal de notícias moderno.
3. Não inventar informações; evitar frases idênticas ao texto de origem (SEO).
4. Ao final do texto, incluir: "Fonte: [NOME DO SITE] – Leia a matéria completa em: [LINK DA MATÉRIA ORIGINAL]".

Saída:
- Retorne APENAS um JSON válido com a estrutura abaixo.
- O campo content_html deve conter SOMENTE o texto jornalístico final em HTML (parágrafos, negritos/ênfases quando necessário) seguido da nota de crédito. Não inclua instruções, exemplos, disclaimers ou notas explicativas em nenhum campo.

{
  "title": "Título SEO-friendly (máx 60 chars)",
  "slug": "titulo-em-kebab-case",
  "lead": "Lead de 2-3 frases resumindo a notícia",
  "content_html": "Resumo em 3-6 parágrafos com tags HTML (p, strong, em) + nota de crédito final",
  "excerpt": "Resumo até 160 caracteres",
  "category_suggestion": "Política|Economia|Esportes|Cultura|Segurança Pública|Opinião",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "Descrição objetiva para imagem de capa (PT-BR)",
  "source_url": "URL_ORIGINAL",
  "source_domain": "dominio.com",
  "published_at_suggestion": "2024-01-01T12:00:00Z"
}
`;

  static async rewriteContent(extractedContent: ExtractedContent): Promise<RewrittenContent> {
    const userPrompt = `
TAREFA: Reescreva o conteúdo abaixo em formato jornalístico, retornando APENAS o JSON conforme instruções do sistema.

CONTEÚDO ORIGINAL:
Título: ${extractedContent.title}
Fonte: ${extractedContent.url}
Conteúdo: ${this.cleanTextContent(extractedContent.content)}
`;

    try {
      // Try different AI providers in order of preference
      return await this.tryAIProviders(userPrompt);
    } catch (error) {
      console.error('Error rewriting content:', error);
      throw new Error(`Falha na reescrita por IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      content_html: rewrittenContent,
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
    
    // Split into paragraphs
    const paragraphs = cleanContent.split('\n').filter(p => p.trim().length > 0);
    
    // Rewrite each paragraph with slight variations
    const rewrittenParagraphs = paragraphs.map(paragraph => {
      return this.paraphraseText(paragraph);
    });
    
    // Structure as proper HTML with headings
    let structuredContent = `<h2>${this.paraphraseText(title)}</h2>\n\n`;
    
    rewrittenParagraphs.forEach((paragraph, index) => {
      if (index === 0) {
        structuredContent += `<p><strong>${paragraph}</strong></p>\n\n`;
      } else if (index % 3 === 0 && paragraph.length > 100) {
        // Add some H3 headings for structure
        const heading = this.generateSubheading(paragraph);
        structuredContent += `<h3>${heading}</h3>\n\n<p>${paragraph}</p>\n\n`;
      } else {
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
    // Check localStorage for API keys configured by user
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