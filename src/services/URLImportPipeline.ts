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

      // Step 4: Download and upload external image to VPS
      this.updateProgress('generate_image', 'Processando imagem...', 80);
      const imageStart = Date.now();
      
      let generatedImage: GeneratedImage | undefined;
      
      try {
        // If we have an external image URL, download and re-upload to VPS
        if (extractedContent.mainImage) {
          this.addLog('generate_image', `Baixando imagem externa: ${extractedContent.mainImage}`);
          
          const imageBlob = await this.downloadImage(extractedContent.mainImage);
          const imageFile = new File([imageBlob], `imported-${Date.now()}.jpg`, { type: imageBlob.type });
          
          this.addLog('generate_image', 'Enviando imagem para VPS...');
          const vpsResult = await this.uploadToVPS(imageFile);
          
          if (vpsResult.success) {
            generatedImage = {
              url: vpsResult.url,
              provider: 'vps-upload',
              prompt: rewrittenContent.image_prompt
            };
            this.addLog('generate_image', `Imagem salva na VPS: ${vpsResult.url}`, Date.now() - imageStart);
          } else {
            throw new Error(vpsResult.error || 'Falha no upload para VPS');
          }
        } else {
          this.addLog('generate_image', 'Nenhuma imagem externa encontrada, continuando sem imagem');
        }
      } catch (error) {
        this.addLog('generate_image', `Falha no processamento da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, Date.now() - imageStart, true);
        this.addLog('generate_image', 'Continuando sem imagem');
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

  private async downloadImage(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return await response.blob();
  }

  private async uploadToVPS(file: File): Promise<{ success: boolean; url: string; error?: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://media.radioradar.news/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS upload failed: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success && data.url) {
      return {
        success: true,
        url: `https://media.radioradar.news${data.url}`
      };
    } else {
      return {
        success: false,
        url: '',
        error: data.error || 'Upload failed'
      };
    }
  }
}