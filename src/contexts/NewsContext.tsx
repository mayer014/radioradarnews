import React, { createContext, useContext, useState, useCallback } from 'react';

// Helper function to check if a columnist is active
const isColumnistActive = (columnistId: string): boolean => {
  try {
    const usersData = localStorage.getItem('users_store');
    if (usersData) {
      const users = JSON.parse(usersData);
      const columnist = users.find((u: any) => u.id === columnistId && u.role === 'colunista');
      return columnist?.columnistProfile?.isActive ?? false;
    }
  } catch (error) {
    console.error('Error checking columnist status:', error);
  }
  return false;
};

// Helper function to filter out articles from inactive columnists
export const filterActiveColumnistArticles = (articles: NewsArticle[]): NewsArticle[] => {
  return articles.filter(article => {
    if (article.columnist) {
      return isColumnistActive(article.columnist.id);
    }
    return true; // Non-columnist articles are always shown
  });
};

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featuredImage: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  source_url?: string;
  source_domain?: string;
  comments: number;
  featured: boolean;
  isDraft?: boolean;
  isColumnCopy?: boolean; // Indica se é uma cópia para a coluna do colunista
  originalArticleId?: string; // ID do artigo original (quando é uma cópia)
  columnist?: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    specialty: string;
  };
}

export const BASE_NEWS_CATEGORIES = [
  'Política',
  'Policial',
  'Entretenimento',
  'Internacional',
  'Esportes',
  'Tecnologia / Economia',
  'Ciência / Saúde'
];

export const getColumnistCategories = (): string[] => {
  try {
    const usersData = localStorage.getItem('users_store');
    if (usersData) {
      const users = JSON.parse(usersData);
      const activeColumnists = users.filter((u: any) => u.role === 'colunista' && u.columnistProfile?.isActive);
      return activeColumnists.map((c: any) => `Coluna ${c.name}`);
    }
  } catch (error) {
    console.error('Error loading columnist categories:', error);
  }
  return [];
};

export const NEWS_CATEGORIES = [...BASE_NEWS_CATEGORIES, ...getColumnistCategories()];

interface NewsContextType {
  articles: NewsArticle[];
  addArticle: (article: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'comments'>, currentUserId?: string) => void;
  updateArticle: (id: string, article: Partial<NewsArticle>) => void;
  deleteArticle: (id: string) => void;
  getArticleById: (id: string) => NewsArticle | undefined;
  getArticlesByCategory: (category: string) => NewsArticle[];
  getArticlesByColumnist: (columnistId: string) => NewsArticle[];
  getColumnistById: (columnistId: string) => NewsArticle['columnist'] | undefined;
  incrementViews: (id: string) => void;
  toggleFeaturedArticle: (id: string, currentUserId?: string) => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

// Matérias de exemplo - 5 por categoria
const defaultArticles: NewsArticle[] = [
  // POLÍTICA (5 matérias)
  {
    id: '1',
    title: 'CPI investiga irregularidades em contratos da prefeitura',
    content: '<p>A Comissão Parlamentar de Inquérito instaurada na Câmara Municipal iniciou os trabalhos de investigação de possíveis irregularidades em contratos firmados pela prefeitura nos últimos dois anos. Os vereadores querem esclarecer denúncias de superfaturamento em obras públicas.</p><p>Segundo o relatório preliminar, foram identificadas discrepâncias em pelo menos cinco contratos, totalizando mais de R$ 2 milhões em valores questionáveis.</p>',
    excerpt: 'Comissão Parlamentar de Inquérito descobre superfaturamento em obras públicas no valor de R$ 2 milhões.',
    category: 'Política',
    featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a08b?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    views: 3420,
    comments: 89,
    featured: true
  },
  {
    id: '2',
    title: 'Vereador propõe novo projeto de lei para mobilidade urbana',
    content: '<p>O vereador João Silva apresentou na sessão desta terça-feira um projeto de lei que prevê a criação de novas ciclovias e melhorias no transporte público municipal. A proposta visa reduzir o trânsito e incentivar meios de transporte sustentáveis.</p><p>O projeto será analisado pelas comissões de Trânsito e Meio Ambiente antes de ir a votação.</p>',
    excerpt: 'Projeto de lei propõe criação de ciclovias e melhorias no transporte público para combater trânsito.',
    category: 'Política',
    featuredImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    views: 2150,
    comments: 45,
    featured: false
  },
  {
    id: '3',
    title: 'Prefeito anuncia reforma administrativa na prefeitura',
    content: '<p>O prefeito municipal anunciou ontem uma ampla reforma na estrutura administrativa da prefeitura, com o objetivo de modernizar os serviços e melhorar o atendimento à população. As mudanças devem começar a ser implementadas no próximo mês.</p><p>A reforma inclui a digitalização de processos e a criação de novos canais de atendimento online.</p>',
    excerpt: 'Reforma administrativa da prefeitura visa modernizar serviços e melhorar atendimento à população.',
    category: 'Política',
    featuredImage: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6b696?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    views: 1890,
    comments: 32,
    featured: false
  },
  {
    id: '4',
    title: 'Câmara aprova orçamento municipal para 2025',
    content: '<p>Por unanimidade, a Câmara Municipal aprovou o orçamento para 2025, que prevê investimentos de R$ 180 milhões em diversas áreas. A educação recebeu a maior fatia dos recursos, seguida pela saúde e infraestrutura.</p><p>Os recursos serão destinados principalmente para construção de novas escolas e reforma de unidades de saúde.</p>',
    excerpt: 'Orçamento de R$ 180 milhões para 2025 é aprovado com prioridade para educação e saúde.',
    category: 'Política',
    featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    views: 2780,
    comments: 67,
    featured: true
  },
  {
    id: '5',
    title: 'Secretário de obras responde sobre atrasos em projetos',
    content: '<p>O secretário municipal de obras, Carlos Mendes, prestou esclarecimentos na Câmara sobre os atrasos em importantes projetos da cidade. Segundo ele, problemas climáticos e burocráticos foram os principais fatores para os adiamentos.</p><p>O secretário garantiu que as obras serão retomadas nas próximas semanas com cronograma atualizado.</p>',
    excerpt: 'Secretário explica atrasos em obras públicas e garante retomada dos projetos nas próximas semanas.',
    category: 'Política',
    featuredImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    views: 1650,
    comments: 28,
    featured: false
  },

  // POLICIAL (5 matérias)
  {
    id: '6',
    title: 'Operação policial prende quadrilha de tráfico de drogas',
    content: '<p>A Polícia Civil deflagrou na madrugada desta quinta-feira a Operação "Cidade Limpa", que resultou na prisão de oito suspeitos de integrar uma organização criminosa especializada no tráfico de drogas na região central da cidade.</p><p>Foram apreendidos 15 kg de drogas, R$ 50 mil em dinheiro e três veículos utilizados no transporte das substâncias.</p>',
    excerpt: 'Operação prende 8 suspeitos de tráfico e apreende 15kg de drogas na região central.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    views: 4250,
    comments: 95,
    featured: true
  },
  {
    id: '7',
    title: 'PM intensifica patrulhamento em bairros periféricos',
    content: '<p>A Polícia Militar anunciou o reforço no patrulhamento dos bairros periféricos da cidade após aumento nos índices de criminalidade na região. A medida faz parte do programa "Bairro Seguro" lançado pela Secretaria de Segurança.</p><p>Serão disponibilizadas quatro viaturas extras para atender especificamente essas áreas durante 24 horas.</p>',
    excerpt: 'PM reforça segurança em bairros periféricos com programa "Bairro Seguro" e viaturas extras.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    views: 1950,
    comments: 41,
    featured: false
  },
  {
    id: '8',
    title: 'Delegacia registra queda de 20% nos furtos na região central',
    content: '<p>Dados da Delegacia Regional mostram uma redução significativa de 20% nos casos de furto na região central da cidade nos últimos três meses. O resultado é atribuído ao aumento da videovigilância e policiamento ostensivo.</p><p>O delegado titular destacou a importância da colaboração da população nas denúncias e no combate à criminalidade.</p>',
    excerpt: 'Furtos na região central caem 20% graças ao aumento da videovigilância e policiamento.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1591386661848-6d33b8c676c8?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    views: 2890,
    comments: 52,
    featured: false
  },
  {
    id: '9',
    title: 'Polícia Civil esclarece homicídio ocorrido na semana passada',
    content: '<p>A Polícia Civil divulgou os detalhes da investigação do homicídio que ocorreu no bairro São José na semana passada. O principal suspeito foi identificado e está sendo procurado pelas autoridades.</p><p>Segundo o delegado responsável pelo caso, a motivação foi acerto de contas relacionado a dívidas. A família da vítima colabora com as investigações.</p>',
    excerpt: 'Polícia identifica suspeito de homicídio no bairro São José e aponta acerto de contas como motivo.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    views: 3650,
    comments: 78,
    featured: true
  },
  {
    id: '10',
    title: 'Blitz da Lei Seca apreende 15 condutores embriagados',
    content: '<p>A operação Lei Seca realizada no último fim de semana resultou na abordagem de 480 veículos e apreensão de 15 condutores que estavam dirigindo sob efeito de álcool. A blitz aconteceu em pontos estratégicos da cidade.</p><p>Os motoristas tiveram as carteiras apreendidas e os veículos foram encaminhados ao pátio municipal. Além das infrações de trânsito, alguns casos foram registrados como crime.</p>',
    excerpt: 'Blitz da Lei Seca aborda 480 veículos e apreende 15 motoristas embriagados no fim de semana.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    views: 2340,
    comments: 63,
    featured: false
  },

  // ENTRETENIMENTO (5 matérias)
  {
    id: '11',
    title: 'Festival de música reúne 10 mil pessoas no centro da cidade',
    content: '<p>O Festival "Música na Praça" encerrou sua terceira edição com grande sucesso, reunindo mais de 10 mil pessoas na Praça Central durante os três dias de evento. Artistas locais e regionais se apresentaram em dois palcos montados especialmente para o festival.</p><p>A programação incluiu diversos estilos musicais, desde MPB até rock alternativo, agradando todos os públicos que compareceram ao evento gratuito.</p>',
    excerpt: 'Festival "Música na Praça" atrai 10 mil pessoas com shows gratuitos de artistas locais e regionais.',
    category: 'Entretenimento',
    featuredImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    views: 5200,
    comments: 124,
    featured: true
  },
  {
    id: '12',
    title: 'Cinema local exibe filmes nacionais durante toda a semana',
    content: '<p>O Cine Municipal promove esta semana a "Mostra do Cinema Brasileiro" com exibições gratuitas de filmes nacionais premiados. A programação inclui produções recentes e clássicos do cinema nacional.</p><p>As sessões acontecem todos os dias às 19h30 e a entrada é gratuita mediante retirada de ingresso na bilheteria a partir das 18h.</p>',
    excerpt: 'Cine Municipal promove Mostra do Cinema Brasileiro com filmes nacionais e entrada gratuita.',
    category: 'Entretenimento',
    featuredImage: 'https://images.unsplash.com/photo-1489599843700-6130c12c498a?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    views: 1750,
    comments: 35,
    featured: false
  },
  {
    id: '13',
    title: 'Teatro municipal apresenta peça clássica com elenco local',
    content: '<p>O Teatro Municipal estreia nesta sexta-feira a peça "Morte e Vida Severina", de João Cabral de Melo Neto, com direção de Marina Santos e elenco formado integralmente por artistas da região.</p><p>As apresentações acontecem de sexta a domingo, sempre às 20h, com ingressos a preços populares. A montagem conta com cenografia especial e trilha sonora original.</p>',
    excerpt: 'Teatro Municipal estreia "Morte e Vida Severina" com elenco local e ingressos populares.',
    category: 'Entretenimento',
    featuredImage: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    views: 2100,
    comments: 48,
    featured: false
  },
  {
    id: '14',
    title: 'Artista da região lança novo álbum e faz show de lançamento',
    content: '<p>O cantor e compositor Pedro Oliveira, natural da cidade, lança seu terceiro álbum "Caminhos do Interior" com show especial no Centro Cultural. O evento marca o retorno do artista à sua cidade natal após turnê nacional.</p><p>O álbum traz 12 faixas autorais que retratam a vida no interior e conta com participações especiais de outros músicos da região.</p>',
    excerpt: 'Pedro Oliveira lança álbum "Caminhos do Interior" com show especial no Centro Cultural.',
    category: 'Entretenimento',
    featuredImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    views: 3200,
    comments: 87,
    featured: false
  },
  {
    id: '15',
    title: 'Carnaval 2025: prefeitura divulga programação oficial',
    content: '<p>A Secretaria de Cultura divulgou a programação oficial do Carnaval 2025, que acontecerá entre os dias 28 de fevereiro e 4 de março. Este ano, o evento contará com 15 blocos inscritos e três dias de desfiles na Avenida Principal.</p><p>A novidade fica por conta do "Carnaval Infantil" que acontecerá no sábado pela manhã, com atividades especiais para as crianças e suas famílias.</p>',
    excerpt: 'Carnaval 2025 terá 15 blocos, três dias de desfiles e novidade do Carnaval Infantil.',
    category: 'Entretenimento',
    featuredImage: 'https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    views: 4100,
    comments: 156,
    featured: true
  },

  // COLUNA ANA COSTA (5 matérias)
  {
    id: 'ana-1',
    title: 'Mercado financeiro: oportunidades e riscos em 2025',
    content: '<p>O cenário econômico brasileiro para 2025 apresenta desafios únicos que exigem atenção dos investidores. Com as mudanças na política monetária e os ajustes fiscais, observamos um mercado em transição que oferece tanto oportunidades quanto riscos significativos.</p><p>É fundamental que os investidores mantenham uma estratégia diversificada e acompanhem de perto os indicadores macroeconômicos para tomar decisões informadas neste ambiente volátil.</p>',
    excerpt: 'Ana Costa analisa as perspectivas do mercado financeiro brasileiro e as melhores estratégias para investidores.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    views: 3420,
    comments: 89,
    featured: false,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },
  {
    id: 'ana-2',
    title: 'Inflação e poder de compra: impactos na economia familiar',
    content: '<p>A inflação continua sendo um dos principais desafios para as famílias brasileiras. Como economista, observo que o controle inflacionário vai muito além das políticas do Banco Central - envolve uma coordenação complexa entre governo, setor privado e sociedade.</p><p>É essencial que as famílias compreendam como proteger seu poder de compra através de estratégias financeiras adequadas e investimentos inteligentes que acompanhem a variação dos preços.</p>',
    excerpt: 'Ana Costa explica como a inflação afeta o orçamento familiar e apresenta estratégias de proteção financeira.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    views: 2150,
    comments: 67,
    featured: true,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },
  {
    id: 'ana-3',
    title: 'Educação financeira: construindo uma base sólida',
    content: '<p>Uma das maiores carências da população brasileira é a educação financeira. Muitos cidadãos não possuem conhecimentos básicos sobre gestão de recursos, investimentos e planejamento financeiro. Isso cria vulnerabilidades que podem comprometer o futuro financeiro das famílias.</p><p>Precisamos investir na formação financeira da população, criando programas educacionais que permitam decisões mais conscientes e planejamento de longo prazo para a construção de patrimônio.</p>',
    excerpt: 'Ana Costa destaca a importância da educação financeira para o desenvolvimento econômico pessoal e nacional.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1554224154-26032fced8bd?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    views: 1890,
    comments: 54,
    featured: false,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },
  {
    id: 'ana-4',
    title: 'Políticas econômicas e impacto social',
    content: '<p>As políticas econômicas do governo têm reflexos diretos na vida da população. Como analista financeira, acompanho de perto como as decisões macroeconômicas afetam desde o custo de vida até as oportunidades de emprego e renda.</p><p>É fundamental que haja transparência e debate público sobre essas políticas, permitindo que a sociedade compreenda os trade-offs envolvidos e participe de forma mais informada do processo democrático.</p>',
    excerpt: 'Ana Costa analisa como políticas econômicas impactam diretamente a vida dos cidadãos brasileiros.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    views: 2780,
    comments: 78,
    featured: false,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },
  {
    id: 'ana-5',
    title: 'Empreendedorismo feminino e economia',
    content: '<p>O empreendedorismo feminino tem sido um dos motores mais importantes da economia brasileira nos últimos anos. Mulheres empreendedoras têm criado soluções inovadoras e gerado empregos, contribuindo significativamente para o PIB nacional.</p><p>É fundamental que criemos um ambiente ainda mais favorável para que mais mulheres tenham acesso ao crédito, capacitação e oportunidades de mercado, fortalecendo esse setor que tem se mostrado tão resiliente e criativo.</p>',
    excerpt: 'Ana Costa discute o papel do empreendedorismo feminino no crescimento da economia brasileira.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    views: 3150,
    comments: 92,
    featured: false,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },

  // COLUNA JOÃO SANTOS (5 matérias)
  {
    id: 'joao-1',
    title: 'A evolução da segurança pública no interior',
    content: '<p>Durante meus anos como policial civil, pude observar de perto as transformações na segurança pública das cidades do interior. O que antes eram problemas pontuais, hoje se tornaram desafios complexos que exigem estratégias mais sofisticadas e integradas.</p><p>A proximidade com a comunidade sempre foi nossa maior força no interior. É essa relação de confiança que nos permite resolver casos e prevenir crimes de forma mais eficaz.</p>',
    excerpt: 'João Santos analisa as mudanças na segurança pública do interior baseado em sua experiência como policial civil.',
    category: 'Coluna João Santos',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    views: 4250,
    comments: 95,
    featured: true,
    columnist: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal.',
      specialty: 'Segurança Pública'
    }
  },
  {
    id: 'joao-2',
    title: 'Investigação criminal: técnicas e desafios modernos',
    content: '<p>A investigação criminal evoluiu drasticamente nas últimas décadas. Novas tecnologias trouxeram ferramentas poderosas, mas também novos desafios. Crimes cibernéticos, lavagem de dinheiro digital e outras modalidades exigem capacitação constante dos profissionais de segurança.</p><p>A experiência de campo continua sendo fundamental, mas deve ser complementada com conhecimento técnico atualizado e uso de tecnologias modernas de investigação.</p>',
    excerpt: 'João Santos explora como a tecnologia transformou a investigação criminal e os novos desafios enfrentados.',
    category: 'Coluna João Santos',
    featuredImage: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
    views: 1950,
    comments: 63,
    featured: false,
    columnist: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal.',
      specialty: 'Segurança Pública'
    }
  },
  {
    id: 'joao-3',
    title: 'Prevenção ao crime: o papel da comunidade',
    content: '<p>A prevenção ao crime não é responsabilidade apenas da polícia. A comunidade tem um papel fundamental na criação de um ambiente mais seguro. Programas de policiamento comunitário, que aproximam a força policial dos moradores, têm mostrado resultados excelentes.</p><p>Quando a população se sente parte da solução, os índices de criminalidade tendem a diminuir significativamente. É uma via de mão dupla que beneficia a todos.</p>',
    excerpt: 'João Santos destaca a importância da participação da comunidade na prevenção ao crime e na segurança pública.',
    category: 'Coluna João Santos',
    featuredImage: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 73).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 73).toISOString(),
    views: 2890,
    comments: 74,
    featured: false,
    columnist: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal.',
      specialty: 'Segurança Pública'
    }
  },
  {
    id: 'joao-4',
    title: 'Violência doméstica: um problema que exige atenção especial',
    content: '<p>Um dos casos mais delicados que enfrentei durante minha carreira foi o de violência doméstica. Esses crimes muitas vezes ficam em silêncio, protegidos pelas próprias vítimas que temem denunciar seus agressores.</p><p>É fundamental que a sociedade compreenda a gravidade dessa questão e que as vítimas saibam que podem contar com o apoio das autoridades. Criamos protocolos especiais para esses casos, sempre priorizando a proteção da vítima.</p>',
    excerpt: 'João Santos aborda a questão da violência doméstica e a importância de protocolos especiais de atendimento.',
    category: 'Coluna João Santos',
    featuredImage: 'https://images.unsplash.com/photo-1591386661848-6d33b8c676c8?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 97).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 97).toISOString(),
    views: 3650,
    comments: 108,
    featured: false,
    columnist: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal.',
      specialty: 'Segurança Pública'
    }
  },
  {
    id: 'joao-5',
    title: 'O futuro da segurança: tecnologia e humanização',
    content: '<p>Olhando para o futuro da segurança pública, vejo duas tendências importantes: o avanço da tecnologia e a necessidade de humanizar ainda mais o atendimento. Câmeras inteligentes, análise de dados e inteligência artificial são ferramentas valiosas.</p><p>Porém, nada substitui o fator humano na segurança pública. A empatia, a capacidade de diálogo e o conhecimento da realidade local continuam sendo nossos maiores ativos para construir uma sociedade mais segura.</p>',
    excerpt: 'João Santos reflete sobre o futuro da segurança pública, equilibrando tecnologia e humanização.',
    category: 'Coluna João Santos',
    featuredImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 121).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 121).toISOString(),
    views: 2340,
    comments: 85,
    featured: false,
    columnist: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal.',
      specialty: 'Segurança Pública'
    }
  },

  // INTERNACIONAL (5 matérias)
  {
    id: '16',
    title: 'Presidente americano anuncia nova política migratória',
    content: '<p>O presidente dos Estados Unidos anunciou ontem mudanças significativas na política migratória do país, com foco no fortalecimento das fronteiras e na criação de novos programas de integração para imigrantes legais.</p><p>As medidas devem afetar milhões de pessoas e já geraram reações diversas no Congresso americano e em organismos internacionais.</p>',
    excerpt: 'EUA anuncia mudanças na política migratória com foco em segurança nas fronteiras.',
    category: 'Internacional',
    featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a08b?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    views: 8900,
    comments: 234,
    featured: true
  },
  {
    id: '17',
    title: 'União Europeia aprova novo pacote de sanções contra Rússia',
    content: '<p>Os países membros da União Europeia aprovaram por unanimidade um novo pacote de sanções econômicas contra a Rússia, incluindo restrições adicionais ao setor energético e financeiro russo.</p><p>As medidas entram em vigor na próxima semana e visam pressionar Moscou a cessar as ações militares na Ucrânia.</p>',
    excerpt: 'UE aprova novas sanções contra Rússia com foco no setor energético e financeiro.',
    category: 'Internacional',
    featuredImage: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    views: 6750,
    comments: 187,
    featured: false
  },
  {
    id: '18',
    title: 'China e Japão retomam diálogo diplomático após tensões',
    content: '<p>Os ministros das Relações Exteriores da China e do Japão se reuniram em Pequim para retomar o diálogo diplomático entre os dois países, após meses de tensões relacionadas a questões territoriais no Mar da China Oriental.</p><p>O encontro marca uma mudança na abordagem diplomática e pode abrir caminho para a normalização das relações.</p>',
    excerpt: 'China e Japão retomam diálogo diplomático após meses de tensões territoriais.',
    category: 'Internacional',
    featuredImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    views: 4200,
    comments: 98,
    featured: false
  },
  {
    id: '19',
    title: 'Argentina enfrenta nova crise econômica com inflação em alta',
    content: '<p>A Argentina registrou nova alta na inflação mensal, alcançando 15,3% em janeiro e colocando o país novamente em situação de crise econômica. O governo anunciou medidas emergenciais para conter a espiral inflacionária.</p><p>As medidas incluem controle de preços de produtos básicos e negociações com o Fundo Monetário Internacional.</p>',
    excerpt: 'Argentina registra inflação de 15,3% e governo anuncia medidas emergenciais.',
    category: 'Internacional',
    featuredImage: 'https://images.unsplash.com/photo-1591019479261-1a103efb5b31?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    views: 5600,
    comments: 142,
    featured: false
  },
  {
    id: '20',
    title: 'França propõe nova lei de regulamentação da inteligência artificial',
    content: '<p>O parlamento francês aprovou em primeira votação uma proposta de lei que estabelece regras rigorosas para o desenvolvimento e uso de inteligência artificial no país, seguindo as diretrizes europeias para o setor.</p><p>A legislação prevê multas severas para empresas que não cumprirem os requisitos de transparência e segurança estabelecidos.</p>',
    excerpt: 'França aprova lei para regular inteligência artificial com regras rigorosas de transparência.',
    category: 'Internacional',
    featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    views: 3890,
    comments: 76,
    featured: true
  },

  // ESPORTES (5 matérias)
  {
    id: '21',
    title: 'Time local conquista título da liga regional de futebol',
    content: '<p>O Esporte Clube Cidade conquistou ontem o título da Liga Regional de Futebol após vencer o rival por 2x1 no estádio municipal. Esta é a terceira conquista do clube nos últimos cinco anos.</p><p>O artilheiro da equipe, João Santos, marcou os dois gols da vitória e foi eleito o melhor jogador da final. A festa da torcida se estendeu pelas ruas do centro da cidade.</p>',
    excerpt: 'Esporte Clube Cidade conquista terceiro título regional com vitória por 2x1 na final.',
    category: 'Esportes',
    featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    views: 7500,
    comments: 189,
    featured: true
  },
  {
    id: '22',
    title: 'Maratona da cidade bate recorde de participantes',
    content: '<p>A 10ª Maratona da Cidade bateu recorde de participação com 2.500 inscritos nas modalidades de 5km, 10km e 21km. O evento aconteceu no último domingo com largada na Praça Central.</p><p>O vencedor da prova principal foi o atleta local Carlos Ferreira, que completou os 21km em 1h15min, estabelecendo novo recorde da competição.</p>',
    excerpt: 'Maratona da Cidade registra recorde com 2.500 participantes e novo tempo na prova principal.',
    category: 'Esportes',
    featuredImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    views: 3200,
    comments: 67,
    featured: false
  },
  {
    id: '23',
    title: 'Atleta da cidade se classifica para campeonato nacional de natação',
    content: '<p>A nadadora Júlia Santos, de apenas 16 anos, conquistou a classificação para o Campeonato Nacional de Natação após quebrar o recorde estadual juvenil nos 100m livre durante competição em São Paulo.</p><p>Júlia treina na piscina municipal desde os 8 anos e é considerada uma das maiores promessas da natação regional.</p>',
    excerpt: 'Nadadora de 16 anos quebra recorde estadual e se classifica para campeonato nacional.',
    category: 'Esportes',
    featuredImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    views: 4100,
    comments: 95,
    featured: false
  },
  {
    id: '24',
    title: 'Novo complexo esportivo será inaugurado no próximo mês',
    content: '<p>A prefeitura anunciou que o novo Complexo Esportivo Municipal será inaugurado em março, oferecendo quadras de vôlei, basquete, futsal e uma academia de ginástica totalmente equipada.</p><p>O investimento de R$ 3,5 milhões visa promover o esporte na cidade e descobrir novos talentos locais. As atividades serão gratuitas para a população.</p>',
    excerpt: 'Complexo Esportivo Municipal será inaugurado em março com investimento de R$ 3,5 milhões.',
    category: 'Esportes',
    featuredImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    views: 2800,
    comments: 54,
    featured: false
  },
  {
    id: '25',
    title: 'Torneio de tênis reúne atletas de cinco estados',
    content: '<p>O XV Torneio Regional de Tênis começou ontem nas quadras do Clube Municipal com a participação de 120 atletas representando cinco estados da região. A competição vai até domingo.</p><p>Entre os participantes estão ex-profissionais e jovens promessas do esporte. As finais acontecem no domingo a partir das 9h com entrada gratuita.</p>',
    excerpt: 'Torneio Regional de Tênis reúne 120 atletas de cinco estados até domingo.',
    category: 'Esportes',
    featuredImage: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    views: 1950,
    comments: 31,
    featured: true
  },

  // TECNOLOGIA (5 matérias)
  {
    id: '26',
    title: 'Cidade inaugura primeira rede 5G da região',
    content: '<p>A cidade se tornou a primeira da região a receber cobertura completa da rede 5G, oferecendo internet de alta velocidade para residências e empresas. O projeto piloto começou no centro e se expandirá para todos os bairros.</p><p>A nova tecnologia promete revolucionar os serviços digitais locais e atrair investimentos tecnológicos para a região.</p>',
    excerpt: 'Cidade estreia rede 5G regional com cobertura completa e expansão para todos os bairros.',
    category: 'Tecnologia',
    featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    views: 5200,
    comments: 123,
    featured: true
  },
  {
    id: '27',
    title: 'Startup local desenvolve app para pequenos comerciantes',
    content: '<p>A startup "TechLocal", formada por estudantes da universidade regional, lançou um aplicativo que ajuda pequenos comerciantes a gerenciar vendas, estoque e relacionamento com clientes.</p><p>O app já conta com 50 empresas cadastradas na cidade e promete facilitar a digitalização do comércio local.</p>',
    excerpt: 'Startup local cria app que já cadastrou 50 empresas para digitalizar comércio da cidade.',
    category: 'Tecnologia',
    featuredImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    views: 2800,
    comments: 67,
    featured: false
  },
  {
    id: '28',
    title: 'Prefeitura lança portal digital para agilizar serviços públicos',
    content: '<p>A prefeitura inaugurou seu novo portal digital que permite aos cidadãos solicitar certidões, agendar atendimentos e acompanhar processos online. O sistema visa reduzir filas e burocracias.</p><p>Serviços como segunda via de documentos e consulta de débitos já estão disponíveis 24 horas por dia pelo portal.</p>',
    excerpt: 'Portal digital da prefeitura oferece serviços 24h e promete reduzir filas e burocracias.',
    category: 'Tecnologia',
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    views: 3600,
    comments: 89,
    featured: false
  },
  {
    id: '29',
    title: 'Escola pública recebe laboratório de informática modernizado',
    content: '<p>A Escola Estadual Central recebeu um laboratório de informática completamente modernizado com 30 computadores novos e acesso à internet de alta velocidade, beneficiando 800 estudantes.</p><p>O investimento de R$ 150 mil faz parte do programa de inclusão digital do governo estadual.</p>',
    excerpt: 'Escola recebe laboratório com 30 computadores novos e beneficia 800 estudantes.',
    category: 'Tecnologia',
    featuredImage: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    views: 2400,
    comments: 45,
    featured: false
  },
  {
    id: '30',
    title: 'Inteligência artificial será usada no trânsito da cidade',
    content: '<p>A Secretaria de Trânsito anunciou a implementação de um sistema de inteligência artificial para otimizar semáforos e reduzir congestionamentos no centro da cidade.</p><p>O sistema monitora o fluxo de veículos em tempo real e ajusta automaticamente os tempos dos semáforos para melhorar a fluidez do trânsito.</p>',
    excerpt: 'IA será implementada em semáforos para reduzir congestionamentos no centro da cidade.',
    category: 'Tecnologia',
    featuredImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    views: 4200,
    comments: 98,
    featured: true
  },

  // CIÊNCIA / SAÚDE (5 matérias)
  {
    id: '31',
    title: 'Hospital municipal recebe equipamento de ressonância magnética',
    content: '<p>O Hospital Municipal recebeu um equipamento de ressonância magnética de última geração, investimento de R$ 2,8 milhões que beneficiará toda a região. O aparelho já está em funcionamento.</p><p>Com o novo equipamento, o hospital poderá realizar diagnósticos mais precisos e reduzir a fila de espera para exames especializados.</p>',
    excerpt: 'Hospital recebe ressonância magnética de R$ 2,8 milhões e reduz fila de exames.',
    category: 'Ciência / Saúde',
    featuredImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    views: 6200,
    comments: 145,
    featured: true
  },
  {
    id: '32',
    title: 'Pesquisadores da universidade descobrem nova espécie de planta',
    content: '<p>Pesquisadores do Departamento de Biologia da Universidade Regional descobriram uma nova espécie de planta medicinal na mata local. A descoberta foi publicada em revista científica internacional.</p><p>A planta, batizada de "Flora Regionalis", possui propriedades anti-inflamatórias e pode ser usada no desenvolvimento de novos medicamentos.</p>',
    excerpt: 'Universidade descobre nova planta medicinal com propriedades anti-inflamatórias.',
    category: 'Ciência / Saúde',
    featuredImage: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    views: 3800,
    comments: 72,
    featured: false
  },
  {
    id: '33',
    title: 'Campanha de vacinação contra gripe atinge 85% da meta',
    content: '<p>A campanha de vacinação contra gripe na cidade atingiu 85% da meta estabelecida pela Secretaria de Saúde, imunizando mais de 15 mil pessoas dos grupos prioritários.</p><p>A campanha continua até o final do mês em todas as unidades básicas de saúde, com foco especial em idosos e crianças.</p>',
    excerpt: 'Vacinação contra gripe atinge 85% da meta com mais de 15 mil pessoas imunizadas.',
    category: 'Ciência / Saúde',
    featuredImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    views: 2900,
    comments: 58,
    featured: false
  },
  {
    id: '34',
    title: 'Centro de pesquisa estuda impactos das mudanças climáticas',
    content: '<p>O Centro de Pesquisas Ambientais da universidade iniciou um estudo de três anos sobre os impactos das mudanças climáticas na agricultura local, com apoio de órgãos nacionais.</p><p>A pesquisa visa desenvolver técnicas de adaptação para proteger a produção agrícola regional dos efeitos do aquecimento global.</p>',
    excerpt: 'Centro de pesquisa inicia estudo sobre mudanças climáticas na agricultura local.',
    category: 'Ciência / Saúde',
    featuredImage: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    views: 2100,
    comments: 34,
    featured: false
  },
  {
    id: '35',
    title: 'Telemedicina será implementada em postos de saúde rurais',
    content: '<p>A Secretaria de Saúde anunciou a implementação de sistema de telemedicina em cinco postos de saúde da zona rural, permitindo consultas especializadas à distância.</p><p>O projeto piloto conectará médicos especialistas do hospital municipal com pacientes das comunidades rurais, reduzindo a necessidade de deslocamento para a cidade.</p>',
    excerpt: 'Telemedicina conectará especialistas com pacientes rurais em cinco postos de saúde.',
    category: 'Ciência / Saúde',
    featuredImage: 'https://images.unsplash.com/photo-1581093458791-9d42e7d99f5d?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    views: 3400,
    comments: 67,
    featured: true
  },

  // POLÍCIA / SEGURANÇA (5 matérias)
  {
    id: '36',
    title: 'Nova delegacia especializada será inaugurada no centro',
    content: '<p>A nova Delegacia de Atendimento Especializado à Mulher será inaugurada na próxima semana no centro da cidade, oferecendo atendimento 24 horas para casos de violência doméstica.</p><p>A unidade contará com equipe multidisciplinar incluindo psicólogos e assistentes sociais para atendimento integral às vítimas.</p>',
    excerpt: 'Delegacia da Mulher oferecerá atendimento 24h com equipe multidisciplinar.',
    category: 'Polícia / Segurança',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    views: 4100,
    comments: 87,
    featured: true
  },
  {
    id: '37',
    title: 'Sistema de monitoramento por câmeras é ampliado',
    content: '<p>A Secretaria de Segurança instalou 20 novas câmeras de monitoramento em pontos estratégicos da cidade, ampliando o sistema de videovigilância para 150 equipamentos.</p><p>As câmeras utilizam tecnologia de reconhecimento facial e estão conectadas ao centro de controle da Guarda Municipal.</p>',
    excerpt: 'Videovigilância ganha 20 novas câmeras com reconhecimento facial totalizando 150 equipamentos.',
    category: 'Polícia / Segurança',
    featuredImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    views: 2800,
    comments: 54,
    featured: false
  },
  {
    id: '38',
    title: 'Guarda Municipal recebe novos equipamentos de segurança',
    content: '<p>A Guarda Municipal recebeu novos equipamentos de segurança incluindo coletes balísticos, tasers e equipamentos de comunicação digital, fortalecendo a segurança pública na cidade.</p><p>O investimento de R$ 300 mil visa modernizar a corporação e melhorar a resposta a emergências.</p>',
    excerpt: 'Guarda Municipal recebe R$ 300 mil em novos equipamentos de segurança.',
    category: 'Polícia / Segurança',
    featuredImage: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    views: 3200,
    comments: 69,
    featured: false
  },
  {
    id: '39',
    title: 'Programa comunitário de segurança forma novos vigilantes',
    content: '<p>O programa "Vizinhança Protegida" formou sua primeira turma de 50 vigilantes comunitários voluntários, que atuarão na prevenção de crimes em seus bairros.</p><p>Os voluntários receberam treinamento em primeiros socorros, comunicação com autoridades e técnicas de observação preventiva.</p>',
    excerpt: 'Programa "Vizinhança Protegida" forma 50 vigilantes comunitários voluntários.',
    category: 'Polícia / Segurança',
    featuredImage: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    views: 1900,
    comments: 42,
    featured: false
  },

  
  // ARTIGO DA ANA COSTA NA CATEGORIA POLICIAL (para testar auto-cópia)
  {
    id: '48',
    title: 'Análise: Impactos Econômicos da Segurança Pública',
    content: '<p>A segurança pública no Brasil não é apenas uma questão social, mas também um fator econômico determinante para o desenvolvimento do país. Os custos da violência urbana afetam diretamente a competitividade das cidades e o ambiente de negócios.</p><p>Investimentos eficientes em segurança podem gerar retornos significativos através da redução de custos com seguros, aumentos no turismo e maior confiança dos investidores. É uma equação que precisa ser melhor compreendida pelos gestores públicos.</p><p>Como economista que acompanha indicadores urbanos, vejo a urgência de quantificar melhor esses impactos para fundamentar políticas públicas mais eficazes em segurança.</p>',
    excerpt: 'Os investimentos em segurança pública geram retornos econômicos mensuráveis para as cidades.',
    category: 'Policial',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    views: 1250,
    comments: 28,
    featured: false,
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },

  // CÓPIA AUTOMÁTICA PARA A COLUNA DA ANA
  {
    id: '49',
    title: '[Coluna] Análise: Impactos Econômicos da Segurança Pública',
    content: '<p>A segurança pública no Brasil não é apenas uma questão social, mas também um fator econômico determinante para o desenvolvimento do país. Os custos da violência urbana afetam diretamente a competitividade das cidades e o ambiente de negócios.</p><p>Investimentos eficientes em segurança podem gerar retornos significativos através da redução de custos com seguros, aumentos no turismo e maior confiança dos investidores. É uma equação que precisa ser melhor compreendida pelos gestores públicos.</p><p>Como economista que acompanha indicadores urbanos, vejo a urgência de quantificar melhor esses impactos para fundamentar políticas públicas mais eficazes em segurança.</p>',
    excerpt: 'Os investimentos em segurança pública geram retornos econômicos mensuráveis para as cidades.',
    category: 'Coluna Ana Costa',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    views: 1250,
    comments: 28,
    featured: false,
    isColumnCopy: true,
    originalArticleId: '48',
    columnist: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas.',
      specialty: 'Economia e Finanças'
    }
  },

  // ARTIGO REGULAR (sem colunista)
  {
    id: '40',
    title: 'Central de emergências unifica atendimento 190 e 193',
    content: '<p>A nova Central Integrada de Emergências passou a operar unificando os atendimentos do 190 (Polícia Militar) e 193 (Bombeiros), agilizando o tempo de resposta a ocorrências.</p><p>O sistema permite coordenação mais eficiente entre as corporações e reduz o tempo médio de atendimento de 8 para 5 minutos.</p>',
    excerpt: 'Central Integrada unifica emergências 190 e 193 reduzindo tempo de resposta para 5 minutos.',
    category: 'Polícia / Segurança',
    featuredImage: 'https://images.unsplash.com/photo-1591386661848-6d33b8c676c8?w=800&h=400&fit=crop',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    views: 5600,
    comments: 123,
    featured: true
  }
];

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem('news_articles');
      // Loading articles from localStorage
      
      if (saved) {
        const parsedArticles = JSON.parse(saved);
        
        // Verificar se há colunista fantasma Ana Santos e limpar se necessário
        const hasAnasantos = parsedArticles.some((article: NewsArticle) => 
          article.columnist?.id === 'ana-santos'
        );
        
        if (hasAnasantos) {
          // Cleaning ghost columnist data
          // Filtrar artigos removendo qualquer referência a Ana Santos
          const cleanedArticles = parsedArticles.filter((article: NewsArticle) => 
            article.columnist?.id !== 'ana-santos'
          );
          localStorage.setItem('news_articles', JSON.stringify(cleanedArticles));
          return cleanedArticles;
        }
        
        return parsedArticles;
      }
      
      // Using default articles if none saved
      localStorage.setItem('news_articles', JSON.stringify(defaultArticles));
      return defaultArticles;
    } catch (error) {
      console.error('Error loading articles from localStorage:', error);
      return defaultArticles;
    }
  });

  // Persistir mudanças no localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('news_articles', JSON.stringify(articles));
    } catch (error) {
      console.error('Error saving articles to localStorage:', error);
    }
  }, [articles]);

  // Listener para mudanças no localStorage dos usuários (para recarregar artigos quando colunistas ficam ativos/inativos)
  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('news_articles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const filtered = filterActiveColumnistArticles(parsed);
            setArticles(filtered);
          }
        }
      } catch (error) {
        console.error('Error reloading articles on storage change:', error);
      }
    };

    // Listen for changes in users storage that might affect columnist articles visibility
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addArticle = useCallback((articleData: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'comments'>, currentUserId?: string) => {
    try {
      // Validação robusta dos dados de entrada
      if (!articleData.title?.trim() || !articleData.content?.trim() || !articleData.category?.trim()) {
        console.error('NewsContext - Dados inválidos para criação de artigo:', articleData);
        throw new Error('Título, conteúdo e categoria são obrigatórios');
      }

      const now = new Date().toISOString();
      const newArticle: NewsArticle = {
        ...articleData,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID mais único
        createdAt: now,
      updatedAt: now,
      views: 0,
      comments: 0,
      // Garantir que campos obrigatórios existam
      excerpt: articleData.excerpt?.trim() || articleData.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
      featuredImage: articleData.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop'
    };
    
    // Adding new article to context
    
    setArticles(prev => {
      try {
        let updated = [newArticle, ...prev];
        
        // Se o artigo é de um colunista, verificar se precisa criar cópia para sua coluna
        if (newArticle.columnist && currentUserId) {
          // Buscar dados do usuário para verificar categorias permitidas
          const usersData = localStorage.getItem('users_store');
          if (usersData) {
            try {
              const users = JSON.parse(usersData);
              const columnist = users.find((u: any) => u.id === currentUserId && u.role === 'colunista');
              
              if (columnist?.columnistProfile?.allowedCategories) {
                // Se escreveu em uma categoria que NÃO está em suas especialidades, criar cópia para coluna
                if (!columnist.columnistProfile.allowedCategories.includes(newArticle.category)) {
                  const columnCopy: NewsArticle = {
                    ...newArticle,
                    id: `${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`, // ID único para a cópia
                    title: `[Coluna] ${newArticle.title}`,
                    category: `Coluna ${columnist.name}`, // Categoria especial para a coluna
                    isColumnCopy: true,
                    originalArticleId: newArticle.id,
                    createdAt: now,
                    updatedAt: now
                  };
                  
                  updated = [columnCopy, ...updated];
                  // Column copy created successfully
                }
              }
            } catch (error) {
              console.error('Error parsing users data:', error);
            }
          }
        }
        
        // Salvar no localStorage com melhor tratamento de erros
        try {
          localStorage.setItem('news_articles', JSON.stringify(updated));
          console.log('Article saved successfully:', newArticle.id);
        } catch (storageError) {
          console.error('Failed to save articles to localStorage:', storageError);
          alert('Erro ao salvar artigo. Verifique o espaço de armazenamento do navegador.');
        }
        
        // Articles list updated successfully
        return updated;
      } catch (error) {
        console.error('NewsContext - Error in addArticle:', error);
        return [newArticle, ...prev]; // Fallback: pelo menos adiciona o artigo principal
      }
    });
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Erro ao adicionar artigo. Por favor, tente novamente.');
    }
  }, []);

  const updateArticle = (id: string, updates: Partial<NewsArticle>) => {
    if (!id?.trim()) {
      console.error('NewsContext - ID inválido para updateArticle:', id);
      return;
    }

    // Updating article in context

    setArticles(prev => {
      const updatedArticles = prev.map(article => {
        if (article.id === id) {
          const updated = { 
            ...article, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          };
          // Article updated successfully
          return updated;
        }
        return article;
      });

      // Verificar se o artigo foi realmente encontrado
      const found = updatedArticles.some(article => article.id === id);
      if (!found) {
        console.warn('NewsContext - Article not found for update:', id);
      }

      return updatedArticles;
    });
  };

  const deleteArticle = (id: string) => {
    if (!id?.trim()) {
      console.error('NewsContext - ID inválido para deleteArticle:', id);
      return;
    }

    // Deleting article from context

    setArticles(prev => {
      const filtered = prev.filter(article => article.id !== id);
      
      // Log se o artigo foi realmente removido
      if (filtered.length === prev.length) {
        console.warn('NewsContext - Article not found for deletion:', id);
      } else {
        // Article deleted successfully
      }
      
      return filtered;
    });
  };

  const getArticleById = useCallback((id: string) => {
    return articles.find(article => article.id === id);
  }, [articles]);

  const getArticlesByCategory = (category: string) => {
    const categoryArticles = articles.filter(article => article.category === category);
    
    // Filter out articles from inactive columnists
    return categoryArticles.filter(article => {
      if (article.columnist) {
        try {
          const usersData = localStorage.getItem('users_store');
          if (usersData) {
            const users = JSON.parse(usersData);
            const columnist = users.find((u: any) => u.id === article.columnist?.id && u.role === 'colunista');
            return columnist?.columnistProfile?.isActive ?? false;
          }
        } catch (error) {
          console.error('Error checking columnist status:', error);
          return false;
        }
      }
      return true; // Non-columnist articles are always shown
    });
  };

  const getArticlesByColumnist = (columnistId: string) => {
    // First check if the columnist is active
    try {
      const usersData = localStorage.getItem('users_store');
      if (usersData) {
        const users = JSON.parse(usersData);
        const columnist = users.find((u: any) => u.id === columnistId && u.role === 'colunista');
        if (!columnist?.columnistProfile?.isActive) {
          return []; // Return empty array if columnist is inactive
        }
      }
    } catch (error) {
      console.error('Error checking columnist status:', error);
      return [];
    }
    
    // Buscar artigos pelo columnist.id (estrutura antiga) ou author_id (estrutura nova do Supabase)
    return articles.filter(article => {
      const isColumnistMatch = article.columnist?.id === columnistId;
      // Para compatibilidade com o sistema novo, verificar se o artigo tem author_id igual ao columnistId
      const isAuthorMatch = !article.columnist && article.category?.includes('Coluna') && 
                           articles.some(a => a.columnist?.id === columnistId);
      
      console.log(`Filtering article ${article.id}: columnist=${article.columnist?.id}, columnistId=${columnistId}, match=${isColumnistMatch || isAuthorMatch}`);
      
      return isColumnistMatch || isAuthorMatch;
    });
  };

  const getColumnistById = (columnistId: string) => {
    const article = articles.find(article => article.columnist?.id === columnistId);
    return article?.columnist;
  };

  const incrementViews = useCallback((id: string) => {
    updateArticle(id, { 
      views: (articles.find(article => article.id === id)?.views || 0) + 1 
    });
  }, [updateArticle, articles]);

  const toggleFeaturedArticle = (id: string, currentUserId?: string) => {
    const article = getArticleById(id);
    if (!article) {
      console.error('toggleFeaturedArticle - Article not found:', id);
      return;
    }

    // Verificar permissões apenas se há um usuário atual e é colunista
    if (currentUserId) {
      const usersData = localStorage.getItem('users_store');
      if (usersData) {
        try {
          const users = JSON.parse(usersData);
          const currentUser = users.find((u: any) => u.id === currentUserId);
          
          // Current user validation
          
          // Se é colunista, aplicar restrições
          if (currentUser?.role === 'colunista') {
            // Colunista só pode alterar destaques de artigos de sua própria coluna
            const isOwnArticle = article.columnist?.id === currentUserId;
            const isOwnColumn = article.category === `Coluna ${currentUser.name}`;
            
            // Permission check for columnist ownership
            
            if (!isOwnArticle && !isOwnColumn) {
              console.warn('Colunista não pode alterar destaque de artigos de outro autor');
              return;
            }
          }
          // Admin e editor podem alterar qualquer destaque
        } catch (error) {
          console.error('Error parsing users data:', error);
          return;
        }
      }
    }

    // Permission granted, proceeding with toggle

    setArticles(prev => {
      const newArticles = prev.map(art => {
        // Se é o artigo que estamos alterando
        if (art.id === id) {
          const newFeaturedStatus = !art.featured;
          // Toggling featured status
          return { 
            ...art, 
            featured: newFeaturedStatus, 
            updatedAt: new Date().toISOString() 
          };
        }
        // Se o artigo atual está sendo marcado como destaque, desmarcar outros da mesma categoria
        if (art.category === article.category && !article.featured && art.featured) {
          // Removing featured from other articles in same category
          return { 
            ...art, 
            featured: false, 
            updatedAt: new Date().toISOString() 
          };
        }
        return art;
      });
      
      // Articles list updated with new featured status
      
      return newArticles;
    });
  };

  const value: NewsContextType = {
    articles,
    addArticle,
    updateArticle,
    deleteArticle,
    getArticleById,
    getArticlesByCategory,
    getArticlesByColumnist,
    getColumnistById,
    incrementViews,
    toggleFeaturedArticle
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};