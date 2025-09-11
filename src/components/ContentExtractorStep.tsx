import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  LinkIcon, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Bot
} from 'lucide-react';
import { ContentExtractor, type ExtractedContent } from '@/services/ContentExtractor';

interface ContentExtractorStepProps {
  onContentExtracted: (content: ExtractedContent) => void;
  onUseDirectly: (content: ExtractedContent) => void;
}

const ContentExtractorStep: React.FC<ContentExtractorStepProps> = ({ onContentExtracted, onUseDirectly }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for content extraction
  const extractTitle = (doc: Document): string => {
    const titleSources = [
      () => doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      () => doc.querySelector('h1')?.textContent?.trim(),
      () => doc.querySelector('title')?.textContent?.trim(),
      () => doc.querySelector('.title, .headline, [class*="title"], [class*="headline"]')?.textContent?.trim()
    ];

    for (const source of titleSources) {
      const title = source();
      if (title && title.length > 0) {
        return title;
      }
    }

    return 'Título não encontrado';
  };

  const extractMainImage = (doc: Document, baseUrl: string): string | undefined => {
    const imageSources = [
      () => doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      () => doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
      () => doc.querySelector('article img, .article img, .content img')?.getAttribute('src'),
      () => doc.querySelector('img')?.getAttribute('src')
    ];

    for (const source of imageSources) {
      const imageUrl = source();
      if (imageUrl) {
        try {
          return new URL(imageUrl, baseUrl).href;
        } catch {
          return imageUrl;
        }
      }
    }

    return undefined;
  };

  const hasSignificantText = (element: Element): boolean => {
    const textContent = element.textContent || '';
    const textLength = textContent.trim().length;
    const paragraphs = element.querySelectorAll('p').length;
    
    return textLength > 150 && paragraphs >= 1;
  };

  const extractStructuredContent = (element: Element): string => {
    const contentParts: string[] = [];
    const elements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote');
    
    elements.forEach(el => {
      const text = el.textContent?.trim() || '';
      const tagName = el.tagName.toLowerCase();
      
      if (text.length < 20) return;
      
      if (tagName.startsWith('h')) {
        contentParts.push(`<${tagName}>${text}</${tagName}>`);
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(el.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(item => item && item.length > 5)
          .map(item => `<li>${item}</li>`)
          .join('');
        
        if (listItems) {
          contentParts.push(`<${tagName}>${listItems}</${tagName}>`);
        }
      } else if (text.length > 30) {
        contentParts.push(`<p>${text}</p>`);
      }
    });
    
    return contentParts.join('\n');
  };

  const extractMainContent = (doc: Document): string => {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ads', '.sidebar', '.menu', '.navigation',
      '.comments', '.social-share', '.related-posts', '.breadcrumb'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Try to find main content
    const contentSelectors = [
      'article',
      '.article-content, .post-content, .entry-content, .content-body',
      '[class*="content"][class*="main"], [class*="article"][class*="body"]',
      '.story-content, .news-content, .post-body, .entry-body',
      'main article, main .content',
      '.main-content, #main-content, #content'
    ];

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element && hasSignificantText(element)) {
        return extractStructuredContent(element);
      }
    }

    // Fallback: collect all meaningful paragraphs
    const paragraphs = Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
      .map(el => {
        const text = el.textContent?.trim() || '';
        const tagName = el.tagName.toLowerCase();
        
        if (text.length > 30) {
          if (tagName.startsWith('h')) {
            return `<${tagName}>${text}</${tagName}>`;
          }
          return `<p>${text}</p>`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');

    return paragraphs || 'Conteúdo não encontrado';
  };

  const extractContentFromDOM = (doc: Document, originalUrl: string): ExtractedContent => {
    const urlObj = new URL(originalUrl);
    const domain = urlObj.hostname;

    // Extract title
    const title = extractTitle(doc);
    
    // Extract main image
    const mainImage = extractMainImage(doc, originalUrl);
    
    // Extract main content
    const content = extractMainContent(doc);

    return {
      title,
      content,
      mainImage,
      url: originalUrl,
      domain
    };
  };

  const fetchWebsiteWithFallback = async (url: string): Promise<ExtractedContent> => {
    try {
      // First try with the original ContentExtractor
      return await ContentExtractor.extractFromUrl(url);
    } catch (error) {
      // ContentExtractor failed, using enhanced fallback...
      
      try {
        // Enhanced fallback: try to get at least the basic info
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Try to get some basic info by fetching just the meta tags
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.contents, 'text/html');
          
          return extractContentFromDOM(doc, url);
        }
      } catch (fallbackError) {
        // All extraction methods failed, using template...
      }
      
      // Ultimate fallback with template content
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      return {
        title: `Artigo de ${domain}`,
        content: `
          <h2>Conteúdo Importado</h2>
          <p>Este é um conteúdo importado de: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>
          <p>Devido a restrições de CORS, o conteúdo completo não pôde ser extraído automaticamente.</p>
          <p>Você pode editar este conteúdo e adicionar as informações manualmente.</p>
          
          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
            <p style="font-style: italic; color: #6b7280; font-size: 0.9rem;">
              <strong>Fonte:</strong> 
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">
                ${domain}
              </a>
            </p>
          </div>
        `,
        mainImage: undefined,
        url: url,
        domain: domain
      };
    }
  };

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive"
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida (ex: https://exemplo.com/noticia).",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedContent(null);

    try {
      const content = await fetchWebsiteWithFallback(url);
      setExtractedContent(content);
      
      toast({
        title: "Conteúdo extraído!",
        description: "Conteúdo coletado com sucesso da URL.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUseContent = () => {
    if (extractedContent) {
      onContentExtracted(extractedContent);
    }
  };

  const handleUseDirectly = () => {
    if (extractedContent) {
      onUseDirectly(extractedContent);
    }
  };

  const handleClear = () => {
    setUrl('');
    setExtractedContent(null);
    setError(null);
  };

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-hero rounded-lg">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Passo 1: Extrair Conteúdo</h3>
            <p className="text-sm text-muted-foreground">
              Colete o conteúdo principal de qualquer URL
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="extract-url" className="text-sm font-medium">
            URL da Notícia
          </Label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="extract-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/noticia"
                className="pl-10 border-primary/30 focus:border-primary"
                disabled={isExtracting}
              />
            </div>
            <Button
              onClick={handleExtract}
              disabled={isExtracting || !url.trim()}
              className="bg-gradient-hero hover:shadow-glow-primary min-w-[120px]"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Extrair Conteúdo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Falha na extração:</strong>
              <br />
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {extractedContent && (
          <div className="space-y-4">
            <Alert className="border-green-500/50 bg-green-50/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Conteúdo extraído com sucesso!</strong>
                <br />
                Título: {extractedContent.title}
                <br />
                Domínio: {extractedContent.domain}
              </AlertDescription>
            </Alert>

            {/* Preview */}
            <Card className="bg-muted/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    {extractedContent.title}
                  </h4>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-primary/50">
                    {extractedContent.domain}
                  </Badge>
                  {extractedContent.mainImage && (
                    <Badge variant="secondary">
                      Imagem encontrada
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <Button
                  onClick={handleUseDirectly}
                  className="bg-gradient-hero hover:shadow-glow-primary flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Usar Como Está
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUseContent}
                  className="border-primary/50 flex-1"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Reescrever com IA
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={handleClear}
                className="w-full text-muted-foreground"
              >
                Limpar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ContentExtractorStep;