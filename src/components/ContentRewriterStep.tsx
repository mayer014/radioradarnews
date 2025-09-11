import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { AIContentRewriter, type RewrittenContent } from '@/services/AIContentRewriter';
import type { ExtractedContent } from '@/services/ContentExtractor';

interface ContentRewriterStepProps {
  extractedContent: ExtractedContent;
  onContentRewritten: (content: RewrittenContent) => void;
  onUseOriginal: (content: RewrittenContent) => void;
}

const ContentRewriterStep: React.FC<ContentRewriterStepProps> = ({ 
  extractedContent, 
  onContentRewritten,
  onUseOriginal 
}) => {
  const { toast } = useToast();
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState<RewrittenContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleRewrite = async () => {
    setIsRewriting(true);
    setError(null);
    setRewrittenContent(null);
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const rewritten = await AIContentRewriter.rewriteContent(extractedContent);
      
      // Format and improve the HTML content structure
      let formattedContent = rewritten.content_html;
      
      // Ensure proper paragraph spacing
      formattedContent = formattedContent.replace(/<\/p><p>/g, '</p>\n\n<p>');
      
      // Ensure headings have proper spacing
      formattedContent = formattedContent.replace(/<h([1-6])[^>]*>/g, '\n\n<h$1>');
      formattedContent = formattedContent.replace(/<\/h([1-6])>/g, '</h$1>\n\n');
      
      // Add source to the content with proper formatting
      const contentWithSource = formattedContent + 
        `\n\n<hr>\n\n<p><em><strong>Fonte:</strong> <a href="${extractedContent.url}" target="_blank" rel="noopener noreferrer">${extractedContent.domain}</a> – Leia a matéria completa no link original</em></p>`;
      
      const rewrittenWithSource = {
        ...rewritten,
        content_html: contentWithSource,
        source_url: extractedContent.url,
        source_domain: extractedContent.domain
      };
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setRewrittenContent(rewrittenWithSource);
      
      toast({
        title: "Conteúdo reescrito!",
        description: "O conteúdo foi reescrito com sucesso pela IA.",
      });
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro na reescrita",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleUseAIContent = () => {
    if (rewrittenContent) {
      onContentRewritten(rewrittenContent);
    }
  };

  const handleUseOriginalContent = () => {
    // Create a RewrittenContent object from the original content
    const originalAsRewritten: RewrittenContent = {
      title: extractedContent.title,
      slug: extractedContent.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 60),
      lead: extractedContent.content.substring(0, 200) + '...',
      content_html: extractedContent.content + `\n\n<hr>\n\n<p><em><strong>Fonte:</strong> <a href="${extractedContent.url}" target="_blank" rel="noopener noreferrer">${extractedContent.domain}</a> – Leia a matéria completa no link original</em></p>`,
      excerpt: extractedContent.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
      category_suggestion: 'Política',
      tags: ['notícia', extractedContent.domain.replace(/^www\./, '')],
      image_prompt: `Imagem ilustrativa para: ${extractedContent.title}`,
      source_url: extractedContent.url,
      source_domain: extractedContent.domain,
      published_at_suggestion: new Date().toISOString()
    };
    
    onUseOriginal(originalAsRewritten);
  };

  const handleTryAgain = () => {
    setError(null);
    setRewrittenContent(null);
    setProgress(0);
  };

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-hero rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Passo 2: Reescrever com IA</h3>
            <p className="text-sm text-muted-foreground">
              Transforme o conteúdo original em uma notícia única e bem estruturada
            </p>
          </div>
        </div>

        {/* Source Content Preview */}
        <Card className="bg-muted/10 p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Conteúdo Original:</h4>
            <p className="text-sm font-semibold">{extractedContent.title}</p>
            <Badge variant="outline" className="border-primary/50">
              {extractedContent.domain}
            </Badge>
          </div>
        </Card>

        {/* Progress */}
        {isRewriting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reescrevendo com IA...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress < 30 ? 'Analisando conteúdo original...' :
               progress < 60 ? 'Reescrevendo texto...' :
               progress < 90 ? 'Gerando metadados...' : 'Finalizando...'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Falha na reescrita:</strong>
              <br />
              {error}
              <br />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTryAgain}
                className="mt-2 border-red-300 hover:bg-red-50"
              >
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {rewrittenContent && (
          <div className="space-y-4">
            <Alert className="border-green-500/50 bg-green-50/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Conteúdo reescrito com sucesso!</strong>
                <br />
                Novo título: {rewrittenContent.title}
              </AlertDescription>
            </Alert>

            {/* Preview */}
            <Card className="bg-muted/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    {rewrittenContent.title}
                  </h4>
                </div>
                
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

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <Button
                  onClick={handleUseAIContent}
                  className="bg-gradient-hero hover:shadow-glow-primary flex-1"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Usar Texto da IA
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUseOriginalContent}
                  className="border-primary/50 flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Usar Texto Original
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={handleRewrite}
                className="w-full border border-primary/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reescrever Novamente
              </Button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isRewriting && !rewrittenContent && !error && (
          <Button
            onClick={handleRewrite}
            className="bg-gradient-hero hover:shadow-glow-primary w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Reescrever com IA
          </Button>
        )}

        {/* Info */}
        <Alert className="border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Sobre a IA:</strong> O sistema tentará vários provedores de IA para reescrever 
            o conteúdo. O texto será transformado em português brasileiro, com estrutura jornalística 
            e sem plágio do original.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
};

export default ContentRewriterStep;