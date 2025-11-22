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
  Settings,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContentExtractorStep from './ContentExtractorStep';
import ContentRewriterStep from './ContentRewriterStep';
import { useSupabaseAIConfig } from '@/contexts/SupabaseAIConfigContext';
import type { ExtractedContent } from '@/services/ContentExtractor';
import type { RewrittenContent } from '@/services/AIContentRewriter';
import { VPSImageService } from '@/services/VPSImageService';
import { supabase } from '@/integrations/supabase/client';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState<string>('');
  const { configurations } = useSupabaseAIConfig();
  
  // Check if we have any AI configuration
  const isAIConfigured = configurations.length > 0;

  const handleContentExtracted = (content: ExtractedContent) => {
    setExtractedContent(content);
    setCurrentStep('rewrite');
  };

  const handleUseDirectly = async (content: ExtractedContent) => {
    console.log('🔄 Usando conteúdo diretamente (sem IA), migrando imagem...');
    setIsProcessingImage(true);
    setImageStatus('Preparando conteúdo...');
    
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

    // IMPORTANTE: Migrar imagem para VPS com múltiplas tentativas
    let vpsImageUrl: string | undefined;
    if (content.mainImage) {
      setImageStatus('Baixando imagem...');
      vpsImageUrl = await downloadAndUploadImage(content.mainImage, 'modo direto');
    } else {
      setImageStatus('Nenhuma imagem encontrada na URL');
    }

    setExtractedContent(content);
    setRewrittenContent(directContent);
    setCurrentStep('complete');
    setIsProcessingImage(false);
    setImageStatus('');
    
    // Armazenar URL do VPS para uso posterior
    if (vpsImageUrl) {
      (directContent as any).vpsImageUrl = vpsImageUrl;
    }
  };

  // Função auxiliar para baixar e fazer upload de imagens com retry logic
  const downloadAndUploadImage = async (imageUrl: string, context: string): Promise<string | undefined> => {
    const maxAttempts = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setImageStatus(`Tentativa ${attempt}/${maxAttempts}: Baixando imagem...`);
        console.log(`📥 [Tentativa ${attempt}/${maxAttempts}] Baixando imagem (${context}):`, imageUrl.substring(0, 100));
        
        // Tentar com diferentes métodos
        let blob: Blob;
        
        if (attempt === 1) {
          // Tentativa 1: Fetch direto
          const response = await fetch(imageUrl, {
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          blob = await response.blob();
        } else if (attempt === 2) {
          // Tentativa 2: Fetch com proxy CORS
          setImageStatus(`Tentativa ${attempt}/${maxAttempts}: Usando proxy...`);
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Proxy failed: ${response.status}`);
          }
          
          blob = await response.blob();
        } else {
          // Tentativa 3: Usar image-proxy edge function
          setImageStatus(`Tentativa ${attempt}/${maxAttempts}: Usando servidor proxy...`);
          const { data, error } = await supabase.functions.invoke('image-proxy', {
            body: { url: imageUrl }  // Corrigido: usar 'url' ao invés de 'imageUrl'
          });
          
          if (error) throw error;
          if (!data || !data.success) throw new Error(data?.error || 'Proxy failed');
          
          // Converter base64 para blob
          const base64Data = data.base64;  // Corrigido: usar 'base64' ao invés de 'imageData'
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: data.mime_type || 'image/jpeg' });
        }
        
        console.log(`✅ Imagem baixada (tentativa ${attempt}), tamanho:`, (blob.size / 1024).toFixed(2), 'KB');
        
        // Fazer upload para VPS
        setImageStatus(`Enviando imagem para o servidor...`);
        const file = new File([blob], `imported-${Date.now()}.jpg`, { 
          type: blob.type || 'image/jpeg' 
        });
        
        console.log(`📤 Enviando para VPS (${context}, tentativa ${attempt})...`);
        const vpsResult = await VPSImageService.uploadImage(file, 'article');
        
        if (vpsResult.success && vpsResult.url) {
          console.log(`✅ Upload VPS concluído (${context}, tentativa ${attempt}):`, vpsResult.url);
          setImageStatus('Imagem importada com sucesso!');
          return vpsResult.url;
        } else {
          throw new Error(vpsResult.error || 'Upload VPS falhou');
        }
      } catch (err) {
        lastError = err;
        console.error(`❌ Tentativa ${attempt} falhou (${context}):`, err);
        
        // Se não é a última tentativa, esperar antes de tentar novamente
        if (attempt < maxAttempts) {
          setImageStatus(`Tentativa ${attempt} falhou. Tentando novamente...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    console.error(`❌ Todas as ${maxAttempts} tentativas falharam para baixar/upload da imagem (${context}):`, lastError);
    setImageStatus('Falha ao importar imagem. Você poderá fazer upload manual.');
    return undefined;
  };

  const handleContentRewritten = (content: RewrittenContent) => {
    setRewrittenContent(content);
    setCurrentStep('complete');
  };

  const handleUseContent = async () => {
    if (rewrittenContent) {
      setIsProcessingImage(true);
      console.log('🔄 Finalizando importação, verificando imagem VPS...');
      
      // Verificar se já temos uma URL do VPS do modo direto
      let vpsImageUrl = (rewrittenContent as any).vpsImageUrl;
      
      // Se não temos, tentar migrar agora com múltiplas tentativas
      if (!vpsImageUrl && extractedContent?.mainImage) {
        setImageStatus('Processando imagem...');
        vpsImageUrl = await downloadAndUploadImage(extractedContent.mainImage, 'finalização');
      } else if (!extractedContent?.mainImage) {
        console.warn('⚠️ Nenhuma imagem principal encontrada no conteúdo extraído');
        setImageStatus('Nenhuma imagem encontrada');
      } else {
        console.log('✅ Usando imagem VPS já migrada:', vpsImageUrl);
        setImageStatus('Usando imagem já processada');
      }

      // IMPORTANTE: Sempre usar a imagem do VPS se disponível, caso contrário não usar imagem
      const generatedImage = vpsImageUrl ? { url: vpsImageUrl } : undefined;

      console.log('📦 Finalizando importação:', {
        hasVPSImage: !!vpsImageUrl,
        imageUrl: vpsImageUrl || 'nenhuma'
      });

      setIsProcessingImage(false);
      setImageStatus('');

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
      {isProcessingImage && imageStatus && (
        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="font-semibold">Processando imagem</p>
              <p className="text-sm text-muted-foreground">{imageStatus}</p>
            </div>
          </div>
        </Card>
      )}

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