import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  label = "Imagem de Destaque",
  className = "" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      onChange(publicUrl);
      setIsUploading(false);
      
      toast({
        title: "Upload concluído",
        description: "Imagem carregada com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao carregar a imagem. Tente novamente.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onChange(url);
  };

  const clearImage = () => {
    setImageUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-3 block">
        {label}
      </Label>
      
      <div className="space-y-4">
        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-primary/50 hover:bg-primary/10 flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Carregando...' : 'Fazer Upload'}
          </Button>
          
          {imageUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={clearImage}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Ou cole a URL da imagem:
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="border-primary/30 focus:border-primary"
          />
        </div>

        {/* Preview */}
        {imageUrl && (
          <Card className="bg-gradient-card border-primary/30 p-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Pré-visualização:
              </Label>
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt="Preview da imagem"
                  className="w-full h-40 object-cover border border-primary/20"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04NSA4NUgxMTVWMTE1SDg1Vjg1WiIgZmlsbD0iI0Q0RDREOCIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;