import React from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NEWS_CATEGORIES } from '@/contexts/NewsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { Star, Eye, Info, User } from 'lucide-react';

interface ArticleSettingsProps {
  category: string;
  featured: boolean;
  selectedColumnist?: string;
  onCategoryChange: (category: string) => void;
  onFeaturedChange: (featured: boolean) => void;
  onColumnistChange?: (columnistId: string) => void;
}

const ArticleSettings: React.FC<ArticleSettingsProps> = ({
  category,
  featured,
  selectedColumnist,
  onCategoryChange,
  onFeaturedChange,
  onColumnistChange,
}) => {
  const { currentUser } = useAuth();
  const { columnists } = useUsers();
  
  // Para colunistas, categoria é automática (sua própria área)
  React.useEffect(() => {
    if (currentUser?.role === 'colunista' && !category) {
      // Categoria automática para colunistas - sempre "Artigo"
      onCategoryChange('Artigo');
    }
  }, [currentUser?.role, category, onCategoryChange]);

  // Limitar categorias - colunistas não escolhem categoria
  const availableCategories = React.useMemo(() => {
    if (currentUser?.role === 'colunista') {
      return []; // Colunistas não selecionam categoria
    }
    return NEWS_CATEGORIES;
  }, [currentUser?.role]);

  // Verificar permissões de destaque
  const canHighlight = React.useMemo(() => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'colunista') return true; // Colunistas podem destacar seus próprios artigos
    return true;
  }, [currentUser?.role]);

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Configurações de Publicação
      </h3>
      
      <div className="space-y-6">
        {/* Categoria - apenas para admins, colunistas têm categoria automática */}
        {currentUser?.role === 'admin' && (
          <div>
            <Label htmlFor="category" className="text-base font-medium mb-3 block">
              Categoria
            </Label>
            <Select
              value={category}
              onValueChange={onCategoryChange}
            >
              <SelectTrigger className="border-primary/30 focus:border-primary">
                <SelectValue placeholder="Escolha a categoria do artigo" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                {NEWS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="hover:bg-primary/10">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <Badge variant="secondary" className="mt-2">
                {category}
              </Badge>
            )}
          </div>
        )}

        {/* Informação para colunistas */}
        {currentUser?.role === 'colunista' && (
          <Alert className="border-primary/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Como colunista, seus artigos são publicados automaticamente na sua seção de artigos.
            </AlertDescription>
          </Alert>
        )}

        {/* Seleção de Colunista - apenas para admins */}
        {currentUser?.role === 'admin' && columnists.length > 0 && onColumnistChange && (
          <div>
            <Label htmlFor="columnist" className="text-base font-medium mb-3 block">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Atribuir Colunista (Opcional)
              </div>
            </Label>
            <Select
              value={selectedColumnist || 'none'}
              onValueChange={(value) => onColumnistChange(value === 'none' ? '' : value)}
            >
              <SelectTrigger className="border-primary/30 focus:border-primary">
                <SelectValue placeholder="Selecione um colunista para este artigo" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                <SelectItem value="none" className="hover:bg-primary/10">
                  Nenhum colunista
                </SelectItem>
                {columnists.map((columnist) => (
                  <SelectItem key={columnist.id} value={columnist.id} className="hover:bg-primary/10">
                    <div className="flex items-center gap-2">
                      <img 
                        src={columnist.columnistProfile?.avatar} 
                        alt={columnist.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      {columnist.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedColumnist && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="border-primary/50">
                  <User className="w-3 h-3 mr-1" />
                  {columnists.find(c => c.id === selectedColumnist)?.name}
                </Badge>
              </div>
            )}
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Ao atribuir um colunista, o artigo aparecerá na seção do colunista quando publicado.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="border-t border-primary/20 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-primary" />
                <Label htmlFor="featured" className="text-base font-medium">
                  Artigo em Destaque
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Artigos em destaque aparecem com maior prominência na página inicial
              </p>
              {!canHighlight && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Você pode destacar artigos apenas nas suas categorias permitidas
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Switch
              id="featured"
              checked={featured}
              onCheckedChange={canHighlight ? onFeaturedChange : undefined}
              disabled={!canHighlight}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ArticleSettings;