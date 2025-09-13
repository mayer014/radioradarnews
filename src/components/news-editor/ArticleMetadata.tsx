import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Clock } from 'lucide-react';
import type { NewsArticle } from '@/contexts/SupabaseNewsContext';

interface ArticleMetadataProps {
  article: NewsArticle;
}

const ArticleMetadata: React.FC<ArticleMetadataProps> = ({ article }) => {
  return (
    <Card className="bg-gradient-card border-accent/30 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Informações do Artigo
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium">Data de Criação</p>
            <p className="text-sm text-muted-foreground">
              {new Date(article.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium">Última Atualização</p>
            <p className="text-sm text-muted-foreground">
              {new Date(article.updated_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Eye className="h-4 w-4 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium">Visualizações</p>
            <p className="text-sm text-muted-foreground">
              {article.views.toLocaleString('pt-BR')} visualizações
            </p>
          </div>
        </div>

        <div className="border-t border-accent/20 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Status:</p>
            <Badge variant={article.status === 'draft' ? "secondary" : "default"}>
              {article.status === 'draft' ? "Rascunho" : "Publicado"}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ArticleMetadata;