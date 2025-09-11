import React, { useEffect } from 'react';
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

const NewsPage = () => {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { announcePageChange } = useAccessibility();
  const categoria = searchParams.get('categoria') || 'Todas';
  
  // Scroll para o topo quando a página carregar ou categoria mudar
  useEffect(() => {
    window.scrollTo(0, 0);
    announcePageChange(`Notícias da categoria ${categoria} carregadas`);
  }, [searchParams, categoria, announcePageChange]);

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
      'Tecnologia': 'bg-gradient-to-br from-cyan-50/80 via-background to-cyan-50/40',
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

  return (
    <div className={`min-h-screen ${getCategoryBackground(categoria)}`}>
      <SEOHead 
        title={`${categoryTitle} - Portal News`}
        description={categoryDescription}
        keywords={[
          'portal news', 'notícias', categoria.toLowerCase(), 'brasil', 'jornalismo',
          'última hora', 'notícias atualizadas', categoria === 'Todas' ? 'todas categorias' : categoria.toLowerCase()
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
};

export default NewsPage;