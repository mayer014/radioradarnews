/**
 * Serviço para compressão automática de imagens
 * Converte para WebP quando possível e otimiza tamanho
 */

interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: 'webp' | 'jpeg' | 'png';
}

export class ImageCompressionService {
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly MAX_FILE_SIZE_MB = 5;
  private static readonly MAX_DIMENSION = 1920;

  /**
   * Comprime uma imagem automaticamente
   */
  static async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<{ file: File; originalSize: number; compressedSize: number }> {
    const {
      quality = this.DEFAULT_QUALITY,
      maxWidth = this.MAX_DIMENSION,
      maxHeight = this.MAX_DIMENSION,
      outputFormat = 'webp'
    } = options;

    const originalSize = file.size;
    
    // Se a imagem já é pequena o suficiente, não precisa comprimir
    if (originalSize <= (this.MAX_FILE_SIZE_MB * 1024 * 1024 * 0.5)) {
      return {
        file,
        originalSize,
        compressedSize: originalSize
      };
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular novas dimensões mantendo proporção
          const { width, height } = this.calculateNewDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem redimensionada
          ctx!.drawImage(img, 0, 0, width, height);

          // Converter para blob com compressão
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Falha ao comprimir imagem'));
                return;
              }

              const compressedFile = new File(
                [blob], 
                this.generateFileName(file.name, outputFormat),
                { type: blob.type }
              );

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize: blob.size
              });
            },
            `image/${outputFormat}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Verifica se o navegador suporta WebP
   */
  static supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Calcula novas dimensões mantendo proporção
   */
  private static calculateNewDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    };
  }

  /**
   * Gera novo nome de arquivo com extensão correta
   */
  private static generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_compressed.${format}`;
  }

  /**
   * Converte GIF animado para WebP animado (se suportado) ou MP4
   */
  static async convertAnimatedGif(file: File): Promise<File> {
    // Para GIFs animados, vamos manter como GIF por enquanto
    // Uma implementação completa precisaria de uma biblioteca externa
    console.log('Conversão de GIF animado ainda não implementada');
    return file;
  }

  /**
   * Otimiza múltiplas imagens em lote
   */
  static async compressBatch(
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ file: File; originalSize: number; compressedSize: number }>> {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.compressImage(files[i], options);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }
    
    return results;
  }

  /**
   * Calcula estatísticas de compressão
   */
  static calculateCompressionStats(results: Array<{ originalSize: number; compressedSize: number }>) {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const savings = totalOriginal - totalCompressed;
    const compressionRatio = ((savings / totalOriginal) * 100).toFixed(1);

    return {
      totalOriginalMB: (totalOriginal / 1024 / 1024).toFixed(2),
      totalCompressedMB: (totalCompressed / 1024 / 1024).toFixed(2),
      savingsMB: (savings / 1024 / 1024).toFixed(2),
      compressionRatio: `${compressionRatio}%`
    };
  }
}