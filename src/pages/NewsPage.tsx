import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
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
        <RadioPlayer />
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
          'portal news', 'notícias', categoria.toLowerCase(), 'brasil'
        ]}
        url={window.location.href}
        canonical={`${window.location.origin}/noticias?categoria=${categoria}`}
      />
      
      <Navigation />
      
      <main className="pt-20" id="main-content" tabIndex={-1}>
        <NewsGrid />
      </main>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default NewsPage;