import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileImage, Settings, CheckCircle, X } from 'lucide-react';
import { ImageCompressionService } from '@/services/ImageCompressionService';

interface ImageUploadOptimizedProps {
  onImageUploaded: (file: File) => void;
  maxFiles?: number;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

const ImageUploadOptimized: React.FC<ImageUploadOptimizedProps> = ({
  onImageUploaded,
  maxFiles = 1,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeMB = 10
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (selectedFiles: File[]) => {
    // Filtrar apenas arquivos de imagem aceitos
    const validFiles = selectedFiles.filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        toast({
          title: "Formato não suportado",
          description: `${file.name} não é um formato de imagem válido.`,
          variant: "destructive",
        });
        return false;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de ${maxSizeMB}MB.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Limitar número de arquivos
    const filesToProcess = validFiles.slice(0, maxFiles);
    setFiles(filesToProcess);

    // Iniciar compressão
    await compressImages(filesToProcess);
  };

  const compressImages = async (imagesToCompress: File[]) => {
    setCompressing(true);
    setCompressionProgress(0);
    setCompressionResults([]);

    try {
      // Verificar suporte a WebP
      const supportsWebP = await ImageCompressionService.supportsWebP();
      
      const results = await ImageCompressionService.compressBatch(
        imagesToCompress,
        {
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
          outputFormat: supportsWebP ? 'webp' : 'jpeg'
        },
        (current, total) => {
          setCompressionProgress((current / total) * 100);
        }
      );

      const formattedResults: CompressionResult[] = results.map((result, index) => ({
        file: result.file,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        fileName: imagesToCompress[index].name
      }));

      setCompressionResults(formattedResults);

      // Calcular estatísticas
      const stats = ImageCompressionService.calculateCompressionStats(results);
      
      toast({
        title: "Compressão concluída",
        description: `${results.length} imagem(ns) comprimida(s). Economia: ${stats.compressionRatio} (${stats.savingsMB} MB)`,
      });

      // Para upload único, enviar automaticamente
      if (maxFiles === 1 && results.length > 0) {
        onImageUploaded(results[0].file);
      }

    } catch (error) {
      console.error('Erro na compressão:', error);
      toast({
        title: "Erro na compressão",
        description: "Não foi possível comprimir as imagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCompressing(false);
    }
  };

  const handleUploadCompressed = (result: CompressionResult) => {
    onImageUploaded(result.file);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newResults = compressionResults.filter((_, i) => i !== index);
    setFiles(newFiles);
    setCompressionResults(newResults);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Envie suas imagens
          </h3>
          <p className="text-muted-foreground mb-4">
            Arraste e solte aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground">
            Formatos aceitos: JPEG, PNG, WebP, GIF (máx. {maxSizeMB}MB)
          </p>
        </div>
        
        <input
          id="file-upload"
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </Card>

      {/* Progresso da Compressão */}
      {compressing && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">Comprimindo imagens...</span>
          </div>
          <Progress value={compressionProgress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(compressionProgress)}% concluído
          </p>
        </Card>
      )}

      {/* Resultados da Compressão */}
      {compressionResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Imagens Otimizadas
          </h4>
          
          {compressionResults.map((result, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{result.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)}
                      <span className="text-green-600 ml-2">
                        (-{(((result.originalSize - result.compressedSize) / result.originalSize) * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {maxFiles > 1 && (
                    <Button
                      size="sm"
                      onClick={() => handleUploadCompressed(result)}
                      className="bg-gradient-hero hover:shadow-glow-primary"
                    >
                      Usar Esta
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dicas de Otimização */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Otimização automática:</strong> Suas imagens são automaticamente comprimidas para WebP 
          (quando suportado) e redimensionadas para economizar espaço no servidor.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ImageUploadOptimized;