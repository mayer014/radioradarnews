import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { useLegalContent } from '@/contexts/LegalContentContext';
import { LoadingState } from '@/components/accessibility/LoadingState';
import { sanitizeHtml } from '@/utils/contentSanitizer';

const TermsOfService = () => {
  const { getContent, loading } = useLegalContent();
  const termsContent = getContent('terms_of_service');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatContent = (content: string) => {
    // Converter Markdown básico para HTML
    let formatted = content
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="mb-2">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc pl-6 mb-4">$1</ul>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>')
      .replace(/<p class="mb-4"><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
    
    // SECURITY: Sanitize HTML to prevent XSS attacks
    return sanitizeHtml(formatted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <LoadingState />
        </div>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{termsContent?.title || 'Termos de Uso'} - Portal News</title>
        <meta name="description" content="Termos de Uso do Portal News. Conheça as regras e condições para utilização de nossa plataforma de notícias." />
        <link rel="canonical" href={`${window.location.origin}/termos-uso`} />
      </Helmet>
      
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                {termsContent?.title || 'Termos de Uso'}
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {termsContent ? new Date(termsContent.updated_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
              </p>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {termsContent ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(termsContent.content) 
                  }} 
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Conteúdo dos termos de uso não disponível no momento.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default TermsOfService;