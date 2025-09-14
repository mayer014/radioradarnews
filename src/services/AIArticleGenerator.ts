import { ENV } from '@/config/environment';

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

export class AIArticleGenerator {
  private apiKey: string;
  // Sistema base padronizado para jornalismo técnico e específico
  private static readonly JOURNALISM_SYSTEM_PROMPT = `
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


  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async generateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    try {
      // First try: Use Supabase Edge Function (Groq from secrets)
      return await this.callSupabaseAIArticleGenerator(request);
    } catch (error) {
      console.error('Supabase AI article generator failed:', error);
      
      try {
        // Fallback: Try localStorage configured providers
        const prompt = this.buildPrompt(request);
        
        // 1) Tentar provedores configurados (prioriza Groq)
        const providers = this.getConfiguredProviders();
        if (providers.length > 0) {
          const ordered = [...providers].sort((a, b) => (a.id === 'groq' ? -1 : 1));
          for (const provider of ordered) {
            try {
              if (provider.id === 'groq') {
                const content = await this.callGroq(prompt, provider.model);
                if (content) return this.parseGeneratedContent(content, request);
              }
              // Outros provedores podem ser adicionados aqui quando necessário
            } catch (e) {
              console.warn(`Provider ${provider.id} falhou`, e);
              continue;
            }
          }
        }

        // 2) Fallback: OpenAI se a chave foi informada neste serviço
        if (this.apiKey) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: AIArticleGenerator.JOURNALISM_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
              ],
              temperature: 0.4,
              max_tokens: 2200,
            }),
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }
          const data = await response.json();
          const content = data.choices[0]?.message?.content;
          if (!content) throw new Error('Nenhum conteúdo foi gerado pela IA');
          return this.parseGeneratedContent(content, request);
        }

        // 3) Fallback final: mock específico
        return this.generateMockArticle(request);
      } catch (fallbackError) {
        console.error('All AI providers failed:', fallbackError);
        // Mock como último recurso
        return this.generateMockArticle(request);
      }
    }
  }

  private buildPrompt(request: ArticleGenerationRequest): string {
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

EXEMPLO DE TRANSFORMAÇÃO DE TÍTULO:
❌ Ideia original: "Criação de games: programas disponíveis"
✅ Título reescrito: "Unity vs Unreal Engine 5: qual motor escolher para jogos indie em 2024"

❌ Ideia original: "Marketing digital para pequenas empresas"
✅ Título reescrito: "Instagram Ads vs Google Ads: comparativo de custos para PMEs"

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
- Versões atuais (2024) quando relevante
- Preços aproximados ou faixas de valor
- Requisitos técnicos específicos
- Casos de uso práticos e reais
- Links conceituais para recursos mencionados

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

  private parseGeneratedContent(content: string, request: ArticleGenerationRequest): GeneratedArticle {
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      let title: string = parsed.title || 'Título Gerado pela IA';
      // Garantir que o título NÃO copie a ideia original
      const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      const ideaN = normalize(request.idea);
      const titleN = normalize(title);
      if (!title || titleN === ideaN || ideaN.includes(titleN) || titleN.includes(ideaN)) {
        title = this.rewriteTitleFromIdea(request.idea);
      }

      return {
        title,
        excerpt: parsed.excerpt || 'Resumo gerado pela IA',
        content: parsed.content || '<p>Conteúdo gerado pela IA</p>',
        suggestedCategory: parsed.suggestedCategory || request.category,
        keywords: parsed.keywords || []
      };
    } catch (error) {
      console.error('Erro ao fazer parse do conteúdo gerado:', error);
      return this.extractContentManually(content, request);
    }
  }

  private extractContentManually(content: string, request: ArticleGenerationRequest): GeneratedArticle {
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      title: lines[0] || 'Artigo Gerado pela IA',
      excerpt: lines[1] || 'Resumo do artigo gerado pela IA',
      content: `<p>${lines.slice(2).join('</p><p>')}</p>`,
      suggestedCategory: request.category,
      keywords: []
    };
  }

  // Provedores e utilidades
  private getConfiguredProviders(): Array<{ id: string; name: string; model: string }> {
    const savedConfig = localStorage.getItem('ai_providers_config');
    if (!savedConfig) return [];
    try {
      const config = JSON.parse(savedConfig);
      const providers: Array<{ id: string; name: string; model: string }> = [];
      for (const [id, data] of Object.entries(config)) {
        if (typeof data === 'object' && data && 'model' in data && 'status' in data) {
          const providerData = data as { model: string; status: string };
          if (providerData.status === 'success') {
            const providerNames: Record<string, string> = {
              openai: 'OpenAI',
              anthropic: 'Anthropic Claude',
              glm: 'GLM-4.5',
              groq: 'Groq'
            };
            providers.push({ id, name: providerNames[id] || id, model: providerData.model });
          }
        }
      }
      return providers;
    } catch (e) {
      console.error('Erro ao carregar provedores de IA:', e);
      return [];
    }
  }

  private getEnvVar(name: string): string | undefined {
    // 1) Runtime env.js (Easypanel)
    try {
      const runtime = (ENV as any).RUNTIME_CONFIG as Record<string, string>;
      if (runtime && runtime[name]) return runtime[name];
    } catch {}

    // 2) Fallback: user-configured localStorage
    const mapping: Record<string, string> = {
      OPENAI_API_KEY: 'ai_key_openai',
      ANTHROPIC_API_KEY: 'ai_key_anthropic',
      GLM_API_KEY: 'ai_key_glm',
      GROQ_API_KEY: 'ai_key_groq'
    };
    const key = mapping[name];
    return key ? localStorage.getItem(key) || undefined : undefined;
  }

  private async callGroq(prompt: string, model: string): Promise<string> {
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
          { role: 'system', content: AIArticleGenerator.JOURNALISM_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3200
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${text}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callSupabaseAIArticleGenerator(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    console.log('Calling Supabase AI article generator service...');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('ai-article-generator-service', {
      body: request
    });

    if (error) {
      console.error('Supabase AI article generator error:', error);
      throw new Error(`Supabase AI service error: ${error.message}`);
    }

    if (data?.error) {
      console.error('AI article generator service returned error:', data.error);
      throw new Error(`AI service error: ${data.error}`);
    }

    if (!data) {
      throw new Error('No response from AI article generator service');
    }

    console.log('Successfully got response from Supabase AI article generator');
    return data as GeneratedArticle;
  }

  private rewriteTitleFromIdea(idea: string): string {
    const lower = idea.toLowerCase();
    if (/game|games|jogo|jogos/.test(lower)) {
      return 'Unity, Unreal e Godot: guia 2025 para criar jogos';
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

  private generateMockArticle(request: ArticleGenerationRequest): GeneratedArticle {
    const mockArticles = {
      'Política': {
        title: 'Nova Lei de Transparência Pública Revoluciona Controle Social e Combate à Corrupção no Brasil',
        excerpt: 'Projeto inovador estabelece regras rigorosas para divulgação de gastos públicos, cria mecanismos avançados de controle social e representa marco histórico na democratização do acesso à informação governamental.',
        content: `
          <p>O Congresso Nacional aprovou nesta quarta-feira (15) a nova Lei de Transparência Pública, marco legislativo que estabelece as regras mais avançadas já implementadas no país para a divulgação de gastos governamentais. A medida, que recebeu apoio de 387 dos 513 deputados e 67 dos 81 senadores, promete revolucionar a forma como os cidadãos acompanham e fiscalizam o uso dos recursos públicos em todas as esferas de governo.</p>
          
          <p>O projeto, resultado de dois anos de intensos debates e audiências públicas, contou com a participação de especialistas em administração pública, organizações da sociedade civil, tribunais de contas e representantes de todos os partidos políticos. "Esta é uma conquista histórica para a democracia brasileira", afirmou a deputada relatora Ana Costa (PSDB-RJ) durante a votação.</p>
          
          <h2>Principais Inovações da Nova Legislação</h2>
          
          <p>A nova legislação determina que todos os órgãos públicos, desde a administração federal até as prefeituras municipais, devem disponibilizar informações sobre seus gastos em tempo real, com atualização máxima de 24 horas para despesas acima de R$ 1.000. Para valores menores, o prazo é de 72 horas, representando um avanço significativo em relação à legislação anterior.</p>
          
          <p><strong>Entre as principais inovações estão:</strong></p>
          <ul>
          <li><strong>Portal Único Nacional:</strong> Criação de uma plataforma centralizada que reunirá informações de gastos de todos os órgãos públicos do país</li>
          <li><strong>Rastreabilidade Total:</strong> Cada real gasto terá um código único de rastreamento, permitindo acompanhar desde a liberação orçamentária até o pagamento final</li>
          <li><strong>Alertas Automáticos:</strong> Sistema de notificações para cidadãos que desejam acompanhar gastos específicos ou de determinados órgãos</li>
          <li><strong>Contratos Inteligentes:</strong> Obrigatoriedade de justificativa detalhada para contratações acima de R$ 10 mil, incluindo análise de economicidade</li>
          <li><strong>Penalidades Rigorosas:</strong> Multas de até R$ 50 mil para gestores que não cumprirem os prazos de divulgação</li>
          <li><strong>Dados Abertos:</strong> Informações em formato padronizado para facilitar análises por pesquisadores e desenvolvedores</li>
          </ul>
          
          <h2>Sistema de Controle Social Revolucionário</h2>
          
          <p>Uma das maiores inovações da lei é a criação do Sistema Nacional de Controle Social (SNCS), que permitirá que qualquer cidadão denuncie irregularidades diretamente através do portal, com garantia de apuração em até 30 dias. O sistema contará com inteligência artificial para identificar padrões suspeitos de gastos e alertar automaticamente os órgãos de controle.</p>
          
          <p>"O cidadão deixa de ser mero espectador para se tornar protagonista no controle dos gastos públicos", explica o professor Dr. João Santos, especialista em administração pública da Fundação Getúlio Vargas. "Esta lei coloca o Brasil na vanguarda mundial em termos de transparência governamental."</p>
          
          <h2>Impactos Esperados na Sociedade</h2>
          
          <p>Estudos realizados pelo Instituto Brasileiro de Pesquisa Aplicada (IBPA) estimam que a nova legislação pode gerar economia de até R$ 15 bilhões anuais apenas através da redução de irregularidades e melhoria na eficiência dos gastos públicos. O estudo analisou experiências similares em outros países e identificou reduções médias de 12% nos custos administrativos.</p>
          
          <p>A professora Dra. Ana Costa, da Universidade de São Paulo e especialista em combate à corrupção, avalia que "esta lei representa um divisor de águas na administração pública brasileira. A experiência internacional mostra que países com maior transparência apresentam índices significativamente menores de corrupção."</p>
          
          <p>Organizações da sociedade civil receberam a aprovação com entusiasmo. "Lutamos por esta lei durante mais de uma década. Finalmente o Brasil terá instrumentos eficazes para que a população fiscalize seus representantes", declarou Carlos Oliveira, presidente da Transparência Brasil.</p>
          
          <h2>Desafios de Implementação</h2>
          
          <p>Apesar da aprovação unânime nos aspectos gerais, especialistas alertam para os desafios de implementação. A lei exigirá investimentos significativos em tecnologia e capacitação de servidores, especialmente em municípios menores. O governo federal já anunciou a destinação de R$ 2 bilhões para apoiar a adequação dos sistemas em todo o país.</p>
          
          <p>"A lei é excelente, mas sua efetividade dependerá da vontade política de gestores locais e da capacidade técnica dos órgãos", pondera a auditora federal Maria Santos, que participou da elaboração do projeto. "Por isso incluímos mecanismos de apoio técnico e financeiro para garantir a implementação."</p>
          
          <h2>Cronograma de Implementação</h2>
          
          <p>A lei entra em vigor em 90 dias para órgãos federais, 180 dias para estados e 12 meses para municípios, com prazos diferenciados baseados no porte populacional. O governo federal já criou uma força-tarefa com 500 especialistas para auxiliar na transição e oferecerá cursos gratuitos de capacitação.</p>
          
          <p>Durante o período de transição, serão realizadas avaliações mensais do andamento da implementação, com relatórios públicos sobre o progresso de cada órgão. "Queremos que a própria implementação seja um exemplo de transparência", afirma o ministro da Transparência, Pedro Almeida.</p>
          
          <h2>Perspectivas Futuras</h2>
          
          <p>Especialistas internacionais já demonstraram interesse em estudar o modelo brasileiro. O Banco Mundial anunciou que acompanhará a implementação como possível referência para outros países em desenvolvimento. "O Brasil tem potencial de se tornar referência mundial em transparência pública", avalia James Thompson, especialista do organismo internacional.</p>
          
          <p>A expectativa é que a lei inspire mudanças em outros países da América Latina. Delegações do Chile, Colômbia e Argentina já agendaram visitas técnicas para conhecer o modelo brasileiro ainda durante o processo de implementação.</p>
        `,
        suggestedCategory: 'Política',
        keywords: ['transparência', 'política', 'governo', 'corrupção', 'controle social', 'democracia']
      },
      'Esportes': {
        title: 'Revolução no Futebol Regional: Campeonato Estadual Revela Geração de Ouro e Transforma Cenário Esportivo Nacional',
        excerpt: 'Torneio local apresenta talentos excepcionais que chamam atenção internacional, enquanto programas inovadores de formação estabelecem novo padrão de desenvolvimento esportivo no país.',
        content: `
          <p>O Campeonato Estadual de Futebol de 2024 está se consolidando como um marco na história do esporte nacional, revelando uma geração de talentos que promete redefinir o cenário futebolístico brasileiro. Com números recordes de público, investimento e qualidade técnica, o torneio tem atraído olheiros de grandes clubes nacionais e internacionais, confirmando o sucesso dos programas de desenvolvimento esportivo implementados nos últimos cinco anos.</p>
          
          <p>Dados oficiais da Federação Estadual de Futebol mostram que o campeonato atual registra média de público 47% superior ao ano anterior, com 23.000 espectadores por partida. Mais impressionante ainda é o fato de que 78% dos jogadores titulares dos 16 times participantes são produtos das categorias de base regionais, um índice sem precedentes na competição.</p>
          
          <h2>Os Destaques da Nova Geração</h2>
          
          <p>Entre os nomes mais promissores está João Silva Santos, atacante de 19 anos do Atlético Local, que já marcou 18 gols em 12 partidas e recebeu propostas de clubes europeus. "João tem características únicas: velocidade excepcional, finalização precisa e uma maturidade tática impressionante para sua idade", analisa Carlos Mendes, técnico com 25 anos de experiência que já revelou outros talentos para o futebol nacional.</p>
          
          <p>Mas João não é caso isolado. O meio-campista Lucas Oliveira, de 20 anos, do Esporte Clube Regional, já despertou interesse do Real Madrid e do Manchester City. "Lucas tem uma visão de jogo excepcional e técnica refinada. Raramente vemos um jovem com tamanha capacidade de leitura do jogo", afirma Roberto Silva, ex-técnico da seleção brasileira sub-20 e atual coordenador técnico da federação.</p>
          
          <p>A zaga também tem seus destaques. Pedro Almeida, de 18 anos, capitão do Juventude FC, já foi convocado para a seleção brasileira sub-20 e é cotado como futuro titular da seleção principal. "Pedro combina força física, velocidade e inteligência tática. Tem perfil de líder nato", observa Ana Costa, primeira mulher a ocupar cargo de coordenadora técnica na federação.</p>
          
          <h2>Revolução nos Programas de Formação</h2>
          
          <p>O sucesso da atual geração não é coincidência. Nos últimos cinco anos, os clubes regionais investiram R$ 45 milhões em programas de desenvolvimento, criando uma estrutura de formação que combina treinamento esportivo de alto nível com educação formal obrigatória.</p>
          
          <p>O programa "Futebol e Futuro", pioneiro no país, já formou mais de 350 jovens nos últimos três anos. Destes, 45% conseguiram contratos profissionais, 30% receberam bolsas universitárias e 25% foram absorvidos como técnicos ou em outras funções no esporte. "Nosso objetivo nunca foi apenas formar jogadores, mas cidadãos completos", explica Maria Santos, coordenadora pedagógica do programa.</p>
          
          <p>A metodologia inclui treinos técnicos diários, preparação física especializada, acompanhamento psicológico, ensino de idiomas e gestão financeira. "Preparamos os jovens para o sucesso dentro e fora dos campos", destaca Dr. José Almeida, psicólogo esportivo que acompanha os atletas desde os 14 anos.</p>
          
          <h2>Estrutura e Investimentos</h2>
          
          <p>A transformação do cenário regional contou com investimentos públicos e privados. O governo estadual destinou R$ 120 milhões para construção e reforma de centros de treinamento, enquanto a iniciativa privada contribuiu com R$ 80 milhões em patrocínios e parcerias.</p>
          
          <p>"Entendemos que investir no esporte é investir no desenvolvimento social e econômico da região", afirma o governador estadual. "Os resultados mostram que estávamos no caminho certo."</p>
          
          <p>Os novos centros de treinamento incluem campos com grama sintética de última geração, academia de musculação, piscina semiolímpica, centro médico completo e residência estudantil para atletas do interior. "Oferecemos condições similares às dos grandes centros urbanos", orgulha-se Marcos Silva, diretor do principal centro de formação.</p>
          
          <h2>Interesse Internacional</h2>
          
          <p>O sucesso do modelo regional atraiu atenção internacional. Olheiros de clubes como Barcelona, Bayern de Munique, Paris Saint-Germain e Juventus já visitaram a região nos últimos seis meses. "É impressionante a qualidade técnica e a formação integral destes jovens", comenta Pierre Dubois, scout do Paris Saint-Germain.</p>
          
          <p>Três jogadores já assinaram pré-contratos com clubes europeus, com transferências previstas para janeiro de 2025. Os valores envolvidos podem superar R$ 50 milhões, recursos que serão reinvestidos nos programas de formação.</p>
          
          <h2>Impacto Econômico e Social</h2>
          
          <p>O desenvolvimento do futebol regional gerou impactos que transcendem o esporte. Estudos da universidade local indicam que o setor movimenta R$ 200 milhões anuais na economia regional, gerando 3.500 empregos diretos e indiretos.</p>
          
          <p>"O futebol se tornou um vetor de desenvolvimento regional", analisa a economista Dra. Laura Pereira. "Além dos empregos diretos, temos o desenvolvimento do turismo esportivo, valorização imobiliária e fortalecimento da marca da região."</p>
          
          <p>O programa também contribuiu para redução da criminalidade juvenil. Dados da Secretaria de Segurança mostram queda de 35% nos índices de violência envolvendo jovens de 14 a 20 anos nas áreas cobertas pelos centros de treinamento.</p>
          
          <h2>Desafios e Perspectivas Futuras</h2>
          
          <p>Apesar dos sucessos, os gestores reconhecem desafios. "O principal é manter a qualidade com o crescimento da demanda", pondera Carlos Mendes. "Recebemos mais de mil inscrições por mês, mas temos capacidade limitada."</p>
          
          <p>Para 2025, estão previstos investimentos adicionais de R$ 30 milhões para expansão da capacidade dos centros. Também está em análise a criação de uma liga regional profissional, que seria a primeira do gênero no país.</p>
          
          <p>"Nossa meta é que em cinco anos pelo menos 20 jogadores formados aqui estejam atuando na seleção brasileira principal", revela Roberto Silva. "Com a qualidade que estamos vendo, isso não é apenas um sonho, é uma projeção realista."</p>
        `
      }
    };

    const categoryDefault = mockArticles[request.category as keyof typeof mockArticles];
    
    if (categoryDefault) {
      return {
        ...categoryDefault,
        suggestedCategory: request.category,
        keywords: ['transparência', 'política', 'governo'] // exemplo
      };
    }

    // Mock específico quando não há provedor configurado
    const ideaLower = request.idea.toLowerCase();
    if (/game|games|jogo|jogos/.test(ideaLower)) {
      return {
        title: 'Unity, Unreal, Godot e mais: ferramentas de criação de jogos em 2025',
        excerpt: 'Comparativo prático entre os motores mais usados — custos, curva de aprendizado e onde cada um se destaca.',
        content: `
          <h2>Principais motores em 2025</h2>
          <ul>
            <li><strong>Unity 2023.3</strong> — Licença gratuita para indies (até US$ 100k de receita); forte em mobile e 2D; grande ecossistema de assets. Linguagem: C#.</li>
            <li><strong>Unreal Engine 5.4</strong> — Gratuito com 5% de royalty acima de US$ 1 milhão; gráficos AAA (Nanite/Lumen); ideal para PC/console. Linguagem: Blueprints/C++.</li>
            <li><strong>Godot 4.3</strong> — Open-source, sem royalties; ótimo para 2D e 3D leves; comunidade crescente. Linguagens: GDScript/C#.</li>
            <li><strong>Construct 3</strong> — Baseado em navegador; foco em 2D casual; exporta para web e mobile. Assinatura mensal.</li>
            <li><strong>RPG Maker MZ</strong> — Voltado a RPGs 2D; fluxo visual de eventos; ideal para iniciantes.</li>
          </ul>
          <h3>Curva de aprendizado</h3>
          <p>Para começar rápido em 2D: Godot ou Construct. Para gráficos avançados e mercado profissional: Unreal. Para multiplataforma com bom equilíbrio: Unity.</p>
          <h3>Custos</h3>
          <ul>
            <li>Unity: plano gratuito até atingir o limite de receita; planos Pro/Enterprise para estúdios.</li>
            <li>Unreal: sem custo inicial; 5% de royalty após US$ 1M por título.</li>
            <li>Godot: gratuito/open-source.</li>
            <li>Construct 3: assinatura mensal/anual.</li>
            <li>RPG Maker MZ: licença única.</li>
          </ul>
          <h3>Quando usar qual</h3>
          <ul>
            <li><strong>Mobile 2D</strong>: Unity, Godot, Construct</li>
            <li><strong>PC/Console AAA</strong>: Unreal Engine 5</li>
            <li><strong>Indie 3D leve</strong>: Godot 4, Unity</li>
            <li><strong>RPG 2D</strong>: RPG Maker MZ</li>
          </ul>
          <h3>Exemplos e recursos</h3>
          <p>Procure os templates oficiais e marketplaces (Unity Asset Store, Unreal Marketplace, Godot Asset Library) para acelerar protótipos.</p>
        `,
        suggestedCategory: request.category || 'Tecnologia',
        keywords: ['Unity', 'Unreal Engine 5', 'Godot', 'Construct 3', 'RPG Maker']
      };
    }

    return {
      title: `Guia técnico 2025: principais pontos sobre ${request.idea}`,
      excerpt: `Resumo prático e objetivo sobre ${request.idea}, com foco em ferramentas, custos e aplicações reais.`,
      content: `
        <h2>O que saber primeiro</h2>
        <p>Visão geral direta, sem jargões desnecessários, destacando ferramentas, custos típicos e casos de uso.</p>
        <h2>Ferramentas e players</h2>
        <p>Cite sempre nomes e versões quando relevantes. Evite generalidades e instituições fictícias.</p>
        <h2>Custos e limitações</h2>
        <p>Valores aproximados, quando disponíveis publicamente. Se não houver dados, seja neutro.</p>
        <h2>Boas práticas</h2>
        <ul>
          <li>Referências oficiais e documentação</li>
          <li>Comunidades ativas e suporte</li>
          <li>Roadmaps públicos e frequência de updates</li>
        </ul>
      `,
      suggestedCategory: request.category,
      keywords: []
    };
  }
}

export default AIArticleGenerator;