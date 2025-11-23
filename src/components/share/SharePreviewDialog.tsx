import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateFeedImage, downloadBlob } from '@/utils/shareHelpers';
import { useToast } from '@/hooks/use-toast';

interface SharePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  columnistId?: string;
  columnist?: {
    name: string;
    specialty: string;
    bio: string;
    avatar?: string;
  };
}

interface DiagnosticResult {
  hasArticleImage: boolean;
  hasColumnistAvatar: boolean;
  hasColumnistInfo: boolean;
  issues: string[];
  warnings: string[];
}

export const SharePreviewDialog: React.FC<SharePreviewDialogProps> = ({
  open,
  onOpenChange,
  title,
  excerpt,
  image,
  category,
  author,
  source,
  sourceUrl,
  columnistId,
  columnist
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [updatedColumnist, setUpdatedColumnist] = useState(columnist);

  useEffect(() => {
    if (open) {
      // Buscar dados atualizados e então gerar preview
      fetchUpdatedData().then(() => {
        generatePreview();
      });
    } else {
      // Cleanup ao fechar (não precisa revogar Data URLs)
      setPreviewUrl(null);
      setCurrentBlob(null);
      setDiagnostic(null);
      setAttemptCount(0);
      setUpdatedColumnist(columnist);
    }
  }, [open]);

  const fetchUpdatedData = async () => {
    if (!columnist && !columnistId) return;
    
    try {
      console.log('🔄 [PREVIEW] Buscando dados atualizados do perfil...');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Buscar por ID se disponível, senão por nome
      let query = supabase
        .from('profiles')
        .select('id, name, avatar, bio, specialty')
        .eq('is_active', true);
      
      if (columnistId) {
        query = query.eq('id', columnistId);
        console.log('🔍 [PREVIEW] Buscando por ID:', columnistId);
      } else if (columnist?.name) {
        query = query.eq('name', columnist.name);
        console.log('🔍 [PREVIEW] Buscando por nome:', columnist.name);
      }
      
      const { data: profileData, error } = await query.single();

      if (!error && profileData) {
        const fresh = {
          name: profileData.name,
          specialty: profileData.specialty || 'Colunista do Portal RRN',
          bio: profileData.bio || 'Colunista especializado em conteúdo informativo.',
          avatar: profileData.avatar ? `${profileData.avatar}?v=${Date.now()}` : undefined
        };
        
        setUpdatedColumnist(fresh);
        console.log('✅ [PREVIEW] Dados atualizados do banco:', {
          name: fresh.name,
          bioLength: fresh.bio.length,
          bioPreview: fresh.bio.substring(0, 100),
          hasAvatar: !!fresh.avatar,
          avatarUrl: fresh.avatar?.substring(0, 100)
        });
      } else {
        console.warn('⚠️ [PREVIEW] Não foi possível buscar dados atualizados, usando props');
        setUpdatedColumnist(columnist);
      }
    } catch (error) {
      console.error('❌ [PREVIEW] Erro ao buscar dados:', error);
      setUpdatedColumnist(columnist);
    }
  };

  const runDiagnostic = (): DiagnosticResult => {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    const currentColumnist = updatedColumnist || columnist;
    
    console.log('🔍 [DIAGNOSTIC] Verificando dados:', {
      image: image?.substring(0, 100),
      columnistName: currentColumnist?.name,
      columnistBioLength: currentColumnist?.bio?.length,
      columnistAvatar: currentColumnist?.avatar?.substring(0, 100)
    });
    
    // Verificar imagem do artigo
    const hasArticleImage = !!(image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/')));
    if (!hasArticleImage) {
      issues.push('Imagem do artigo não fornecida ou inválida');
    } else if (image.includes('media.radioradar.news') || image.includes('supabase.co/storage')) {
      warnings.push('Imagem requer proxy para mobile - usando automaticamente');
    }

    // Verificar dados do colunista
    let hasColumnistAvatar = true;
    let hasColumnistInfo = true;
    
    if (currentColumnist) {
      hasColumnistAvatar = !!(currentColumnist.avatar && currentColumnist.avatar.length > 0);
      hasColumnistInfo = !!(currentColumnist.name && currentColumnist.bio && currentColumnist.specialty);
      
      if (!hasColumnistAvatar) {
        warnings.push('Avatar do colunista não disponível - usando iniciais');
      }
      
      if (!currentColumnist.name) {
        issues.push('Nome do colunista ausente');
      }
      if (!currentColumnist.bio || currentColumnist.bio.trim().length < 10) {
        warnings.push('Biografia do colunista muito curta ou ausente');
      }
      if (!currentColumnist.specialty) {
        warnings.push('Especialidade do colunista ausente');
      }
    }

    return {
      hasArticleImage,
      hasColumnistAvatar,
      hasColumnistInfo,
      issues,
      warnings
    };
  };

  const generatePreview = async () => {
    setIsGenerating(true);
    setAttemptCount(prev => prev + 1);

    try {
      const currentAttempt = attemptCount + 1;
      console.log(`🔍 [PREVIEW] Iniciando geração (tentativa ${currentAttempt})`);
      
      // Executar diagnóstico antes de gerar
      const diagnosticResult = runDiagnostic();
      setDiagnostic(diagnosticResult);
      
      console.log('📊 [PREVIEW] Diagnóstico:', diagnosticResult);
      
      const currentColumnist = updatedColumnist || columnist;
      console.log('📝 [PREVIEW] Usando dados do colunista:', {
        name: currentColumnist?.name,
        bioPreview: currentColumnist?.bio?.substring(0, 50),
        specialty: currentColumnist?.specialty,
        hasAvatar: !!currentColumnist?.avatar,
        avatarUrl: currentColumnist?.avatar?.substring(0, 100)
      });

      // Gerar imagem com dados atualizados
      const blob = await generateFeedImage({
        title,
        image,
        category,
        columnist: currentColumnist,
        summary: excerpt,
        source,
        sourceUrl
      });

      // Converter Blob para Data URL (funciona em produção/mobile)
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Falha ao converter blob para data URL'));
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const dataUrl = await dataUrlPromise;
      
      console.log('✅ [PREVIEW] Blob convertido para Data URL:', {
        size: blob.size,
        type: blob.type,
        dataUrlLength: dataUrl.length
      });
      
      setPreviewUrl(dataUrl);
      setCurrentBlob(blob);
      
      console.log('✅ [PREVIEW] Imagem gerada com sucesso');
      
      if (diagnosticResult.issues.length === 0) {
        toast({
          title: "Preview gerado!",
          description: "Verifique se a imagem está correta antes de baixar.",
        });
      } else {
        toast({
          title: "Preview gerado com avisos",
          description: `${diagnosticResult.issues.length} problema(s) detectado(s)`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ [PREVIEW] Erro ao gerar preview:', error);
      toast({
        title: "Erro ao gerar preview",
        description: "Tente novamente ou verifique os dados do artigo.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentBlob) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem para baixar. Gere o preview primeiro.",
        variant: "destructive"
      });
      return;
    }

    const fileName = `portal-news-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}.jpg`;
    downloadBlob(fileName, currentBlob);
    
    toast({
      title: "Download iniciado!",
      description: "A imagem foi salva em seus downloads.",
    });
    
    onOpenChange(false);
  };

  const handleRegenerate = async () => {
    if (attemptCount >= 5) {
      toast({
        title: "Limite de tentativas",
        description: "Muitas tentativas. Verifique os dados do artigo e tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }
    
    // Buscar dados frescos antes de regenerar
    console.log('🔄 [PREVIEW] Buscando dados atualizados antes de regenerar...');
    await fetchUpdatedData();
    
    // Aguardar um pouco para garantir que os dados foram atualizados
    setTimeout(() => {
      generatePreview();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview da Arte para Feed</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Verifique se a imagem está correta antes de baixar. Se houver problemas, clique em Regenerar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Diagnóstico */}
          {diagnostic && (
            <div className="space-y-2">
              {/* Informações sobre dados atuais */}
              {updatedColumnist && (
                <div className="text-xs bg-muted p-2 rounded space-y-1">
                  <div><strong>Nome:</strong> {updatedColumnist.name}</div>
                  <div><strong>Especialidade:</strong> {updatedColumnist.specialty}</div>
                  <div><strong>Bio:</strong> {updatedColumnist.bio?.substring(0, 80)}...</div>
                  <div><strong>Avatar:</strong> {updatedColumnist.avatar ? '✓ Disponível' : '✗ Não disponível'}</div>
                </div>
              )}
              
              {/* Itens OK */}
              <div className="space-y-1">
                {diagnostic.hasArticleImage && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Imagem do artigo: OK</span>
                  </div>
                )}
                {columnist && diagnostic.hasColumnistInfo && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dados do colunista: OK</span>
                  </div>
                )}
                {columnist && diagnostic.hasColumnistAvatar && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Avatar do colunista: OK</span>
                  </div>
                )}
              </div>

              {/* Problemas críticos */}
              {diagnostic.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Problemas detectados:</div>
                    <ul className="list-disc list-inside text-sm">
                      {diagnostic.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Avisos */}
              {diagnostic.warnings.length > 0 && diagnostic.issues.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Avisos:</div>
                    <ul className="list-disc list-inside text-sm">
                      {diagnostic.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Preview da imagem */}
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Gerando arte para feed...</p>
                  <p className="text-xs text-muted-foreground">
                    Tentativa {attemptCount}
                  </p>
                </div>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview da arte para feed"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Gerando preview...</p>
              </div>
            )}
          </div>

          {/* Informações sobre a tentativa */}
          {attemptCount > 1 && (
            <div className="text-xs text-muted-foreground text-center">
              {attemptCount} tentativa(s) realizadas
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isGenerating || attemptCount >= 5}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!currentBlob || isGenerating || (diagnostic?.issues.length || 0) > 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Imagem
            </Button>
          </div>

          {/* Dica */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Dica: Se a imagem não estiver correta, clique em "Regenerar" para tentar novamente.
            {diagnostic?.issues.length === 0 && ' A imagem parece estar OK para download.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
