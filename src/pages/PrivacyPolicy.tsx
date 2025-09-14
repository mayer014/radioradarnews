import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { useLegalContent } from '@/contexts/LegalContentContext';
import { LoadingState } from '@/components/accessibility/LoadingState';

const PrivacyPolicy = () => {
  const { getContent, loading } = useLegalContent();
  const privacyContent = getContent('privacy_policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatContent = (content: string) => {
    // Converter Markdown básico para HTML
    return content
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="mb-2">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc pl-6 mb-4">$1</ul>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>')
      .replace(/<p class="mb-4"><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <LoadingState />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{privacyContent?.title || 'Política de Privacidade'} - Portal News</title>
        <meta name="description" content="Política de Privacidade do Portal News em conformidade com a LGPD. Saiba como protegemos seus dados pessoais." />
        <link rel="canonical" href={`${window.location.origin}/politica-privacidade`} />
      </Helmet>
      
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                {privacyContent?.title || 'Política de Privacidade'}
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {privacyContent ? new Date(privacyContent.updated_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
              </p>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {privacyContent ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(privacyContent.content) 
                  }} 
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Conteúdo da política de privacidade não disponível no momento.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;