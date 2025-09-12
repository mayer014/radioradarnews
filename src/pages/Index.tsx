import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import NewBanner from '@/components/NewBanner';
import LatestNews from '@/components/LatestNews';
import LatestColumnistArticles from '@/components/LatestColumnistArticles';
import NewsGrid from '@/components/NewsGrid';
import LiveSection from '@/components/LiveSection';
import NewsletterSubscription from '@/components/NewsletterSubscription';
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
      
      {/* Banner Principal */}
      <NewBanner slotKey="hero" />
      
      {/* Banner Lateral (teste) */}
      <NewBanner slotKey="sidebar" />
      
      {/* Últimas Notícias */}
      <LatestNews />
      
      {/* Últimos Artigos dos Colunistas */}
      <LatestColumnistArticles />
      
      {/* Seção de Notícias */}
      <NewsGrid />
      
      {/* Seção Ao Vivo */}
      <LiveSection />
      
      {/* Banner Teste Categoria */}
      <NewBanner slotKey="category-tecnologia" />
      
      {/* Newsletter Subscription - Seção destacada */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              🔔 Não perca nenhuma notícia!
            </h2>
            <p className="text-lg text-muted-foreground">
              Cadastre-se e receba as principais notícias diretamente no seu email
            </p>
          </div>
          <NewsletterSubscription variant="inline" source="homepage" />
        </div>
      </section>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Player de Rádio Fixo */}
      <RadioPlayer />
    </div>
  );
};

export default Index;
