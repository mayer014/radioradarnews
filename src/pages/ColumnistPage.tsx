import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Share2, ArrowLeft, User, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { getArticleLink } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { ColumnistStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { LoadingState, ColumnistSkeleton } from '@/components/accessibility/LoadingState';
import { generatePageTitle, generateBreadcrumbData, optimizeImageAlt } from '@/utils/seoUtils';
import useAccessibility, { useLoadingAnnouncement } from '@/hooks/useAccessibility';
import BannerDisplay from '@/components/BannerDisplay';
import { useBanners } from '@/hooks/useBanners';

const ColumnistPage = () => {
  const { columnistId } = useParams<{ columnistId: string }>();
  const { getArticlesByColumnist } = useSupabaseNews();
  const { users, isLoading: usersLoading } = useUsers();
  const { announcePageChange } = useAccessibility();
  const { announceLoadingState } = useLoadingAnnouncement();
  const { getActiveBanner } = useBanners();
  const [isLoading, setIsLoading] = React.useState(true);
  const [columnistBanner, setColumnistBanner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const articles = columnistId ? getArticlesByColumnist(columnistId) : [];
  
  const columnistUser = users.find(user => user.id === columnistId && user.role === 'colunista');
  const isColumnistActive = columnistUser?.columnistProfile?.isActive ?? false;
  
  // Use the user data directly to ensure we have the latest avatar
  const currentColumnist = columnistUser?.columnistProfile;
  
  // Data loading and banner fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        announceLoadingState?.(true, 'perfil do colunista');
        if (columnistId) {
          const banner = await getActiveBanner('columnist', undefined, columnistId);
          if (mounted) setColumnistBanner(banner);
        }
      } catch (err) {
        console.error('Erro ao carregar banner do colunista:', err);
      } finally {
        if (mounted) setIsLoading(false);
        announceLoadingState?.(false, 'perfil do colunista');
        announcePageChange?.(`Perfil do colunista ${currentColumnist?.name || ''}`);
      }
    })();
    return () => { mounted = false; };
  }, [columnistId, getActiveBanner]);
  
  // Organizar artigos por data (mais recentes primeiro) - excluir cópias automáticas
  const sortedArticles = [...articles]
    .filter(article => !article.is_column_copy)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Separar artigo em destaque dos demais
  const featuredArticle = sortedArticles.find(article => article.featured);
  const regularArticles = sortedArticles.filter(article => !article.featured);

  // Pagination apenas para artigos regulares
  const totalPages = Math.ceil(regularArticles.length / itemsPerPage);
  const paginatedArticles = regularArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate SEO data
  const currentUrl = window.location.href;
  const pageTitle = generatePageTitle(`${currentColumnist?.name || 'Colunista'}`, 'Colunistas');
  const metaDescription = currentColumnist 
    ? `Confira todos os artigos de ${currentColumnist.name}, especialista em ${currentColumnist.specialty}. ${currentColumnist.bio.substring(0, 100)}...`
    : 'Perfil do colunista no Portal News';
  const breadcrumbData = generateBreadcrumbData(window.location.pathname, currentColumnist?.name);

  // Loading state
  if (isLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Carregando colunista..."
          description="Portal News - Carregando perfil do colunista"
        />
        <Navigation />
        <main className="max-w-4xl mx-auto px-6 py-8" id="main-content">
          <ColumnistSkeleton />
        </main>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  if (!currentColumnist || !isColumnistActive) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Colunista não encontrado - Portal News"
          description="O colunista solicitado não foi encontrado ou não está ativo no momento."
        />
        <Navigation />
        <main className="flex items-center justify-center min-h-screen" id="main-content">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              {!currentColumnist ? 'Colunista não encontrado' : 'Colunista não está ativo no momento'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {!currentColumnist 
                ? 'O colunista que você está procurando não existe.' 
                : 'Este colunista não está publicando artigos no momento.'
              }
            </p>
            <Link to="/">
              <Button className="bg-gradient-hero hover:shadow-glow-primary">
                Voltar ao início
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageTitle}
        description={metaDescription}
        keywords={['colunista', currentColumnist.name.toLowerCase(), currentColumnist.specialty.toLowerCase(), 'artigos', 'opinião']}
        image={currentColumnist.avatar}
        url={currentUrl}
        type="website"
        author={currentColumnist.name}
      />
      
      {currentColumnist && (
        <ColumnistStructuredData 
          columnist={currentColumnist} 
          articlesCount={sortedArticles.length}
          url={currentUrl} 
        />
      )}
      
      <BreadcrumbStructuredData items={breadcrumbData} />
      
      <Navigation />
      
      {/* Breadcrumb e botão voltar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às notícias
          </Link>
        </div>
      </div>

      {/* Perfil do colunista */}
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-8" tabIndex={-1}>
        
        {/* Header do colunista */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-gradient-card rounded-lg border border-primary/20">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                {currentColumnist.avatar && currentColumnist.avatar !== '' ? (
                  <img
                    src={currentColumnist.avatar}
                    alt={optimizeImageAlt(currentColumnist.name, "Foto do colunista")}
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      console.error('Error loading columnist avatar in ColumnistPage:', currentColumnist.avatar?.substring(0, 100));
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                          <span class="text-4xl text-muted-foreground font-bold">${currentColumnist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground font-bold">
                      {currentColumnist.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2">
                <BookOpen className="w-4 w-4 text-primary-foreground" />
              </div>
            </div>

            {/* Info do colunista */}
            <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
              {currentColumnist.name}
            </h1>
            <p className="text-xl text-primary font-semibold mb-4">
              {currentColumnist.specialty}
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {currentColumnist.bio}
            </p>
              
              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{articles.length} artigos publicados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Colunista</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Aviso de Responsabilidade */}
        <div className="mb-8 p-4 sm:p-5 bg-muted/30 border-l-4 border-primary/60 rounded-lg">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Aviso Importante:</span> Este é um colunista independente. 
            As opiniões, análises e conteúdos expressos em seus artigos são de exclusiva responsabilidade do autor, 
            não representando necessariamente a posição editorial deste portal. O colunista é o único responsável 
            pela veracidade, precisão e legalidade das informações e opiniões apresentadas em suas publicações.
          </p>
        </div>

        {/* Columnist Banner */}
        {columnistBanner && (
          <div className="mb-8">
            <BannerDisplay 
              banner={columnistBanner} 
              position="columnist"
            />
          </div>
        )}

        <Separator className="my-8" />

        {/* Artigos do colunista */}
        <div>
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-primary" />
            Artigos de {currentColumnist.name.split(' ')[0]}
          </h2>
          
          {sortedArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
            </div>
          ) : (
            <>
              {/* Artigo em Destaque */}
              {featuredArticle && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Badge className="bg-gradient-hero text-primary-foreground px-4 py-1.5 text-sm sm:text-base shadow-glow-primary">
                      ⭐ ARTIGO EM DESTAQUE
                    </Badge>
                  </div>
                  
                  <Link to={getArticleLink(featuredArticle)}>
                    <Card className="group bg-gradient-hero-subtle backdrop-blur-sm border-2 border-primary/40 hover:border-primary/70 transition-all duration-300 hover:scale-[1.01] overflow-hidden shadow-glow-primary hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]">
                      {/* Imagem grande do artigo em destaque */}
                      <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden bg-muted/20">
                        <img
                          src={featuredArticle.featured_image}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Badge destaque flutuante */}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-gradient-hero text-primary-foreground shadow-glow-primary text-xs sm:text-sm px-3 py-1">
                            ⭐ DESTAQUE
                          </Badge>
                        </div>
                      </div>

                      {/* Conteúdo do artigo em destaque - ABAIXO da imagem */}
                      <div className="p-5 sm:p-7 md:p-9">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                          <Badge variant="outline" className="border-primary/60 text-sm sm:text-base px-3 py-1">
                            {featuredArticle.category}
                          </Badge>
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            <span className="whitespace-nowrap">{new Date(featuredArticle.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5 text-foreground group-hover:text-primary transition-colors duration-300 leading-tight break-words">
                          {featuredArticle.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-5 sm:mb-7 text-sm sm:text-base md:text-lg line-clamp-3 sm:line-clamp-4 leading-relaxed">
                          {featuredArticle.excerpt}
                        </p>

                        <Button 
                          size="lg"
                          className="bg-gradient-hero hover:shadow-glow-primary w-full sm:w-auto text-sm sm:text-base md:text-lg px-6 py-3 sm:px-8 sm:py-4"
                        >
                          📖 Ler artigo completo
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Outros Artigos */}
              {regularArticles.length > 0 && (
                <>
                  {featuredArticle && (
                    <div className="flex items-center gap-3 mb-8 mt-4">
                      <Separator className="flex-1" />
                      <span className="text-sm sm:text-base text-muted-foreground font-semibold">OUTROS ARTIGOS</span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  
                  <div className="mb-6 text-sm text-muted-foreground">
                    Mostrando {paginatedArticles.length} de {regularArticles.length} artigos
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 mb-8">
                    {paginatedArticles.map((article) => (
                    <Link key={article.id} to={getArticleLink(article)}>
                      <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.01] overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 p-4 sm:p-5">
                          {/* Imagem do artigo */}
                          <div className="relative rounded-lg flex-shrink-0 bg-muted/20 w-full sm:w-28 h-40 sm:h-28">
                            <img
                              src={article.featured_image}
                              alt={article.title}
                              className="w-full h-full object-cover sm:object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          {/* Conteúdo do artigo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs">
                                {article.category}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span className="whitespace-nowrap">{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>

                            <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 break-words">
                              {article.title}
                            </h3>
                            
                            <p className="text-muted-foreground mb-3 text-xs sm:text-sm line-clamp-2 break-words">
                              {article.excerpt}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                              <div className="flex items-center text-xs text-muted-foreground order-2 sm:order-1">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{new Date(article.created_at).toLocaleString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="hover:bg-primary/10 hover:border-primary/50 w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm"
                              >
                                Ler artigo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                    ))}
                  </div>
                </>
              )}

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
      <RadioPlayer />
    </div>
  );
};

export default ColumnistPage;