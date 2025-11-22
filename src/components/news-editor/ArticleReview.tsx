import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { BASE_NEWS_CATEGORIES } from '@/contexts/SupabaseNewsContext';
import { sanitizeHtml } from '@/utils/contentSanitizer';

interface ReviewData {
  title: string;
  excerpt: string;
  category: string;
  featured_image: string;
  content: string;
}

interface PublishingOptions {
  publishType: 'category' | 'columnist';
  selectedCategory?: string;
  selectedColumnist?: string;
}

interface ArticleReviewProps {
  data: ReviewData;
  publishingOptions?: PublishingOptions;
  onPublishingOptionsChange?: (options: PublishingOptions) => void;
}

const ArticleReview: React.FC<ArticleReviewProps> = ({ 
  data, 
  publishingOptions, 
  onPublishingOptionsChange 
}) => {
  const { title, excerpt, category, featured_image, content } = data;
  const { profile } = useSupabaseAuth();
  const { users } = useUsers();
  
  const isAdmin = profile?.role === 'admin';
  const columnists = users.filter(user => user.role === 'colunista' && user.columnistProfile?.isActive);

  const handlePublishTypeChange = (value: 'category' | 'columnist') => {
    if (onPublishingOptionsChange) {
      onPublishingOptionsChange({
        publishType: value,
        selectedCategory: value === 'category' ? publishingOptions?.selectedCategory || '' : undefined,
        selectedColumnist: value === 'columnist' ? publishingOptions?.selectedColumnist || '' : undefined,
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    if (onPublishingOptionsChange && publishingOptions) {
      onPublishingOptionsChange({
        ...publishingOptions,
        selectedCategory: value,
      });
    }
  };

  const handleColumnistChange = (value: string) => {
    if (onPublishingOptionsChange && publishingOptions) {
      onPublishingOptionsChange({
        ...publishingOptions,
        selectedColumnist: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 overflow-hidden">
        {featured_image && (
          <div className="aspect-[16/7] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured_image}
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
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '<p>Seu conteúdo aparecerá aqui...</p>') }} />
          </div>
        </div>
      </Card>

      {/* Opções de Publicação - Apenas para Administradores */}
      {isAdmin && (
        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Opções de Publicação</h3>
            </div>
            
            <Alert>
              <AlertDescription>
                Como administrador, você deve escolher onde este artigo será publicado: em uma categoria específica ou em nome de um colunista.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="publishType">Tipo de Publicação</Label>
                <Select
                  value={publishingOptions?.publishType || ''}
                  onValueChange={handlePublishTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione onde publicar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Publicar em Categoria</SelectItem>
                    <SelectItem value="columnist">Publicar como Colunista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {publishingOptions?.publishType === 'category' && (
                <div>
                  <Label htmlFor="selectedCategory">Categoria</Label>
                  <Select
                    value={publishingOptions?.selectedCategory || ''}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {BASE_NEWS_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {publishingOptions?.publishType === 'columnist' && (
                <div>
                  <Label htmlFor="selectedColumnist">Colunista</Label>
                  <Select
                    value={publishingOptions?.selectedColumnist || ''}
                    onValueChange={handleColumnistChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colunista" />
                    </SelectTrigger>
                    <SelectContent>
                      {columnists.map(columnist => (
                        <SelectItem key={columnist.id} value={columnist.id}>
                          {columnist.name} - {columnist.columnistProfile?.specialty || 'Especialidade não definida'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ArticleReview;
