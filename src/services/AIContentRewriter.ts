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
  // Fallback prompt caso não consiga buscar do banco
  private static readonly FALLBACK_SYSTEM_PROMPT = `
Você é um assistente especializado em reescrita jornalística.  
Sua tarefa é pegar uma notícia extraída e entregar uma matéria completa, bem desenvolvida e atrativa para leitura, seguindo as regras abaixo:

⚠️ CRÍTICO: O TÍTULO DEVE SER COMPLETAMENTE REESCRITO - nunca use o título original igual ou muito similar, pois isso viola direitos autorais e prejudica o SEO no Google.

1. **Tamanho OBRIGATÓRIO**:
   - MÍNIMO de 4 parágrafos de conteúdo (sem contar a seção de fonte).
   - Idealmente entre 4 e 6 parágrafos.
   - Cada parágrafo deve ter entre 3 e 5 frases completas.
   - Somente se a matéria original for MUITO curta (menos de 3 frases), aceita-se uma reescrita mais curta.
   - NÃO faça textos resumidos demais. O leitor quer ler uma matéria completa, não um resumo telegráfico.
2. **Clareza**: escreva em linguagem jornalística simples, fluida e sem repetições.  
3. **Formatação**:  
   - Separe os parágrafos com **quebra de linha (enter duplo)**, para deixar o texto arejado.  
   - Não use blocos corridos longos.  
4. **Desenvolvimento**:
   - Desenvolva o assunto com profundidade. Não apenas resuma, mas contextualize, explique e analise.
   - Adicione contexto quando necessário para o leitor entender melhor a notícia.
   - Destaque os pontos principais sem perder o sentido central.
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
  "content_html": "Conteúdo HTML com MÍNIMO 4 parágrafos bem desenvolvidos + seção de fonte no final",
  "excerpt": "Resumo de 2-3 linhas para prévia",
  "category_suggestion": "Categoria sugerida",
  "tags": ["tag1", "tag2", "tag3"],
  "image_prompt": "Descrição para gerar imagem ilustrativa",
  "source_url": "URL da fonte original",
  "source_domain": "Domínio da fonte",
  "published_at_suggestion": "Data/hora sugerida em ISO"
}

CRÍTICO: O conteúdo DEVE ter NO MÍNIMO 4 parágrafos bem desenvolvidos com 3-5 frases cada. Use <p></p> para cada parágrafo com quebras duplas entre eles.
`;

  /**
   * Busca o prompt customizado do banco de dados
   */
  private static async getSystemPrompt(): Promise<string> {
    try {
      // Force fresh fetch with timestamp to avoid caching
      const timestamp = new Date().getTime();
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('category', 'ai')
        .eq('key', 'rewriter_system_prompt')
        .maybeSingle();

      if (error) {
        console.warn('[AIContentRewriter] Error fetching system prompt, using fallback:', error);
        return this.FALLBACK_SYSTEM_PROMPT;
      }

      const valueData = data?.value as { prompt?: string } | null;
      const customPrompt = valueData?.prompt;

      if (customPrompt && typeof customPrompt === 'string' && customPrompt.length > 0) {
        console.log(`✅ [AIContentRewriter] Using custom system prompt (${customPrompt.length} chars) fetched at ${new Date().toISOString()}`);
        return customPrompt;
      }

      console.warn('⚠️ [AIContentRewriter] No custom prompt found, using fallback');
      return this.FALLBACK_SYSTEM_PROMPT;
    } catch (error) {
      console.warn('[AIContentRewriter] Exception fetching system prompt, using fallback:', error);
      return this.FALLBACK_SYSTEM_PROMPT;
    }
  }

  static async rewriteContent(extractedContent: ExtractedContent): Promise<RewrittenContent> {
    console.log('🔄 Starting content rewriting with external LLM (Groq)...');
    
    // Fetch the latest prompt every time (no caching)
    const SYSTEM_PROMPT = await this.getSystemPrompt();
    console.log(`📝 Prompt loaded, starting rewrite process for: "${extractedContent.title}"`);

    try {
      // EXCLUSIVO: Usar Supabase Edge Function que usa GROQ_API_KEY
      // Não há fallback para Lovable AI
      const result = await this.callSupabaseAIRewriter(extractedContent);
      return this.ensureRewrittenTitle(result, extractedContent.title);
    } catch (error) {
      console.error('❌ Supabase AI rewriter (Groq) failed:', error);
      
      // Tentar provedores configurados no localStorage (OpenAI, Anthropic, etc.)
      // NÃO inclui Lovable AI
      const userPrompt = `
TAREFA: Reescreva o conteúdo abaixo em formato jornalístico, retornando APENAS o JSON conforme instruções do sistema.

CONTEÚDO ORIGINAL:
Título: ${extractedContent.title}
Fonte: ${extractedContent.url}
Conteúdo: ${this.cleanTextContent(extractedContent.content)}
`;

      try {
        const result = await this.tryExternalAIProviders(userPrompt, SYSTEM_PROMPT);
        return this.ensureRewrittenTitle(result, extractedContent.title);
      } catch (fallbackError) {
        console.error('❌ All external AI providers failed:', fallbackError);
        // Retornar erro claro - NÃO fazer fallback silencioso
        throw new Error(`Falha na reescrita: Configure uma LLM externa (Groq, OpenAI, etc.) no Painel Admin → Configurações. Erro: ${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`);
      }
    }
  }

  /**
   * Tenta apenas provedores externos configurados pelo usuário
   * NÃO inclui Lovable AI em nenhuma circunstância
   */
  private static async tryExternalAIProviders(userPrompt: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
    // Get configured providers from localStorage
    const configuredProviders = this.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      throw new Error('Nenhuma LLM externa configurada. Configure Groq, OpenAI ou outro provedor no Painel Admin.');
    }

    // Priorizar Groq, depois outros provedores
    const orderedProviders = [...configuredProviders].sort((a, b) => 
      a.id === 'groq' ? -1 : b.id === 'groq' ? 1 : 0
    );

    // Try each configured provider (APENAS provedores externos)
    for (const provider of orderedProviders) {
      try {
        console.log(`🔄 Tentando provedor externo: ${provider.name} (${provider.model})`);
        
        if (provider.id === 'openai') {
          return await this.callOpenAI(userPrompt, provider.model, SYSTEM_PROMPT);
        } else if (provider.id === 'anthropic') {
          return await this.callAnthropic(userPrompt, provider.model, SYSTEM_PROMPT);
        } else if (provider.id === 'glm') {
          return await this.callGLM(userPrompt, provider.model, SYSTEM_PROMPT);
        } else if (provider.id === 'groq') {
          return await this.callGroq(userPrompt, provider.model, SYSTEM_PROMPT);
        }
      } catch (error) {
        console.warn(`⚠️ Provedor ${provider.id} falhou:`, error);
        continue;
      }
    }

    throw new Error('Todos os provedores de LLM externa falharam. Verifique suas chaves API.');
  }

  /**
   * @deprecated - Este método foi substituído por tryExternalAIProviders
   * Mantido apenas para compatibilidade - NÃO usar Lovable AI
   */
  private static async tryAIProviders(userPrompt: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
    return this.tryExternalAIProviders(userPrompt, SYSTEM_PROMPT);
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
    
    // Split into sentences and group into up to 3 paragraphs (máximo 3)
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return '<p>Conteúdo não disponível para processamento.</p>';
    
    // Sempre limite a no máximo 3 parágrafos para uma versão mais enxuta
    const paragraphCount = Math.min(3, Math.max(1, Math.ceil(sentences.length / 4)));
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

    let rewrittenTitle = title.trim();
    
    // Replace some words with synonyms
    Object.entries(synonyms).forEach(([word, alternatives]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(rewrittenTitle)) {
        const randomSynonym = alternatives[Math.floor(Math.random() * alternatives.length)];
        rewrittenTitle = rewrittenTitle.replace(regex, randomSynonym);
      }
    });

    // Ensure the title is not identical; if it is, enforce a minimal change
    if (rewrittenTitle.toLowerCase() === title.trim().toLowerCase()) {
      // Simple transformation: add a subtle qualifier to differentiate
      rewrittenTitle = rewrittenTitle.replace(/:?\s*$/,'') + ' — entenda o caso';
    }
    
    return rewrittenTitle;
  }

  private static ensureRewrittenTitle(result: RewrittenContent, originalTitle: string): RewrittenContent {
    let title = (result.title || '').trim();
    const baseOriginal = originalTitle.trim();

    if (!title || title.toLowerCase() === baseOriginal.toLowerCase()) {
      title = this.rewriteTitleLocally(baseOriginal);
      if (title.toLowerCase() === baseOriginal.toLowerCase()) {
        title = title.replace(/:?\s*$/, '') + ' — entenda o caso';
      }
    }

    // Enforce max 100 characters for the title (as per prompt)
    if (title.length > 100) {
      title = title.slice(0, 100).replace(/\s+\S*$/, '');
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 60);

    return { ...result, title, slug };
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

  /**
   * @deprecated - Lovable AI NÃO é utilizado neste sistema
   * O sistema usa exclusivamente LLM externa configurada pelo usuário
   * Este método está mantido apenas para compatibilidade e sempre retorna erro
   */
  private static async callLovableAI(userPrompt: string): Promise<RewrittenContent> {
    throw new Error('Lovable AI não é utilizado. Configure uma LLM externa (Groq, OpenAI, etc.) no Painel Admin.');
  }

  private static async callOpenAI(userPrompt: string, model: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
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
          { role: 'system', content: SYSTEM_PROMPT },
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

  private static async callAnthropic(userPrompt: string, model: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
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
          { role: 'user', content: SYSTEM_PROMPT + '\n\n' + userPrompt }
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

  private static async callGLM(userPrompt: string, model: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
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
          { role: 'system', content: SYSTEM_PROMPT },
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

  private static async callGroq(userPrompt: string, model: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
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
          { role: 'system', content: SYSTEM_PROMPT },
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

  private static async callHuggingFace(userPrompt: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
    const apiKey = this.getEnvVar('HUGGINGFACE_API_KEY');
    if (!apiKey) throw new Error('Hugging Face API key not found');

    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: SYSTEM_PROMPT + '\n\n' + userPrompt,
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
    console.log('🚀 [callSupabaseAIRewriter] Calling Supabase AI rewriter service...');
    console.log('📤 [callSupabaseAIRewriter] Request data:', {
      title: extractedContent.title.substring(0, 50) + '...',
      contentLength: extractedContent.content.length,
      url: extractedContent.url
    });
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('ai-rewriter-service', {
      body: {
        title: extractedContent.title,
        content: extractedContent.content,
        url: extractedContent.url
      }
    });
    
    console.log('📥 [callSupabaseAIRewriter] Response received:', { 
      hasData: !!data, 
      hasError: !!error,
      dataKeys: data ? Object.keys(data) : [],
      errorMessage: error?.message 
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

  private static async callGenericLLM(userPrompt: string, SYSTEM_PROMPT: string): Promise<RewrittenContent> {
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
          { role: 'system', content: SYSTEM_PROMPT },
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