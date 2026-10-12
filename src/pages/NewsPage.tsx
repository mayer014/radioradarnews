import PageHeader from '@/components/layout/PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import NewsGrid from '@/components/NewsGrid';
import { useSearchParams } from 'react-router-dom';


import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    return publishedArticles.filter(article => getInternalCategorySlug(article.category) === getInternalCategorySlug(categoria));
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

  const categoryTitle = categoria === 'Todas' ? 'Todas as Notícias' : `Notícias de ${displayCategory}`;
  const categoryDescription = categoria === 'Todas' 
    ? 'Acompanhe todas as notícias mais recentes do Portal News.'
    : `Últimas notícias de ${displayCategory}. Cobertura completa e atualizada.`;

  // "Todas" → show NewsGrid (homepage-style)
  if (categoria === 'Todas') {
    return (
      <div className="min-h-screen">
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
        <main className="page-container news-overview" id="main-content" tabIndex={-1}>
          <PageHeader icon={Calendar} eyebrow="Redação Rádio Radar" title="Todas as notícias" description="Acompanhe os destaques e explore os assuntos que importam para você." />
          <NewsGrid />
        </main>
      </div>
    );
  }

  // Category-specific: full paginated listing
  return (
    <div className="min-h-screen">
      <SEOHead 
        title={`${categoryTitle} - Portal News`}
        description={categoryDescription}
        keywords={['portal news', 'notícias', displayCategory.toLowerCase(), 'brasil']}
        url={window.location.href}
        canonical={`${window.location.origin}/noticias?categoria=${categoria}`}
      />
      <main className="page-container" id="main-content" tabIndex={-1}>
        <div className="max-w-7xl mx-auto">
          <PageHeader icon={Calendar} eyebrow="Notícias" title={displayCategory} description={categoryDescription} backTo="/noticias" backLabel="Todas as notícias" actions={<Badge variant="outline">{sortedArticles.length} artigos</Badge>} />
          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-card border-primary/20 h-72 animate-pulse" />
              ))}
            </div>
          ) : paginatedArticles.length === 0 ? (
            <Card className="bg-card border-primary/30 p-8 text-center">
              <p className="text-muted-foreground">Nenhuma notícia publicada na categoria {displayCategory}.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedArticles.map(article => (
                  <Card key={article.id} className="bg-card border-primary/20 overflow-hidden group">
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
    </div>
  );
};

export default NewsPage;