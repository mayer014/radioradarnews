import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface ArticleBasicInfoProps {
  title: string;
  excerpt: string;
  onTitleChange: (title: string) => void;
  onExcerptChange: (excerpt: string) => void;
}

const ArticleBasicInfo: React.FC<ArticleBasicInfoProps> = ({
  title,
  excerpt,
  onTitleChange,
  onExcerptChange,
}) => {
  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-lg font-semibold mb-3 block">
            Título do Artigo
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Digite um título impactante para seu artigo..."
            className="text-lg border-primary/30 focus:border-primary py-3 px-4"
          />
        </div>

        <div>
          <Label htmlFor="excerpt" className="text-base font-medium mb-2 block">
            Resumo
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Um breve resumo que aparecerá na listagem de artigos. Deixe em branco para gerar automaticamente.
          </p>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => onExcerptChange(e.target.value)}
            placeholder="Escreva um resumo atrativo que desperte o interesse dos leitores..."
            className="border-primary/30 focus:border-primary resize-none"
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default ArticleBasicInfo;