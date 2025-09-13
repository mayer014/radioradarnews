import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Share2, ArrowLeft, User, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { useNews } from '@/contexts/NewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { getArticleLink } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { ColumnistStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { LoadingState, ColumnistSkeleton } from '@/components/accessibility/LoadingState';
import { generatePageTitle, generateBreadcrumbData, optimizeImageAlt } from '@/utils/seoUtils';
import useAccessibility, { useLoadingAnnouncement } from '@/hooks/useAccessibility';

const ColumnistPage = () => {
  const { columnistId } = useParams<{ columnistId: string }>();
  const { getColumnistById, getArticlesByColumnist } = useNews();
  const { users } = useUsers();
  const { announcePageChange } = useAccessibility();
  const { announceLoadingState } = useLoadingAnnouncement();
  const [isLoading, setIsLoading] = React.useState(true);
  
  const columnist = columnistId ? getColumnistById(columnistId) : null;
  const articles = columnistId ? getArticlesByColumnist(columnistId) : [];
  
  // Loading state and scroll management
  useEffect(() => {
    setIsLoading(true);
    announceLoadingState(true, 'perfil do colunista');
    window.scrollTo(0, 0);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      announceLoadingState(false, 'perfil do colunista');
      
      if (columnist) {
        announcePageChange(`Perfil do colunista carregado: ${columnist.name}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [columnistId, columnist, announceLoadingState, announcePageChange]);
  
  const columnistUser = users.find(user => user.id === columnistId && user.role === 'colunista');
  const isColumnistActive = columnistUser?.columnistProfile?.isActive ?? false;
  
  // Use the user data directly to ensure we have the latest avatar
  const currentColumnist = columnistUser?.columnistProfile || columnist;
  
  // Debug log to check avatar data
  // Debug avatar data
  
  // Organizar artigos por data (mais recentes primeiro) - excluir cópias automáticas
  const sortedArticles = [...articles]
    .filter(article => !article.isColumnCopy)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Generate SEO data
  const currentUrl = window.location.href;
  const pageTitle = generatePageTitle(`${currentColumnist?.name || 'Colunista'}`, 'Colunistas');
  const metaDescription = currentColumnist 
    ? `Confira todos os artigos de ${currentColumnist.name}, especialista em ${currentColumnist.specialty}. ${currentColumnist.bio.substring(0, 100)}...`
    : 'Perfil do colunista no Portal News';
  const breadcrumbData = generateBreadcrumbData(window.location.pathname, currentColumnist?.name);

  // Loading state
  if (isLoading) {
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
              {!columnist ? 'Colunista não encontrado' : 'Colunista não está ativo no momento'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {!columnist 
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
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
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
            <div className="grid grid-cols-1 gap-6">
              {sortedArticles.map((article) => (
                <Link key={article.id} to={getArticleLink(article)}>
                  <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                    <div className="flex gap-6 p-6">
                      {/* Imagem do artigo */}
                      <div className="relative rounded-lg flex-shrink-0 bg-muted/20">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-32 h-32 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                        {article.featured && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              DESTAQUE
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Conteúdo do artigo */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/50 transition-colors">
                            {article.category}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(article.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4 text-sm line-clamp-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{new Date(article.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-primary/10 hover:border-primary/50"
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
          )}
        </div>
      </main>

      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default ColumnistPage;