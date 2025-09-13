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

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async generateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    // Se não tiver API key, usar conteúdo simulado para demonstração
    if (!this.apiKey) {
      return this.generateMockArticle(request);
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um jornalista experiente especializado em escrever matérias completas e bem estruturadas. Sempre escreva em português brasileiro com linguagem jornalística profissional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Nenhum conteúdo foi gerado pela IA');
      }

      return this.parseGeneratedContent(content, request);
    } catch (error) {
      console.error('Erro ao gerar artigo com IA:', error);
      throw new Error('Falha ao gerar artigo. Tente novamente.');
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
Você é um jornalista especializado que deve criar um artigo TÉCNICO e ESPECÍFICO sobre: "${request.idea}"

INSTRUÇÕES CRÍTICAS:
1. SEJA EXTREMAMENTE ESPECÍFICO: Cite nomes reais de ferramentas, empresas, versões, preços, datas
2. EVITE GENERALIDADES: Nada de "especialistas afirmam" ou "dados mostram" - seja concreto
3. INFORMAÇÕES PRÁTICAS: Foque no que é útil, verificável e aplicável
4. ESTRUTURA JORNALÍSTICA: Use subtítulos (H2, H3) para organizar claramente

Especificações do artigo:
- Categoria: ${request.category}
- Abordagem: ${toneMap[request.tone || 'formal']}
- Extensão: ${lengthMap[request.length || 'medio']}

ESTRUTURA OBRIGATÓRIA:
1. **Título**: Específico e técnico (máximo 60 caracteres)
2. **Lead**: 2-3 frases com a informação principal
3. **Introdução**: O que é, para que serve, contexto atual
4. **Desenvolvimento**: 
   - Ferramentas/métodos específicos com nomes e versões
   - Comparações práticas entre opções
   - Dados concretos: preços, recursos, limitações
   - Exemplos reais de uso ou aplicação
5. **Conclusão**: Recomendações práticas e próximos passos

EXEMPLOS DE CONTEÚDO ESPECÍFICO:
- Se for sobre programação: cite linguagens (Python 3.12), frameworks (React 18), IDEs (VS Code)
- Se for sobre games: motores específicos (Unity 2023.3, Unreal Engine 5), plataformas
- Se for sobre design: softwares (Photoshop CC 2024, Figma, Canva Pro), recursos
- Se for sobre negócios: ferramentas (Slack, Notion, Google Workspace), preços, funcionalidades

PROIBIDO:
❌ "Especialistas debatem"
❌ "Dados mostram tendência"
❌ "Mercado em transformação"
❌ "Tecnologia revolucionária"
❌ Análises genéricas sem dados concretos

Retorne JSON válido:
{
  "title": "Título específico e técnico",
  "excerpt": "Lead direto com informação principal (2-3 frases)",
  "content": "Artigo completo em HTML com <h2>, <h3>, <p>, <strong>, <ul>, <li>",
  "suggestedCategory": "${request.category}",
  "keywords": ["termo-técnico-1", "ferramenta-específica", "categoria-relevante"]
}

FOQUE EM: Informações concretas, nomes específicos, dados verificáveis e utilidade prática.
`;
  }

  private parseGeneratedContent(content: string, request: ArticleGenerationRequest): GeneratedArticle {
    try {
      // Tentar fazer parse do JSON
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      return {
        title: parsed.title || 'Título Gerado pela IA',
        excerpt: parsed.excerpt || 'Resumo gerado pela IA',
        content: parsed.content || '<p>Conteúdo gerado pela IA</p>',
        suggestedCategory: parsed.suggestedCategory || request.category,
        keywords: parsed.keywords || []
      };
    } catch (error) {
      console.error('Erro ao fazer parse do conteúdo gerado:', error);
      // Fallback: tentar extrair manualmente
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

    return {
      title: `Análise Completa: ${request.idea} e Seus Impactos Transformadores na Sociedade Contemporânea`,
      excerpt: `Uma investigação aprofundada sobre ${request.idea}, explorando suas múltiplas dimensões, consequências socioeconômicas e perspectivas futuras para o desenvolvimento nacional.`,
      content: `
        <p>A questão sobre ${request.idea} emergiu como um dos temas mais relevantes e complexos da atualidade, demandando análise criteriosa de suas múltiplas facetas e implicações para a sociedade brasileira. Este fenômeno tem gerado debates intensos entre especialistas, formuladores de políticas públicas e diferentes segmentos da população, evidenciando sua importância estratégica para o desenvolvimento nacional.</p>
        
        <h2>Contexto Histórico e Evolução</h2>
        <p>Para compreender adequadamente ${request.idea}, é fundamental analisar sua evolução histórica e os fatores que culminaram na situação atual. As raízes desta questão remontam às transformações socioeconômicas das últimas décadas, quando mudanças estruturais na economia global e local criaram novas demandas e desafios.</p>
        
        <p>Especialistas do Instituto Brasileiro de Pesquisa Aplicada (IBPA) identificaram cinco fases distintas neste processo evolutivo, cada uma caracterizada por marcos específicos e mudanças de paradigma que moldaram o cenário atual. A compreensão destes períodos é crucial para projetar cenários futuros e desenvolver estratégias eficazes.</p>
        
        <h2>Análise Multidimensional dos Impactos</h2>
        <p>Os impactos de ${request.idea} transcendem fronteiras setoriais, afetando simultaneamente aspectos econômicos, sociais, ambientais e tecnológicos. Estudos conduzidos pela Fundação Getúlio Vargas revelam que esta questão influencia diretamente mais de 15 setores da economia nacional, com efeitos cascata que se estendem por toda a cadeia produtiva.</p>
        
        <p>Do ponto de vista econômico, as transformações já mobilizam investimentos superiores a R$ 50 bilhões anuais, envolvendo tanto recursos públicos quanto privados. Este montante representa aproximadamente 0,6% do PIB nacional e demonstra a magnitude econômica da questão.</p>
        
        <h3>Dimensão Social e Cultural</h3>
        <p>Na esfera social, ${request.idea} tem promovido mudanças significativas nos padrões de comportamento e expectativas da população. Pesquisas do Instituto DataFolha indicam que 67% dos brasileiros consideram este tema prioritário para suas vidas cotidianas, evidenciando seu impacto direto no tecido social.</p>
        
        <p>As comunidades mais afetadas têm desenvolvido estratégias adaptativas inovadoras, criando redes de apoio mútuo e iniciativas colaborativas que demonstram a resiliência e criatividade do povo brasileiro diante dos desafios contemporâneos.</p>
        
        <h2>Perspectivas de Especialistas</h2>
        <p>"${request.idea} representa um ponto de inflexão na história contemporânea brasileira", avalia o Dr. Roberto Silva, professor titular de Sociologia da Universidade de São Paulo e coordenador do Observatório Nacional de Tendências Sociais. "Suas ramificações se estendem muito além do que inicialmente imaginávamos."</p>
        
        <p>A Dra. Maria Santos, economista chefe do Instituto de Pesquisa Econômica Aplicada, complementa esta visão: "Os dados que temos coletado nos últimos 24 meses indicam transformações estruturais que permanecerão relevantes por pelo menos uma década."</p>
        
        <h2>Cenários Futuros e Projeções</h2>
        <p>Modelos de projeção desenvolvidos por centros de pesquisa nacionais e internacionais sugerem três cenários principais para a evolução de ${request.idea} nos próximos cinco anos. O cenário mais provável, segundo 78% dos especialistas consultados, aponta para consolidação gradual com impactos crescentes em diversos setores.</p>
        
        <p>No cenário otimista, que tem probabilidade de 15%, haveria aceleração significativa dos benefícios, com resultados superiores às expectativas atuais. Já o cenário pessimista, com 7% de probabilidade, prevê desafios adicionais que poderiam retardar os progressos esperados.</p>
        
        <h2>Recomendações e Estratégias</h2>
        <p>Diante da complexidade e importância de ${request.idea}, especialistas recomendam abordagem integrada envolvendo múltiplos atores sociais. É fundamental estabelecer diálogo constructivo entre governo, iniciativa privada, academia e organizações da sociedade civil para maximizar benefícios e mitigar riscos potenciais.</p>
        
        <p>As estratégias mais promissoras incluem investimentos em capacitação, desenvolvimento de marcos regulatórios adequados, incentivos à inovação e criação de mecanismos de monitoramento e avaliação contínua dos resultados obtidos.</p>
        
        <h2>Conclusões e Perspectivas</h2>
        <p>A análise de ${request.idea} revela questão de alta complexidade que demanda atenção continuada e ação coordenada de diferentes setores. Os desafios identificados são significativos, mas as oportunidades de desenvolvimento e progresso social são ainda maiores.</p>
        
        <p>O sucesso na abordagem desta questão dependerá da capacidade de mobilizar recursos, conhecimento e vontade política necessários para implementar soluções inovadoras e sustentáveis. A experiência brasileira neste campo pode servir de referência para outros países enfrentando desafios similares, consolidando o país como líder regional em desenvolvimento de soluções criativas para problemas contemporâneos.</p>
      `,
      suggestedCategory: request.category,
      keywords: []
    };
  }
}

export default AIArticleGenerator;