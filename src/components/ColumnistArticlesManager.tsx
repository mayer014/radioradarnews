import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, FileText, Eye, Edit, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewsEditor from '@/components/NewsEditor';
import { getArticleLink } from '@/lib/utils';

const ColumnistArticlesManager: React.FC = () => {
  const { articles, deleteArticle, updateArticle } = useSupabaseNews();
  const { columnists } = useUsers();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedColumnist, setSelectedColumnist] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);

  const columnistArticles = useMemo(() => {
    if (selectedColumnist === 'all') {
      return articles.filter(article => article.columnist_id && article.status === 'published');
    }
    return articles.filter(article => article.columnist_id === selectedColumnist && article.status === 'published');
  }, [articles, selectedColumnist]);

  const articlesByColumnist = useMemo(() => {
    const grouped = columnists.reduce((acc, columnist) => {
      acc[columnist.id] = articles.filter(article => article.columnist_id === columnist.id && article.status === 'published');
      return acc;
    }, {} as Record<string, typeof articles>);
    return grouped;
  }, [articles, columnists]);

  const handleDeleteArticle = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
      deleteArticle(id);
    }
  };

  const handleEditArticle = (articleId: string) => {
    setEditingArticle(articleId);
    setShowEditor(true);
  };

  const handleToggleFeatured = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (!article) {
      console.error('Article not found:', articleId);
      return;
    }

    // Handle toggle featured article

    // Verificar se existe outro artigo em destaque na mesma categoria
    const currentFeaturedInCategory = articles.find(a => 
      a.category === article.category && a.featured && a.id !== articleId
    );

    // Check for existing featured article in category

    if (!article.featured && currentFeaturedInCategory) {
      const confirmMessage = `Há uma matéria já em destaque na categoria "${article.category}": "${currentFeaturedInCategory.title}". 

Deseja substituir por "${article.title}"?`;
      
      if (confirm(confirmMessage)) {
        // User confirmed replacement
        updateArticle(articleId, { featured: !article.featured });
        toast({
          title: "Destaque alterado",
          description: `"${article.title}" agora é destaque na categoria ${article.category}.`,
        });
      }
    } else {
      // No conflict, proceeding with toggle
      const oldFeaturedStatus = article.featured;
      updateArticle(articleId, { featured: !article.featured });
      
      // Toast será baseado no status anterior, pois a mudança pode não ter acontecido ainda
      toast({
        title: oldFeaturedStatus ? "Destaque removido" : "Destaque definido",
        description: oldFeaturedStatus 
          ? `"${article.title}" não é mais destaque.`
          : `"${article.title}" agora é destaque na categoria ${article.category}.`,
      });
    }
  };

  // Se estiver editando, mostrar o editor
  if (showEditor) {
    return (
      <NewsEditor
        articleId={editingArticle}
        onClose={() => {
          setShowEditor(false);
          setEditingArticle(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Artigos por Colunista
          </h3>
          <Select value={selectedColumnist} onValueChange={setSelectedColumnist}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecionar colunista" />
            </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colunistas</SelectItem>
                  {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => (
                    <SelectItem key={columnist.id} value={columnist.id}>
                      {columnist.name} ({articlesByColumnist[columnist.id]?.length || 0} artigos)
                    </SelectItem>
                  ))}
                </SelectContent>
          </Select>
        </div>

        {selectedColumnist === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => {
              const articles = articlesByColumnist[columnist.id] || [];
              return (
                <Card key={columnist.id} className="p-4 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={columnist.columnistProfile?.avatar} 
                      alt={columnist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{columnist.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {articles.length} artigo{articles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {columnist.columnistProfile?.allowedCategories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedColumnist(columnist.id)}
                  >
                    Ver artigos
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : (
          <div>
            {selectedColumnist !== 'all' && (
              <div className="mb-4 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={columnists.find(c => c.id === selectedColumnist)?.columnistProfile?.avatar} 
                    alt={columnists.find(c => c.id === selectedColumnist)?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">
                      {columnists.find(c => c.id === selectedColumnist)?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {columnistArticles.length} artigo{columnistArticles.length !== 1 ? 's' : ''} publicado{columnistArticles.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {columnistArticles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-48">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnistArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="line-clamp-2">{article.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              Por {article.columnist_name}
                            </p>
                            {article.is_column_copy && (
                              <Badge variant="secondary" className="text-xs">
                                Cópia da Coluna
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{article.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(article.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.featured ? "default" : "outline"}>
                          {article.featured ? 'Destaque' : 'Normal'}
                        </Badge>
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <Link to={getArticleLink(article)}>
                             <Button variant="ghost" size="sm" title="Visualizar artigo">
                               <Eye className="h-3 w-3" />
                             </Button>
                           </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Editar artigo"
                              onClick={() => handleEditArticle(article.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title={article.featured ? "Remover destaque" : "Destacar artigo"}
                              onClick={() => handleToggleFeatured(article.id)}
                              className={article.featured ? "text-yellow-600 hover:text-yellow-700" : "hover:text-yellow-600"}
                            >
                              <Star className={`h-3 w-3 ${article.featured ? "fill-current" : ""}`} />
                            </Button>
                           <Button 
                             variant="ghost" 
                             size="sm"
                             className="text-destructive hover:text-destructive"
                             onClick={() => handleDeleteArticle(article.id)}
                             title="Excluir artigo"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum artigo encontrado para este colunista</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ColumnistArticlesManager;