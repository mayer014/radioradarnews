import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import LatestNews from '@/components/LatestNews';
import LatestColumnistArticles from '@/components/LatestColumnistArticles';
import NewsGrid from '@/components/NewsGrid';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { SEOHead } from '@/components/seo/SEOHead';
import { WebsiteStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';

const Index = () => {
  const { announcePageChange } = useAccessibility();

  React.useEffect(() => {
    announcePageChange('Página inicial carregada');
  }, [announcePageChange]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Portal News - O Futuro do Jornalismo Digital"
        description="Portal de notícias inovador com rádio integrada. Notícias policiais, política, música e entretenimento com experiência imersiva e design futurista."
        keywords={['portal news', 'notícias', 'jornalismo digital', 'rádio online', 'brasil', 'política', 'policial', 'entretenimento']}
        url={window.location.href}
        canonical={window.location.origin}
      />
      
      <WebsiteStructuredData url={window.location.origin} />
      {/* Navegação Fixa */}
      <Navigation />
      
      {/* Hero Section com Parallax */}
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
      
      {/* Últimas Notícias */}
      <LatestNews />
      
      {/* Últimos Artigos dos Colunistas */}
      <LatestColumnistArticles />
      
      {/* Seção de Notícias */}
      <NewsGrid />
      
      </main>
      
      {/* Footer */}
      <Footer />

      {/* Player de Rádio Fixo */}
      <RadioPlayer />
    </div>
  );
};

export default Index;
