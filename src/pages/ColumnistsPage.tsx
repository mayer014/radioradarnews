import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, User, ArrowRight, Pen } from 'lucide-react';
import { useUsers } from '@/contexts/UsersContext';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';

const ColumnistsPage = () => {
  const { columnists } = useUsers();
  const { articles } = useSupabaseNews();
  const { announcePageChange } = useAccessibility();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    announcePageChange('Página de colunistas carregada');
  }, [announcePageChange]);

  // Filter only active columnists and sort alphabetically
  const activeColumnists = columnists
    .filter(user => user.columnistProfile?.isActive)
    .sort((a, b) => a.columnistProfile!.name.localeCompare(b.columnistProfile!.name, 'pt-BR'));

  // Get article count for each columnist
  const getColumnistArticleCount = (columnistId: string) => {
    return articles.filter(article => 
      article.columnist_id === columnistId
    ).length;
  };

    return (
    <>
      <SEOHead 
        title="Nossos Colunistas Especializados - Portal News"
        description="Conheça nossos colunistas especializados e seus artigos de opinião sobre política, segurança pública, tecnologia e outros temas relevantes do Brasil."
        keywords={['colunistas', 'artigos opinião', 'análise política', 'segurança pública', 'jornalismo', 'especialistas', 'portal news']}
        url={window.location.href}
        canonical={`${window.location.origin}/colunistas`}
      />
      
      <BreadcrumbStructuredData items={[
        { name: 'Início', url: window.location.origin },
        { name: 'Colunistas', url: `${window.location.origin}/colunistas` }
      ]} />

      <Navigation />
      
      <main className="min-h-screen bg-background" id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative py-20 px-6 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Pen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Nossos Especialistas</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Nossos Colunistas
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Conheça nossos especialistas e suas análises exclusivas sobre os temas mais relevantes da atualidade
            </p>
          </div>
        </section>

        {/* Columnists Grid */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            {activeColumnists.length === 0 ? (
              <div className="text-center py-20">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2 text-muted-foreground">
                  Nenhum colunista ativo
                </h2>
                <p className="text-muted-foreground">
                  No momento não há colunistas ativos no portal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {activeColumnists.map((columnist) => {
                  const profile = columnist.columnistProfile!;
                  const articleCount = getColumnistArticleCount(profile.id);
                  
                  return (
                    <Card key={profile.id} className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                      {/* Columnist Avatar */}
                      <div className="relative h-40 md:h-64 bg-muted/20">
                        {profile.avatar && profile.avatar !== '' ? (
                          <img
                            src={profile.avatar}
                            alt={`Foto de ${profile.name}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              console.error('Error loading columnist avatar in ColumnistsPage:', profile.avatar?.substring(0, 100));
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full bg-muted/50 flex items-center justify-center';
                              fallback.innerHTML = `<span class="text-4xl text-muted-foreground font-bold">${profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>`;
                              (e.target as HTMLImageElement).parentElement!.replaceChild(fallback, (e.target as HTMLImageElement));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                            <span className="text-4xl text-muted-foreground font-bold">
                              {profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 md:top-4 md:left-4">
                          <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-[10px] md:text-xs px-1 py-0.5 md:px-2 md:py-1 flex items-center gap-1">
                            <User className="w-2 h-2 md:w-3 md:h-3" />
                            <span className="hidden md:inline">COLUNISTA</span>
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 md:top-4 md:right-4">
                          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] md:text-xs px-1 py-0.5 md:px-2 md:py-1">
                            <span className="hidden md:inline">{articleCount} {articleCount === 1 ? 'artigo' : 'artigos'}</span>
                            <span className="md:hidden">{articleCount}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Columnist Info */}
                      <div className="p-3 md:p-6">
                        <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                          {profile.name}
                        </h3>
                        
                        <div className="mb-2 md:mb-4">
                          <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
                            {profile.specialty}
                          </span>
                        </div>

                        <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 md:line-clamp-4 mb-3 md:mb-6 leading-tight">
                          {profile.bio}
                        </p>

                        {/* Action Button */}
                        <div className="mt-auto">
                          <Link to={`/colunista/${profile.id}`}>
                            <Button className="w-full bg-gradient-hero hover:shadow-glow-primary transition-all duration-300 text-xs md:text-sm py-2 md:py-3">
                              <User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                              <span className="hidden md:inline">Ver Perfil Completo</span>
                              <span className="md:hidden">Ver Perfil</span>
                              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ColumnistsPage;