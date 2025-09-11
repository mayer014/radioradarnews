import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewData {
  title: string;
  excerpt: string;
  category: string;
  featuredImage: string;
  content: string;
}

interface ArticleReviewProps {
  data: ReviewData;
}

const ArticleReview: React.FC<ArticleReviewProps> = ({ data }) => {
  const { title, excerpt, category, featuredImage, content } = data;

  return (
    <Card className="bg-gradient-card border-primary/30 overflow-hidden">
      {featuredImage && (
        <div className="aspect-[16/7] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImage}
            alt={`Imagem de destaque do artigo: ${title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {category && <Badge variant="secondary">{category}</Badge>}
          <Badge>{excerpt ? 'Com resumo' : 'Resumo automático'}</Badge>
        </div>

        <h2 className="text-2xl font-bold leading-tight">{title || 'Sem título'}</h2>
        {excerpt && (
          <p className="text-muted-foreground">{excerpt}</p>
        )}

        <div className="prose max-w-none prose-p:my-4 prose-headings:mt-8 prose-headings:mb-3 prose-li:my-1 dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: content || '<p>Seu conteúdo aparecerá aqui...</p>' }} />
        </div>
      </div>
    </Card>
  );
};

export default ArticleReview;
