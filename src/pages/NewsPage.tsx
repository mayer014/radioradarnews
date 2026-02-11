import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import NewsGrid from '@/components/NewsGrid';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
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
import { getInternalCategorySlug, getDisplayCategoryName } from '@/utils/categoryMapper';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const NewsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { announcePageChange } = useAccessibility();
  const { articles, loading } = useSupabaseNews();
  const [currentPage, setCurrentPage] = useState(1);
  const categoria: string = searchParams.get('categoria') || 'Todas';
  const itemsPerPage = 12;
  
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(1);
    announcePageChange(`Notícias da categoria ${categoria} carregadas`);
  }, [searchParams, categoria, announcePageChange]);

  const displayCategory = useMemo(() => {
    if (categoria === 'Todas') return 'Todas';
    return getDisplayCategoryName(categoria);
  }, [categoria]);

  const filteredArticles = useMemo(() => {
    const publishedArticles = (articles ?? []).filter(article => article.status === 'published' && !article.columnist_id && !article.is_column_copy);
    if (categoria === 'Todas') return publishedArticles;
    return publishedArticles.filter(article => article.category === categoria);
  }, [articles, categoria]);

  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredArticles]);

  const totalPages = Math.ceil(sortedArticles.length / itemsPerPage);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const categoryTitle = categoria === 'Todas' ? 'Todas as Notícias' : `Notícias de ${displayCategory}`;
  const categoryDescription = categoria === 'Todas' 
    ? 'Acompanhe todas as notícias mais recentes do Portal News.'
    : `Últimas notícias de ${displayCategory}. Cobertura completa e atualizada.`;

  // "Todas" → show NewsGrid (homepage-style)
  if (categoria === 'Todas') {
    return (
      <div className={`min-h-screen ${getCategoryBackground('Todas')}`}>
        <SEOHead 
          title={`${categoryTitle} - Portal News`}
          description={categoryDescription}
          keywords={['portal news', 'notícias', 'brasil']}
          url={window.location.href}
          canonical={`${window.location.origin}/noticias`}
        />
        <BreadcrumbStructuredData items={[
          { name: 'Início', url: window.location.origin },
          { name: 'Notícias', url: `${window.location.origin}/noticias` },
        ]} />
        <Navigation />
        <main className="pt-20" id="main-content" tabIndex={-1}>
          <NewsGrid />
        </main>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  // Category-specific: full paginated listing
  return (
    <div className={`min-h-screen ${getCategoryBackground(displayCategory)}`}>
      <SEOHead 
        title={`${categoryTitle} - Portal News`}
        description={categoryDescription}
        keywords={['portal news', 'notícias', displayCategory.toLowerCase(), 'brasil']}
        url={window.location.href}
        canonical={`${window.location.origin}/noticias?categoria=${categoria}`}
      />
      <Navigation />
      <main className="pt-20 pb-12" id="main-content" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 mt-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/noticias')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">{displayCategory}</h1>
            <Badge variant="outline" className="text-muted-foreground">
              {sortedArticles.length} {sortedArticles.length === 1 ? 'artigo' : 'artigos'}
            </Badge>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-gradient-card border-primary/20 h-72 animate-pulse" />
              ))}
            </div>
          ) : paginatedArticles.length === 0 ? (
            <Card className="bg-gradient-card border-primary/30 p-8 text-center">
              <p className="text-muted-foreground">Nenhuma notícia publicada na categoria {displayCategory}.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedArticles.map(article => (
                  <Card key={article.id} className="bg-gradient-card border-primary/20 overflow-hidden group">
                    <Link to={getArticleLink(article)} className="block h-full">
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt={`Imagem: ${article.title}`}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                          {article.featured && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">DESTAQUE</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
                        </PaginationItem>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <PaginationItem><span className="px-2 text-muted-foreground">…</span></PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                isActive={page === currentPage}
                                onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        ))}
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
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

export default NewsPage;