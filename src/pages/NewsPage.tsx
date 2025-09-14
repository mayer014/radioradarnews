import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import NewsGrid from '@/components/NewsGrid';
import Footer from '@/components/Footer';
import { useSearchParams } from 'react-router-dom';
import { getCategoryColors } from '@/utils/categoryColors';
import { useTheme } from '@/contexts/ThemeContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getArticleLink } from '@/lib/utils';

const NewsPage = () => {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { announcePageChange } = useAccessibility();
  const { articles, loading } = useSupabaseNews();
  const [currentPage, setCurrentPage] = useState(1);
  const categoria: string = searchParams.get('categoria') || 'Todas';
  const itemsPerPage = 12;
  
  // Scroll para o topo quando a página carregar ou categoria mudar
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(1); // Reset pagination when category changes
    announcePageChange(`Notícias da categoria ${categoria} carregadas`);
  }, [searchParams, categoria, announcePageChange]);

  // Filter and sort articles
  const filteredArticles = React.useMemo(() => {
    const publishedArticles = articles.filter(article => article.status === 'published');
    
    if (categoria === 'Todas') {
      return publishedArticles;
    }
    
    return publishedArticles.filter(article => article.category === categoria);
  }, [articles, categoria]);

  const sortedArticles = React.useMemo(() => {
    return [...filteredArticles].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredArticles]);

  // Pagination
  const totalPages = Math.ceil(sortedArticles.length / itemsPerPage);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obter cores da categoria apenas no modo claro
  const categoryColors = theme === 'light' ? getCategoryColors(categoria, theme) : null;
  
  // Mapear cores específicas para backgrounds discretos no modo claro
  const getCategoryBackground = (categoryName: string) => {
    if (theme === 'dark') return 'bg-background';
    
    const backgroundMap: { [key: string]: string } = {
      'Política': 'bg-gradient-to-br from-blue-50/80 via-background to-blue-50/40',
      'Policial': 'bg-gradient-to-br from-red-50/80 via-background to-red-50/40',
      'Entretenimento': 'bg-gradient-to-br from-purple-50/80 via-background to-purple-50/40',
      'Internacional': 'bg-gradient-to-br from-green-50/80 via-background to-green-50/40',
      'Esportes': 'bg-gradient-to-br from-orange-50/80 via-background to-orange-50/40',
      'Tecnologia / Economia': 'bg-gradient-to-br from-cyan-50/80 via-background to-cyan-50/40',
      'Ciência / Saúde': 'bg-gradient-to-br from-violet-50/80 via-background to-violet-50/40',
      'Todas': 'bg-background'
    };
    
    return backgroundMap[categoryName] || 'bg-background';
  };

  // Generate dynamic SEO content
  const categoryTitle = categoria === 'Todas' ? 'Todas as Notícias' : `Notícias de ${categoria}`;
  const categoryDescription = categoria === 'Todas' 
    ? 'Acompanhe todas as notícias mais recentes do Portal News. Política, economia, esportes, cultura e muito mais em um só lugar.'
    : `Últimas notícias de ${categoria}. Cobertura completa e atualizada sobre ${categoria.toLowerCase()} no Portal News.`;

  // If no category is specified, show the NewsGrid (homepage)
  if (categoria === 'Todas') {
    return (
      <div className={`min-h-screen ${getCategoryBackground(categoria)}`}>
        <SEOHead 
          title={`${categoryTitle} - Portal News`}
          description={categoryDescription}
          keywords={[
            'portal news', 'notícias', (categoria as string).toLowerCase(), 'brasil', 'jornalismo',
            'última hora', 'notícias atualizadas', categoria === 'Todas' ? 'todas categorias' : (categoria as string).toLowerCase()
          ]}
          url={window.location.href}
          canonical={`${window.location.origin}/noticias${categoria !== 'Todas' ? `?categoria=${categoria}` : ''}`}
        />
        
        <BreadcrumbStructuredData items={[
          { name: 'Início', url: window.location.origin },
          { name: 'Notícias', url: `${window.location.origin}/noticias` },
          ...(categoria !== 'Todas' ? [{ name: categoria, url: `${window.location.origin}/noticias?categoria=${categoria}` }] : [])
        ]} />
        
        <Navigation />
        
        <main className="pt-20" id="main-content" tabIndex={-1}>
          <NewsGrid />
        </main>
        
        <Footer />
      </div>
    );
  }

  // Category-specific page showing ALL articles
  return (
    <div className={`min-h-screen ${getCategoryBackground(categoria)}`}>
      <SEOHead 
        title={`${categoryTitle} - Portal News`}
        description={categoryDescription}
        keywords={[
          'portal news', 'notícias', (categoria as string).toLowerCase(), 'brasil', 'jornalismo',
          'última hora', 'notícias atualizadas', (categoria as string).toLowerCase()
        ]}
        url={window.location.href}
        canonical={`${window.location.origin}/noticias?categoria=${categoria}`}
      />
      
      <BreadcrumbStructuredData items={[
        { name: 'Início', url: window.location.origin },
        { name: 'Notícias', url: `${window.location.origin}/noticias` },
        { name: categoria, url: `${window.location.origin}/noticias?categoria=${categoria}` }
      ]} />
      
      <Navigation />
      
      {/* Back button */}
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/noticias" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às notícias
          </Link>
        </div>
      </div>

      <main className="pt-8 pb-16" id="main-content" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-1 h-8 bg-primary rounded-full`}></div>
              <h1 className="text-3xl font-bold">{categoryTitle}</h1>
              <Badge variant="outline" className="text-primary bg-primary/10 border-primary/30">
                {sortedArticles.length} {sortedArticles.length === 1 ? 'artigo' : 'artigos'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {categoryDescription}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No Articles */}
          {!loading && sortedArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhuma matéria encontrada para a categoria {categoria}.
              </p>
              <Link to="/noticias">
                <Button className="mt-4">
                  Ver todas as notícias
                </Button>
              </Link>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && paginatedArticles.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedArticles.map((article) => (
                  <Link key={article.id} to={getArticleLink(article)}>
                    <Card className="group bg-gradient-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full">
                      {article.featured_image && (
                        <div className="relative">
                          <img
                            src={article.featured_image}
                            alt={`Imagem do artigo: ${article.title}`}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {article.featured && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-primary text-primary-foreground">
                                DESTAQUE
                              </Badge>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                          <Clock className="h-4 w-4 ml-2" />
                          {new Date(article.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        
                        <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 flex-1">
                          {article.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-xs text-muted-foreground">
                            {article.views || 0} visualizações
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-primary/10 hover:border-primary/50"
                          >
                            Ler mais
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NewsPage;