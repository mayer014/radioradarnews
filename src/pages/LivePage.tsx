import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import LiveSection from '@/components/LiveSection';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import useAccessibility from '@/hooks/useAccessibility';

const LivePage = () => {
  const { announcePageChange } = useAccessibility();

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
    announcePageChange('Página ao vivo carregada');
  }, [announcePageChange]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Ao Vivo 24h - Transmissão Online | Portal News"
        description="Acompanhe nossa transmissão ao vivo 24 horas. Programas especiais, entrevistas exclusivas, debates e notícias em tempo real."
        keywords={['ao vivo', 'transmissão online', 'radio online', 'portal news ao vivo', 'programa ao vivo', '24 horas']}
        url={window.location.href}
        canonical={`${window.location.origin}/ao-vivo`}
      />
      
      <BreadcrumbStructuredData items={[
        { name: 'Início', url: window.location.origin },
        { name: 'Ao Vivo', url: `${window.location.origin}/ao-vivo` }
      ]} />
      
      <Navigation />
      
      <main className="pt-20" id="main-content" tabIndex={-1}>
        <LiveSection />
      </main>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default LivePage;