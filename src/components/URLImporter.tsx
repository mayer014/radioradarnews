import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  LinkIcon, 
  Bot, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { URLImportPipeline, type ImportProgress, type ImportResult } from '@/services/URLImportPipeline';
import type { RewrittenContent } from '@/services/AIContentRewriter';
import type { GeneratedImage } from '@/services/AIImageGenerator';
import AIConfigPanel from './AIConfigPanel';

interface URLImporterProps {
  onImportComplete: (data: {
    rewrittenContent: RewrittenContent;
    generatedImage?: GeneratedImage | { url: string };
    saveAsDraft: boolean;
  }) => void;
}

const URLImporter: React.FC<URLImporterProps> = ({ onImportComplete }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [isAIConfigured, setIsAIConfigured] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira uma URL válida para importar.",
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

    setIsImporting(true);
    setResult(null);
    setProgress(null);
    setShowLogs(false);

    const pipeline = new URLImportPipeline((progressData) => {
      setProgress(progressData);
    });

    try {
      const importResult = await pipeline.importFromUrl(url);
      setResult(importResult);

      if (importResult.success && importResult.data) {
        toast({
          title: "Importação concluída!",
          description: "Conteúdo importado e reescrito com sucesso.",
        });
      } else {
        toast({
          title: "Falha na importação",
          description: importResult.error || "Erro desconhecido durante a importação.",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro na importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUseContent = () => {
    if (result?.success && result.data) {
      onImportComplete({
        ...result.data,
        saveAsDraft
      });
      
      // Clear the form after use
      setUrl('');
      setResult(null);
      setProgress(null);
    }
  };

  const handleClear = () => {
    setUrl('');
    setResult(null);
    setProgress(null);
    setShowLogs(false);
    setIsImporting(false);
  };

  const handleRegenerateImage = async () => {
    if (!result?.success || !result.data) return;

    // Funcionalidade será implementada na próxima versão
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A regeneração de imagem será implementada em breve.",
    });
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
            <h3 className="text-lg font-semibold">Importar por URL (IA)</h3>
            <p className="text-sm text-muted-foreground">
              Importe e reescreva notícias automaticamente usando Inteligência Artificial
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="source-url" className="text-sm font-medium">
            Fonte (URL)
          </Label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="source-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/noticia"
                className="pl-10 border-primary/30 focus:border-primary"
                disabled={isImporting}
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={isImporting || !url.trim()}
              className="bg-gradient-hero hover:shadow-glow-primary min-w-[120px]"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Buscar e Reescrever
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="save-draft"
            checked={saveAsDraft}
            onCheckedChange={(checked) => setSaveAsDraft(checked === true)}
          />
          <Label
            htmlFor="save-draft"
            className="text-sm font-medium cursor-pointer"
          >
            Salvar como rascunho
          </Label>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{progress.stepName}</span>
              <span className="text-sm text-muted-foreground">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{progress.message}</p>
            
            {/* Step indicators */}
            <div className="flex space-x-2">
              {['Coletar', 'Extrair', 'Reescrever', 'Gerar Imagem', 'Concluído'].map((step, index) => (
                <Badge
                  key={step}
                  variant={
                    progress.progress > index * 20 ? 'default' : 'outline'
                  }
                  className={
                    progress.progress > index * 20
                      ? 'bg-gradient-hero text-white'
                      : 'border-primary/30'
                  }
                >
                  {step}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <Alert className="border-green-500/50 bg-green-50/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Importação bem-sucedida!</strong>
                  <br />
                  Conteúdo reescrito e pronto para revisão.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Falha na importação:</strong>
                  <br />
                  {result.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Actions */}
            {result.success && result.data && (
              <div className="space-y-4">
                {/* Preview */}
                <Card className="bg-muted/20 p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {result.data.rewrittenContent.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.data.rewrittenContent.lead}
                      </p>
                    </div>
                    
                    {/* Generated Image Preview */}
                    {result.data.generatedImage && (
                      <div className="flex items-center space-x-3">
                        <img
                          src={result.data.generatedImage.url}
                          alt="Imagem gerada"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Imagem gerada por IA</p>
                          <p className="text-xs text-muted-foreground">
                            Provider: {result.data.generatedImage.provider}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRegenerateImage}
                          className="border-primary/50"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-primary/50">
                        {result.data.rewrittenContent.category_suggestion}
                      </Badge>
                      {result.data.rewrittenContent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUseContent}
                    className="bg-gradient-hero hover:shadow-glow-primary flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Preencher Formulário
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="border-primary/50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            {/* Debug Logs */}
            <div className="border-t border-primary/20 pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full justify-start text-muted-foreground"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showLogs ? 'Ocultar' : 'Mostrar'} logs técnicos ({result.logs.length})
              </Button>
              
              {showLogs && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {result.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border ${
                        log.error
                          ? 'border-red-500/20 bg-red-50/10 text-red-600'
                          : 'border-primary/20 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{log.step}</span>
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                          {log.duration && ` (${log.duration}ms)`}
                        </span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Configuration Warning */}
        {!isAIConfigured && (
          <Alert className="border-orange-500/50 bg-orange-50/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              <strong>Configuração de IA necessária:</strong> Para reescrita inteligente de conteúdo, 
              configure pelo menos uma API de IA externa.
              <Button
                variant="link"
                className="p-0 h-auto ml-2 text-orange-600 hover:text-orange-700"
                onClick={() => setShowAIConfig(!showAIConfig)}
              >
                {showAIConfig ? 'Ocultar' : 'Configurar agora'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Configuration Panel */}
        {showAIConfig && (
          <AIConfigPanel onConfigChange={setIsAIConfigured} />
        )}

        {/* Info */}
        <Alert className="border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Como funciona:</strong> A IA coleta o conteúdo da URL, extrai as informações principais, 
            reescreve em português brasileiro sem plágio, gera uma imagem de destaque e preenche 
            automaticamente o formulário da notícia para sua revisão.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
};

export default URLImporter;