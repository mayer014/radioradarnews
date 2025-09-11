import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Share2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNews, NEWS_CATEGORIES, filterActiveColumnistArticles } from '@/contexts/NewsContext';
import { useUsers } from '@/contexts/UsersContext';
import Banner from '@/components/Banner';
import { getArticleLink } from '@/lib/utils';
import { useCategoryColors } from '@/utils/categoryColors';

const newsCategories = [
  { name: 'Todas', color: 'primary', icon: '📰', featured: true },
  { name: 'Política', color: 'blue', icon: '🏛️', featured: false },
  { name: 'Policial', color: 'red', icon: '🚔', featured: false },
  { name: 'Entretenimento', color: 'purple', icon: '🎭', featured: false },
  { name: 'Internacional', color: 'green', icon: '🌍', featured: false },
  { name: 'Esportes', color: 'orange', icon: '⚽', featured: false },
  { name: 'Tecnologia', color: 'cyan', icon: '💻', featured: false },
  { name: 'Ciência / Saúde', color: 'violet', icon: '🔬', featured: false }
];

// Componente para seção de colunista com layout avançado
const ColumnistSection = ({ columnist }: {
  columnist: {
    id: string;
    name: string;
    specialty: string;
    avatar: string;
    color: string;
    featuredArticle: {
      title: string;
      excerpt: string;
      image: string;
      time: string;
    };
    articles: Array<{
      title: string;
      time: string;
      image?: string;
    }>;
  }
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500/20 to-purple-500/10',
      border: 'border-blue-400/30 hover:border-blue-400/50',
      text: 'text-blue-400',
      bg: 'bg-blue-400',
      avatar: 'from-blue-500 to-purple-500',
      button: 'border-blue-400/50 text-blue-400 hover:bg-blue-400/10 hover:border-blue-400'
    },
    green: {
      gradient: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-400/30 hover:border-green-400/50',
      text: 'text-green-400',
      bg: 'bg-green-400',
      avatar: 'from-green-500 to-emerald-500',
      button: 'border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400'
    },
    cyan: {
      gradient: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-400/30 hover:border-cyan-400/50',
      text: 'text-cyan-400',
      bg: 'bg-cyan-400',
      avatar: 'from-cyan-500 to-blue-500',
      button: 'border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400'
    }
  };

  const colors = colorClasses[columnist.color as keyof typeof colorClasses];
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % columnist.articles.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => prev === 0 ? columnist.articles.length - 1 : prev - 1);
  };

  return (
    <div className={`relative bg-gradient-to-br ${colors.gradient} backdrop-blur-sm border ${colors.border} rounded-xl p-8 transition-all duration-500`}>
      {/* Header do Colunista */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className={`w-20 h-20 bg-gradient-to-br ${colors.avatar} rounded-full flex items-center justify-center mr-6 overflow-hidden`}>
            {columnist.avatar && columnist.avatar !== '' ? (
              <img 
                src={columnist.avatar} 
                alt={columnist.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Error loading columnist avatar
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center';
                  fallback.innerHTML = `<span class="text-white text-2xl font-bold">${columnist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>`;
                  (e.target as HTMLImageElement).parentElement!.replaceChild(fallback, (e.target as HTMLImageElement));
                }}
              />
            ) : (
              <span className="text-white text-2xl font-bold">{columnist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">{columnist.name}</h3>
            <p className={`${colors.text} font-semibold text-lg`}>{columnist.specialty}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-muted-foreground">✍️ Colunista</span>
              <span className="text-sm text-muted-foreground">📊 +50 artigos</span>
            </div>
          </div>
        </div>
        
        <Link to={`/colunista/${columnist.id}`}>
          <Button variant="outline" className={`${colors.button} px-6`}>
            Ver Perfil
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Artigo Destaque */}
        <div className="order-2 lg:order-1">
          <Card className={`group bg-gradient-card backdrop-blur-sm ${colors.border} transition-all duration-500 overflow-hidden h-full hover:transform hover:scale-[1.02]`}>
            <div className="relative bg-muted/20 rounded-t-lg">
              <img
                src={columnist.featuredArticle.image}
                alt={columnist.featuredArticle.title}
                className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 text-xs font-bold ${colors.bg} text-white rounded-full`}>
                  DESTAQUE
                </span>
              </div>
            </div>
            <div className="p-6">
              <h4 className={`text-xl font-bold mb-3 text-foreground group-hover:${colors.text} transition-colors duration-300 line-clamp-2`}>
                {columnist.featuredArticle.title}
              </h4>
              
              <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                {columnist.featuredArticle.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{columnist.featuredArticle.time}</span>
                </div>
                
                <Link to={`/colunista/${columnist.id}`}>
                  <Button size="sm" className={`bg-gradient-hero hover:shadow-glow-primary`}>
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Slider de Artigos */}
        <div className="order-1 lg:order-2">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-semibold">Últimos Artigos</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevSlide}
                className={`p-2 ${colors.button}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextSlide}
                className={`p-2 ${colors.button}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 h-96 overflow-hidden">
            <div 
              className="transition-transform duration-500 ease-in-out space-y-4"
              style={{ transform: `translateY(-${currentSlide * 90}px)` }}
            >
              {columnist.articles.map((article, index) => (
                <Link key={index} to={`/colunista/${columnist.id}`}>
                  <Card 
                    className={`group bg-gradient-card backdrop-blur-sm border-muted/30 hover:${colors.border} transition-all duration-300 overflow-hidden cursor-pointer h-20 flex items-center`}
                  >
                    <div className="flex items-center gap-4 p-4 w-full">
                      {article.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={article.image} 
                            alt={article.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={`w-2 h-12 ${colors.bg} rounded-full flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-semibold mb-1 text-foreground group-hover:${colors.text} transition-colors duration-300 line-clamp-1`}>
                          {article.title}
                        </h5>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{article.time}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Indicadores de slide */}
          <div className="flex justify-center gap-2 mt-4">
            {columnist.articles.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? colors.bg : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsGrid = () => {
  const { articles } = useNews();
  const { columnists, users } = useUsers();
  const getCategoryColors = useCategoryColors();
  
  // Function to get current avatar from users context
  const getCurrentAvatar = (columnistId: string) => {
    const currentUser = users.find(user => user.id === columnistId && user.role === 'colunista');
    return currentUser?.columnistProfile?.avatar;
  };
  
  // Debug logs removed for production
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Ler categoria da URL quando componente carregar
  useEffect(() => {
    const categoria = searchParams.get('categoria');
    if (categoria && NEWS_CATEGORIES.includes(categoria)) {
      setSelectedCategory(categoria);
    } else {
      setSelectedCategory('Todas');
    }
  }, [searchParams]);

  // Scroll para o topo quando categoria mudar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory]);
  
  // Atualizar URL quando categoria for alterada pelos filtros
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Todas') {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: category });
    }
  };
  
  // Função para navegar para página de notícias com categoria específica
  const handleViewMore = (category: string) => {
    navigate(`/noticias?categoria=${category}#news-grid`, { replace: false });
    // Rolar para o topo após um pequeno delay para garantir que a navegação aconteceu
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  
  // Filtrar artigos baseado na categoria selecionada e excluir rascunhos
  const filteredArticles = selectedCategory === 'Todas' 
    ? filterActiveColumnistArticles(articles.filter(article => !article.isDraft))
    : filterActiveColumnistArticles(articles.filter(article => article.category === selectedCategory && !article.isDraft));
  
  // Organizar artigos por data (mais recentes primeiro)
  const sortedArticles = [...filteredArticles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Separar por categorias para layout específico (excluir rascunhos)
  const politicalNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Política' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const policeNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Policial' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const entertainmentNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Entretenimento' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const internationalNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Internacional' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const sportsNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Esportes' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const technologyNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Tecnologia' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const healthNews = filterActiveColumnistArticles(articles.filter(article => article.category === 'Ciência / Saúde' && !article.isDraft))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Buscar artigos destacados por categoria (fallback para o mais recente se não houver destaque)
  const getFeaturedArticle = (categoryNews: typeof politicalNews) => {
    const featured = categoryNews.find(article => article.featured);
    return featured || categoryNews[0];
  };

  const featuredPolitical = getFeaturedArticle(politicalNews);
  const featuredPolice = getFeaturedArticle(policeNews);
  const featuredEntertainment = getFeaturedArticle(entertainmentNews);
  const featuredInternational = getFeaturedArticle(internationalNews);
  const featuredSports = getFeaturedArticle(sportsNews);
  const featuredTechnology = getFeaturedArticle(technologyNews);
  const featuredHealth = getFeaturedArticle(healthNews);

  // Se não há artigos, mostrar mensagem
  if (articles.length === 0) {
    return (
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Portal News
          </h2>
          <p className="text-lg text-muted-foreground">
            Carregando notícias...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-6" id="news-grid">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/ef193e05-ec63-47a4-9731-ac6dd613febc.png" 
              alt="Portal News Logo" 
              className="h-16 md:h-20 object-contain"
              loading="lazy"
            />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cobertura completa e investigativa das principais notícias
          </p>
        </div>

        {/* Filtros de Categorias */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {newsCategories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => handleCategoryChange(category.name)}
              className={`${selectedCategory === category.name
                ? 'bg-gradient-hero hover:shadow-glow-primary' 
                : 'border-primary/50 hover:bg-primary/10 hover:border-primary'
              } transition-all duration-300 hover:scale-105`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Layout quando filtro específico está ativo */}
        {selectedCategory !== 'Todas' && sortedArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedArticles.map((news, index) => (
              <Link key={news.id} to={getArticleLink(news)}>
                <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-500 overflow-hidden cursor-pointer h-full">
                  <div className="relative bg-muted/20 rounded-t-lg">
                    <img
                      src={news.featuredImage}
                      alt={news.title}
                      className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                     <div className="absolute top-4 left-4">
                       {(() => {
                         const colors = getCategoryColors(news.category);
                         return (
                           <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                             {news.category}
                           </span>
                         );
                       })()}
                     </div>
                  </div>
                    <div className="p-4">
                     <h4 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                       {news.title}
                     </h4>
                     <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                       {news.excerpt}
                     </p>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center text-xs text-muted-foreground">
                         <Clock className="w-3 h-3 mr-1" />
                         <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                       </div>
                         {news.columnist && (
                           <div className="flex items-center text-xs text-muted-foreground">
                             {getCurrentAvatar(news.columnist.id) ? (
                                <img
                                  src={getCurrentAvatar(news.columnist.id)}
                                  alt={news.columnist.name}
                                  className="w-5 h-5 rounded-full object-cover mr-1"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                             ) : (
                               <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center mr-1">
                                 <span className="text-[8px] text-muted-foreground">
                                   {news.columnist.name[0]?.toUpperCase()}
                                 </span>
                               </div>
                             )}
                             <span>{news.columnist.name.split(' ')[0]}</span>
                           </div>
                         )}
                     </div>
                   </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Layout completo quando "Todas" está selecionado */}
        {selectedCategory === 'Todas' && (
          <>
            {/* Função para criar layout de categoria uniforme */}
            {/* Política - Posição Esquerda (índice 0) */}
            {politicalNews.length > 0 && featuredPolitical && (
              <div className="mb-16 rounded-2xl p-6 border border-blue-200/40 bg-gradient-to-br from-blue-50/80 via-background to-blue-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Política');
                     return (
                       <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                         <span className="text-xl">🏛️</span>
                       </div>
                     );
                   })()}
                   {(() => {
                     const colors = getCategoryColors('Política');
                     return (
                       <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Política</h3>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Esquerda) */}
                  <div>
                    <Card className={`group bg-gradient-card backdrop-blur-sm ${getCategoryColors('Política').borderClass} hover:border-primary/50 transition-all duration-500 overflow-hidden h-full`}>
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredPolitical.featuredImage}
                          alt={featuredPolitical.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Política');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredPolitical)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                            {featuredPolitical.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredPolitical.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredPolitical.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                           {featuredPolitical.columnist && (
                             <div className="flex items-center space-x-1">
                               {getCurrentAvatar(featuredPolitical.columnist.id) ? (
                                 <img
                                   src={getCurrentAvatar(featuredPolitical.columnist.id)}
                                   alt={featuredPolitical.columnist.name}
                                   className="w-5 h-5 rounded-full object-cover"
                                   onError={(e) => {
                                     console.error('Error loading featured political columnist avatar:', getCurrentAvatar(featuredPolitical.columnist.id)?.substring(0, 100));
                                     (e.target as HTMLImageElement).style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center">
                                   <span className="text-[8px] text-muted-foreground">
                                     {featuredPolitical.columnist.name[0]?.toUpperCase()}
                                   </span>
                                 </div>
                               )}
                               <span>{featuredPolitical.columnist.name.split(' ')[0]}</span>
                             </div>
                           )}
                        </div>
                        
                        <Link to={getArticleLink(featuredPolitical)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias (Direita) */}
                  <div className="space-y-4">
                    {politicalNews.filter(news => news.id !== featuredPolitical.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Política')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Política').borderClass} ${getCategoryColors('Política').colorClass} hover:${getCategoryColors('Política').bgClass} hover:border-primary`}
                  >
                    Ver mais notícias políticas
                  </Button>
                </div>
                
                {/* Banner de Categoria - Política */}
                <Banner position="category" category="Política" />
              </div>
            )}

            {/* Policial - Posição Direita (índice 1) */}
            {policeNews.length > 0 && featuredPolice && (
              <div className="mb-16 rounded-2xl p-6 border border-red-200/40 bg-gradient-to-br from-red-50/80 via-background to-red-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Policial');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">🚔</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Policial</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Mobile First) */}
                  <div className="order-1 lg:order-2">
                    <Card className={`group bg-gradient-card backdrop-blur-sm ${getCategoryColors('Policial').borderClass} hover:border-primary/50 transition-all duration-500 overflow-hidden h-full`}>
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredPolice.featuredImage}
                          alt={featuredPolice.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Policial');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredPolice)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
                            {featuredPolice.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredPolice.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredPolice.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredPolice)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias */}
                  <div className="space-y-4 order-2 lg:order-1">
                    {policeNews.filter(news => news.id !== featuredPolice.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-red-400/20 hover:border-red-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Policial')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Policial').borderClass} ${getCategoryColors('Policial').colorClass} hover:${getCategoryColors('Policial').bgClass} hover:border-primary`}
                  >
                    Ver mais notícias policiais
                  </Button>
                </div>
                
                {/* Banner de Categoria - Policial */}
                <Banner position="category" category="Policial" />
              </div>
            )}

            {/* Entretenimento - Posição Esquerda (índice 2) */}
            {entertainmentNews.length > 0 && featuredEntertainment && (
               <div className="mb-16 rounded-2xl p-6 border border-purple-200/40 bg-gradient-to-br from-purple-50/80 via-background to-purple-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Entretenimento');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">🎭</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Entretenimento</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Esquerda) */}
                  <div>
                    <Card className={`group bg-gradient-card backdrop-blur-sm ${getCategoryColors('Entretenimento').borderClass} hover:border-primary/50 transition-all duration-500 overflow-hidden h-full`}>
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredEntertainment.featuredImage}
                          alt={featuredEntertainment.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Entretenimento');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredEntertainment)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                            {featuredEntertainment.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredEntertainment.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredEntertainment.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredEntertainment)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias (Direita) */}
                  <div className="space-y-4">
                    {entertainmentNews.filter(news => news.id !== featuredEntertainment.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-purple-400/20 hover:border-purple-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Entretenimento')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Entretenimento').borderClass} ${getCategoryColors('Entretenimento').colorClass} hover:${getCategoryColors('Entretenimento').bgClass} hover:border-primary`}
                  >
                    Ver mais entretenimento
                  </Button>
                </div>
                
                {/* Banner de Categoria - Entretenimento */}
                <Banner position="category" category="Entretenimento" />
              </div>
            )}

            {/* Internacional - Posição Direita (índice 3) */}
            {internationalNews.length > 0 && featuredInternational && (
               <div className="mb-16 rounded-2xl p-6 border border-green-200/40 bg-gradient-to-br from-green-50/80 via-background to-green-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Internacional');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">🌍</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Internacional</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Mobile First) */}
                  <div className="order-1 lg:order-2">
                    <Card className={`group bg-gradient-card backdrop-blur-sm ${getCategoryColors('Internacional').borderClass} hover:border-primary/50 transition-all duration-500 overflow-hidden h-full`}>
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredInternational.featuredImage}
                          alt={featuredInternational.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Internacional');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredInternational)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-green-400 transition-colors duration-300 line-clamp-2">
                            {featuredInternational.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredInternational.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredInternational.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredInternational)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias */}
                  <div className="space-y-4 order-2 lg:order-1">
                    {internationalNews.filter(news => news.id !== featuredInternational.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-green-400/20 hover:border-green-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-green-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Internacional')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Internacional').borderClass} ${getCategoryColors('Internacional').colorClass} hover:${getCategoryColors('Internacional').bgClass} hover:border-primary`}
                  >
                    Ver mais notícias internacionais
                  </Button>
                </div>
                
                {/* Banner de Categoria - Internacional */}
                <Banner position="category" category="Internacional" />
              </div>
            )}

            {/* Esportes - Posição Esquerda (índice 4) */}
            {sportsNews.length > 0 && featuredSports && (
               <div className="mb-16 rounded-2xl p-6 border border-orange-200/40 bg-gradient-to-br from-orange-50/80 via-background to-orange-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Esportes');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">⚽</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Esportes</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Esquerda) */}
                  <div>
                    <Card className="group bg-gradient-card backdrop-blur-sm border-orange-400/30 hover:border-orange-400/50 transition-all duration-500 overflow-hidden h-full">
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredSports.featuredImage}
                          alt={featuredSports.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Esportes');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredSports)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-orange-400 transition-colors duration-300 line-clamp-2">
                            {featuredSports.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredSports.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredSports.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredSports)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias (Direita) */}
                  <div className="space-y-4">
                    {sportsNews.filter(news => news.id !== featuredSports.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-orange-400/20 hover:border-orange-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-orange-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Esportes')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Esportes').borderClass} ${getCategoryColors('Esportes').colorClass} hover:${getCategoryColors('Esportes').bgClass} hover:border-primary`}
                  >
                    Ver mais esportes
                  </Button>
                </div>
                
                {/* Banner de Categoria - Esportes */}
                <Banner position="category" category="Esportes" />
              </div>
            )}

            {/* Tecnologia - Posição Direita (índice 5) */}
            {technologyNews.length > 0 && featuredTechnology && (
               <div className="mb-16 rounded-2xl p-6 border border-cyan-200/40 bg-gradient-to-br from-cyan-50/80 via-background to-cyan-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Tecnologia');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">💻</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Tecnologia</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Mobile First) */}
                  <div className="order-1 lg:order-2">
                    <Card className="group bg-gradient-card backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden h-full">
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredTechnology.featuredImage}
                          alt={featuredTechnology.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Tecnologia');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredTechnology)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
                            {featuredTechnology.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredTechnology.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredTechnology.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredTechnology)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias */}
                  <div className="space-y-4 order-2 lg:order-1">
                    {technologyNews.filter(news => news.id !== featuredTechnology.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Tecnologia')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Tecnologia').borderClass} ${getCategoryColors('Tecnologia').colorClass} hover:${getCategoryColors('Tecnologia').bgClass} hover:border-primary`}
                  >
                    Ver mais tecnologia
                  </Button>
                </div>
                
                {/* Banner de Categoria - Tecnologia */}
                <Banner position="category" category="Tecnologia" />
              </div>
            )}

            {/* Ciência/Saúde - Posição Esquerda (índice 6) */}
            {healthNews.length > 0 && featuredHealth && (
               <div className="mb-16 rounded-2xl p-6 border border-violet-200/40 bg-gradient-to-br from-violet-50/80 via-background to-violet-50/40 dark:bg-transparent dark:border-transparent">
                 <div className="flex items-center mb-8">
                   {(() => {
                     const colors = getCategoryColors('Ciência / Saúde');
                     return (
                       <>
                         <div className={`w-10 h-10 ${colors.bgClass} rounded-lg flex items-center justify-center mr-4`}>
                           <span className="text-xl">🔬</span>
                         </div>
                         <h3 className={`text-3xl font-bold ${colors.colorClass}`}>Ciência / Saúde</h3>
                       </>
                     );
                   })()}
                 </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Notícia Principal (Esquerda) */}
                  <div>
                    <Card className={`group bg-gradient-card backdrop-blur-sm ${getCategoryColors('Ciência / Saúde').borderClass} hover:border-primary/50 transition-all duration-500 overflow-hidden h-full`}>
                      <div className="relative bg-muted/20 rounded-t-lg">
                        <img
                          src={featuredHealth.featuredImage}
                          alt={featuredHealth.title}
                          className="w-full h-64 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                         <div className="absolute top-4 left-4">
                           {(() => {
                             const colors = getCategoryColors('Ciência / Saúde');
                             return (
                               <span className={`px-3 py-1 text-xs font-bold ${colors.bgClass} ${colors.colorClass} rounded-full`}>
                                 DESTAQUE
                               </span>
                             );
                           })()}
                         </div>
                      </div>
                      <div className="p-6">
                        <Link to={getArticleLink(featuredHealth)}>
                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-violet-400 transition-colors duration-300 line-clamp-2">
                            {featuredHealth.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {featuredHealth.excerpt}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(featuredHealth.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <Link to={getArticleLink(featuredHealth)}>
                          <Button className="bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 w-fit mt-4">
                            Ler Matéria Completa
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>

                  {/* Grid de 4 Notícias (Direita) */}
                  <div className="space-y-4">
                    {healthNews.filter(news => news.id !== featuredHealth.id).slice(0, 4).map((news, index) => (
                      <Link key={news.id} to={getArticleLink(news)}>
                        <Card className="group bg-gradient-card backdrop-blur-sm border-violet-400/20 hover:border-violet-400/40 transition-all duration-500 overflow-hidden cursor-pointer">
                          <div className="flex gap-4 p-4">
                            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                              <img
                                src={news.featuredImage}
                                alt={news.title}
                                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold mb-2 text-foreground group-hover:text-violet-400 transition-colors duration-300 line-clamp-2">
                                {news.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {news.excerpt}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{new Date(news.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={() => handleViewMore('Ciência / Saúde')}
                    variant="outline"
                    className={`w-full ${getCategoryColors('Ciência / Saúde').borderClass} ${getCategoryColors('Ciência / Saúde').colorClass} hover:${getCategoryColors('Ciência / Saúde').bgClass} hover:border-primary`}
                  >
                    Ver mais ciência e saúde
                  </Button>
                </div>
                
                {/* Banner de Categoria - Ciência / Saúde */}
                <Banner position="category" category="Ciência / Saúde" />
              </div>
            )}

            {/* Seção de Colunistas */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    Nossos Colunistas
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Análises especializadas e opiniões de nossos colunistas renomados
                </p>
              </div>

              <div className="space-y-16">
                {(() => {
                  // Usar colunistas ativos do contexto
                  const activeColumnists = columnists.filter(
                    columnist => columnist.columnistProfile?.isActive
                  );
                  
                  // Para cada colunista ativo, buscar seus artigos
                  return activeColumnists.map((columnist, index: number) => {
                    const columnistArticles = articles.filter(article => 
                      article.columnist?.id === columnist.id && !article.isDraft
                    );
                    
                    if (columnistArticles.length === 0) return null;
                    
                    // Ordenar artigos por data (mais recentes primeiro)
                    const sortedArts = [...columnistArticles].sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    
                    // Buscar artigo em destaque ou usar o mais recente
                    const featuredArticle = sortedArts.find(art => art.featured) || sortedArts[0];
                    
                    // Buscar outros artigos (excluindo o destaque)
                    const otherArticles = sortedArts
                      .filter(art => art.id !== featuredArticle?.id)
                      .slice(0, 4);
                    
                    if (!featuredArticle) return null;

                    // Calcular tempo relativo
                    const getTimeAgo = (dateStr: string) => {
                      const now = new Date();
                      const date = new Date(dateStr);
                      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
                      
                      if (diffInHours < 24) {
                        return diffInHours <= 1 ? "1 hora atrás" : `${diffInHours} horas atrás`;
                      }
                      const diffInDays = Math.floor(diffInHours / 24);
                      return diffInDays === 1 ? "1 dia atrás" : `${diffInDays} dias atrás`;
                    };

                    // Definir cores por colunista
                    const colors = index % 2 === 0 ? "blue" : "green";
                    
                     return (
                       <ColumnistSection 
                         key={columnist.id}
                         columnist={{
                           id: columnist.id,
                           name: columnist.name,
                           specialty: columnist.columnistProfile?.specialty || 'Colunista',
                           avatar: columnist.columnistProfile?.avatar || columnist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                           color: colors,
                           featuredArticle: {
                             title: featuredArticle.title,
                             excerpt: featuredArticle.excerpt,
                             image: featuredArticle.featuredImage,
                             time: getTimeAgo(featuredArticle.createdAt)
                           },
                           articles: otherArticles.map(art => ({
                             title: art.title,
                             time: getTimeAgo(art.createdAt),
                             image: art.featuredImage
                           }))
                         }}
                       />
                     );
                   }).filter(Boolean);
                })()}
              </div>
            </div>
          </>
        )}

        {/* Mensagem quando não há artigos na categoria selecionada */}
        {selectedCategory !== 'Todas' && sortedArticles.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-muted-foreground">
              Não há notícias na categoria "{selectedCategory}" no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsGrid;