import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContentExtractorStep from './ContentExtractorStep';
import ContentRewriterStep from './ContentRewriterStep';
import { useSupabaseAIConfig } from '@/contexts/SupabaseAIConfigContext';
import type { ExtractedContent } from '@/services/ContentExtractor';
import type { RewrittenContent } from '@/services/AIContentRewriter';
import { VPSImageService } from '@/services/VPSImageService';

interface ModularURLImporterProps {
  onImportComplete: (data: {
    rewrittenContent: RewrittenContent;
    generatedImage?: { url: string };
    saveAsDraft: boolean;
  }) => void;
}

const ModularURLImporter: React.FC<ModularURLImporterProps> = ({ onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState<'extract' | 'rewrite' | 'complete'>('extract');
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [rewrittenContent, setRewrittenContent] = useState<RewrittenContent | null>(null);
  const { configurations } = useSupabaseAIConfig();
  
  // Check if we have any AI configuration
  const isAIConfigured = configurations.length > 0;

  const handleContentExtracted = (content: ExtractedContent) => {
    setExtractedContent(content);
    setCurrentStep('rewrite');
  };

  const handleUseDirectly = (content: ExtractedContent) => {
    // Create enhanced content from extracted content with complete article
    const cleanTextContent = content.content.replace(/<[^>]*>/g, '').trim();
    const firstParagraph = cleanTextContent.split('\n')[0] || cleanTextContent.substring(0, 200);
    
    // Create properly formatted HTML content with source
    const formattedContent = `
      ${content.content}
      
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
        <p style="font-style: italic; color: #6b7280; font-size: 0.9rem;">
          <strong>Fonte:</strong> 
          <a href="${content.url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">
            ${content.domain}
          </a>
        </p>
      </div>
    `;

    const directContent: RewrittenContent = {
      title: content.title,
      slug: content.title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 60),
      lead: firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph,
      content_html: formattedContent,
      excerpt: cleanTextContent.length > 150 ? cleanTextContent.substring(0, 150) + '...' : cleanTextContent,
      category_suggestion: 'Policial', // Default category based on common news type
      tags: [content.domain.replace(/^www\./, ''), 'notícia', 'importado'],
      image_prompt: `Imagem ilustrativa para o artigo: ${content.title}`,
      source_url: content.url,
      source_domain: content.domain,
      published_at_suggestion: new Date().toISOString()
    };

    setExtractedContent(content);
    setRewrittenContent(directContent);
    setCurrentStep('complete');
  };

  const handleContentRewritten = (content: RewrittenContent) => {
    setRewrittenContent(content);
    setCurrentStep('complete');
  };

  const handleUseContent = async () => {
    if (rewrittenContent) {
      // Try to download external image and upload to VPS
      let vpsImageUrl: string | undefined;
      try {
        if (extractedContent?.mainImage) {
          const response = await fetch(extractedContent.mainImage);
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], `imported-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
            const vpsResult = await VPSImageService.uploadImage(file, 'article');
            if (vpsResult.success) {
              vpsImageUrl = vpsResult.url;
            }
          }
        }
      } catch (err) {
        console.warn('Falha ao processar imagem externa, continuando sem VPS:', err);
      }

      const generatedImage = vpsImageUrl ? { url: vpsImageUrl } : undefined;

      onImportComplete({
        rewrittenContent,
        generatedImage,
        saveAsDraft: true
      });
      handleReset();
    }
  };

  const handleReset = () => {
    setCurrentStep('extract');
    setExtractedContent(null);
    setRewrittenContent(null);
  };

  const steps = [
    { key: 'extract', name: 'Extrair', completed: extractedContent !== null },
    { key: 'rewrite', name: 'Reescrever', completed: rewrittenContent !== null },
    { key: 'complete', name: 'Concluir', completed: false }
  ];

  return (
    <div className="space-y-6">
      {/* AI Configuration Warning */}
      {!isAIConfigured && (
        <Alert className="border-orange-500/50 bg-orange-50/10">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            <strong>IA não configurada:</strong> Para reescrita inteligente de conteúdo, 
            configure uma API de IA nas configurações do sistema.
            <Button
              variant="link"
              className="p-0 h-auto ml-2 text-orange-600 hover:text-orange-700"
              onClick={() => window.location.hash = '#/admin'}
            >
              <Settings className="h-3 w-3 mr-1" />
              Ir para Configurações → IA/Extração
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <Card className="bg-gradient-card border-primary/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Importador Modular (IA)</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.key
                      ? 'bg-gradient-hero text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <Badge
                  variant={
                    step.completed
                      ? 'default'
                      : currentStep === step.key
                      ? 'default'
                      : 'outline'
                  }
                  className={
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.key
                      ? 'bg-gradient-hero text-white'
                      : 'border-primary/30'
                  }
                >
                  {step.name}
                </Badge>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      {currentStep === 'extract' && (
        <ContentExtractorStep 
          onContentExtracted={handleContentExtracted}
          onUseDirectly={handleUseDirectly}
        />
      )}

      {currentStep === 'rewrite' && extractedContent && (
        <ContentRewriterStep
          extractedContent={extractedContent}
          onContentRewritten={handleContentRewritten}
          onUseOriginal={handleContentRewritten}
        />
      )}

      {currentStep === 'complete' && rewrittenContent && (
        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-hero rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Passo 3: Finalizar</h3>
                <p className="text-sm text-muted-foreground">
                  Seu conteúdo está pronto para ser adicionado ao editor
                </p>
              </div>
            </div>

            <Separator />

            {/* Final Preview */}
            <div className="space-y-4">
              <Card className="bg-muted/20 p-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    {rewrittenContent.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {rewrittenContent.lead}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-primary/50">
                      {rewrittenContent.category_suggestion}
                    </Badge>
                    {rewrittenContent.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Final Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleUseContent}
                  className="bg-gradient-hero hover:shadow-glow-primary flex-1"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Preencher Editor de Notícias
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModularURLImporter;