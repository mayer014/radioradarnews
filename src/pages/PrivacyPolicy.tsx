import PageHeader from '@/components/layout/PageHeader';
import { ShieldCheck } from 'lucide-react';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { useLegalContent } from '@/contexts/LegalContentContext';
import { LoadingState } from '@/components/accessibility/LoadingState';
import { sanitizeHtml } from '@/utils/contentSanitizer';

const PrivacyPolicy = () => {
  const { getContent, loading } = useLegalContent();
  const privacyContent = getContent('privacy_policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatContent = (content: string) => {
    // Converter Markdown básico para HTML
    const formatted = content
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
      <div className="min-h-screen">
        <div className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{privacyContent?.title || 'Política de Privacidade'} - Portal News</title>
        <meta name="description" content="Política de Privacidade do Portal News em conformidade com a LGPD. Saiba como protegemos seus dados pessoais." />
        <link rel="canonical" href={`${window.location.origin}/politica-privacidade`} />
      </Helmet>
      
      <main id="main-content" tabIndex={-1} className="page-container page-container-narrow">
        <div className="max-w-4xl mx-auto">
          <PageHeader icon={ShieldCheck} eyebrow="Transparência" title={privacyContent?.title || 'Política de privacidade'} description={'Última atualização: ' + (privacyContent ? new Date(privacyContent.updated_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'))} />
          <Card className="p-6 sm:p-10">

            <div className="rich-text-content prose prose-slate dark:prose-invert max-w-none">
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
      </main>
    </div>
  );
};

export default PrivacyPolicy;