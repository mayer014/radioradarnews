import React from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Star, Eye, Info } from 'lucide-react';

interface ArticleSettingsProps {
  featured: boolean;
  onFeaturedChange: (featured: boolean) => void;
}

const ArticleSettings: React.FC<ArticleSettingsProps> = ({
  featured,
  onFeaturedChange,
}) => {
  const { profile } = useSupabaseAuth();

  // Verificar permissões de destaque
  const canHighlight = React.useMemo(() => {
    if (profile?.role === 'admin') return true;
    if (profile?.role === 'colunista') return true; // Colunistas podem destacar seus próprios artigos
    return true;
  }, [profile?.role]);

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Configurações de Publicação
      </h3>
      
      <div className="space-y-6">
        {/* Informação para colunistas */}
        {profile?.role === 'colunista' && (
          <Alert className="border-primary/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Como colunista, seus artigos são publicados automaticamente na sua seção de artigos.
            </AlertDescription>
          </Alert>
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