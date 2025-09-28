import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VPSImageService } from '@/services/VPSImageService';

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

    setIsUploading(true);

    try {
      const result = await VPSImageService.uploadImage(file, 'avatar');
      
      if (result.success) {
        setPreviewImage(result.url);
        onImageChange(result.url);
        
        toast({
          title: 'Upload concluído',
          description: 'Foto carregada com sucesso!',
        });
      } else {
        throw new Error(result.error || 'Erro no upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível processar a imagem',
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

  const removeImage = () => {
    setPreviewImage(null);
    onImageChange('');
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