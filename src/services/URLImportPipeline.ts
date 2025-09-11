import { ContentExtractor, type ExtractedContent } from './ContentExtractor';
import { AIContentRewriter, type RewrittenContent } from './AIContentRewriter';
import { AIImageGenerator, type GeneratedImage } from './AIImageGenerator';

export interface ImportProgress {
  step: 'collect' | 'extract' | 'rewrite' | 'generate_image' | 'complete';
  stepName: string;
  progress: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  data?: {
    rewrittenContent: RewrittenContent;
    generatedImage?: GeneratedImage;
  };
  error?: string;
  logs: Array<{
    timestamp: Date;
    step: string;
    message: string;
    duration?: number;
    error?: boolean;
  }>;
}

export type ProgressCallback = (progress: ImportProgress) => void;

export class URLImportPipeline {
  private logs: ImportResult['logs'] = [];
  private progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
  }

  async importFromUrl(url: string): Promise<ImportResult> {
    this.logs = [];
    const startTime = Date.now();

    try {
      // Step 1: Collect HTML content
      this.updateProgress('collect', 'Coletando conteúdo da URL...', 20);
      const stepStart = Date.now();
      
      this.addLog('collect', `Iniciando coleta de: ${url}`);
      const extractedContent = await ContentExtractor.extractFromUrl(url);
      this.addLog('collect', `Conteúdo coletado com sucesso`, Date.now() - stepStart);

      // Step 2: Extract meaningful content
      this.updateProgress('extract', 'Extraindo conteúdo principal...', 40);
      this.addLog('extract', `Título extraído: ${extractedContent.title}`);
      this.addLog('extract', `Domínio: ${extractedContent.domain}`);
      
      if (extractedContent.mainImage) {
        this.addLog('extract', `Imagem principal encontrada: ${extractedContent.mainImage}`);
      }

      // Step 3: Rewrite content with AI
      this.updateProgress('rewrite', 'Reescrevendo conteúdo com IA...', 60);
      const rewriteStart = Date.now();
      
      this.addLog('rewrite', 'Iniciando reescrita com IA...');
      const rewrittenContent = await AIContentRewriter.rewriteContent(extractedContent);
      this.addLog('rewrite', `Conteúdo reescrito com sucesso`, Date.now() - rewriteStart);
      this.addLog('rewrite', `Categoria sugerida: ${rewrittenContent.category_suggestion}`);
      this.addLog('rewrite', `Tags sugeridas: ${rewrittenContent.tags.join(', ')}`);

      // Step 4: Generate featured image
      this.updateProgress('generate_image', 'Gerando imagem de destaque...', 80);
      const imageStart = Date.now();
      
      let generatedImage: GeneratedImage | undefined;
      
      try {
        this.addLog('generate_image', `Gerando imagem com prompt: ${rewrittenContent.image_prompt}`);
        generatedImage = await AIImageGenerator.generateImage(rewrittenContent.image_prompt);
        this.addLog('generate_image', `Imagem gerada com sucesso via ${generatedImage.provider}`, Date.now() - imageStart);
      } catch (error) {
        this.addLog('generate_image', `Falha na geração de imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, Date.now() - imageStart, true);
        
        // Continue without image - it's not critical
        this.addLog('generate_image', 'Continuando sem imagem gerada por IA');
      }

      // Step 5: Complete
      this.updateProgress('complete', 'Importação concluída!', 100);
      const totalDuration = Date.now() - startTime;
      this.addLog('complete', `Pipeline concluído em ${totalDuration}ms`);

      return {
        success: true,
        data: {
          rewrittenContent,
          generatedImage
        },
        logs: this.logs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.addLog('error', `Pipeline falhou: ${errorMessage}`, undefined, true);
      
      return {
        success: false,
        error: errorMessage,
        logs: this.logs
      };
    }
  }

  private updateProgress(step: ImportProgress['step'], message: string, progress: number) {
    const stepNames = {
      collect: 'Coletar',
      extract: 'Extrair', 
      rewrite: 'Reescrever',
      generate_image: 'Gerar Imagem',
      complete: 'Concluído'
    };

    const progressData: ImportProgress = {
      step,
      stepName: stepNames[step],
      progress,
      message
    };

    if (this.progressCallback) {
      this.progressCallback(progressData);
    }
  }

  private addLog(step: string, message: string, duration?: number, error: boolean = false) {
    this.logs.push({
      timestamp: new Date(),
      step,
      message,
      duration,
      error
    });
  }
}