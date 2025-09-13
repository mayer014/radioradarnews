import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { Image } from 'lucide-react';

interface ArticleImageUploadProps {
  featured_image: string;
  onImageChange: (url: string) => void;
}

const ArticleImageUpload: React.FC<ArticleImageUploadProps> = ({
  featured_image,
  onImageChange,
}) => {
  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Image className="h-5 w-5 text-primary" />
        <Label className="text-lg font-semibold">
          Imagem de Destaque
        </Label>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Escolha uma imagem que represente bem o conteúdo do seu artigo
      </p>
      
      <ImageUpload
        value={featured_image}
        onChange={onImageChange}
        label=""
      />
      
      {featured_image && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            Imagem selecionada: A imagem será exibida na listagem e no topo do artigo
          </p>
        </div>
      )}
    </Card>
  );
};

export default ArticleImageUpload;