import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadColumnistProps {
  currentImage?: string;
  onImageChange: (imageData: string) => void;
  columnistName: string;
}

const ImageUploadColumnist: React.FC<ImageUploadColumnistProps> = ({
  currentImage,
  onImageChange,
  columnistName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Converter arquivo para base64
      const base64 = await convertToBase64(file);
      
      // Verificar se o base64 é válido
      if (!base64.startsWith('data:image/')) {
        throw new Error('Formato de imagem inválido após conversão');
      }
      
      // Redimensionar se necessário
      const resizedImage = await resizeImage(base64, 400, 400);
      
      // Verificar novamente após redimensionamento
      if (!resizedImage.startsWith('data:image/')) {
        throw new Error('Formato de imagem inválido após redimensionamento');
      }
      
      setPreviewImage(resizedImage);
      onImageChange(resizedImage);
      
      // Removido o toast automático - deixar para o componente pai decidir
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível processar a imagem',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resizeImage = (base64: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(base64);
          return;
        }

        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com qualidade otimizada
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(resizedBase64);
      };
      img.src = base64;
    });
  };

  const removeImage = () => {
    setPreviewImage(null);
    onImageChange('');
    // Removido o toast automático - deixar para o componente pai decidir
  };

  const triggerFileInput = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Foto do Colunista</Label>
          {previewImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          )}
        </div>

        {/* Preview da imagem */}
        {previewImage ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={previewImage}
                alt={`Foto de ${columnistName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/30 shadow-lg"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              disabled={isUploading}
              className="border-primary/50 hover:bg-primary/10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar Foto
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 border-2 border-dashed border-primary/30 rounded-lg bg-muted/20">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Nenhuma foto carregada
              </p>
              <Button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="bg-gradient-hero hover:shadow-glow-primary"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Foto
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-xs text-muted-foreground">
          <p>• Formatos aceitos: JPG, PNG, GIF</p>
          <p>• Tamanho máximo: 5MB</p>
          <p>• Recomendado: Foto quadrada (será redimensionada automaticamente)</p>
        </div>
      </div>
    </Card>
  );
};

export default ImageUploadColumnist;