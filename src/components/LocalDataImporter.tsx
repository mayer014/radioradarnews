import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';

interface LocalArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featuredImage?: string;
  featured: boolean;
  isDraft?: boolean;
  createdAt: string;
  updatedAt: string;
}

const LocalDataImporter = () => {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const { addArticle } = useSupabaseNews();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const importLocalArticles = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para importar dados.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      // Get articles from localStorage
      const localArticlesData = localStorage.getItem('news_articles');
      if (!localArticlesData) {
        toast({
          title: "Nenhum dado local encontrado",
          description: "Não há artigos salvos localmente para importar.",
          variant: "destructive",
        });
        return;
      }

      const localArticles: LocalArticle[] = JSON.parse(localArticlesData);
      let successCount = 0;
      let errorCount = 0;

      for (const article of localArticles) {
        try {
          const result = await addArticle({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            category: article.category,
            featured_image: article.featuredImage,
            featured: article.featured,
            status: article.isDraft ? 'draft' : 'published',
            is_column_copy: false,
            source_url: '',
            source_domain: ''
          });

          if (result.error) {
            console.error('Error importing article:', article.title, result.error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error importing article:', article.title, error);
          errorCount++;
        }
      }

      // Clear local storage after successful import
      if (successCount > 0) {
        localStorage.removeItem('news_articles');
        setImported(true);
      }

      toast({
        title: "Importação concluída",
        description: `${successCount} artigos importados com sucesso. ${errorCount > 0 ? `${errorCount} falharam.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os dados locais.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const checkLocalData = () => {
    const localArticlesData = localStorage.getItem('news_articles');
    if (!localArticlesData) return 0;
    
    try {
      const articles = JSON.parse(localArticlesData);
      return Array.isArray(articles) ? articles.length : 0;
    } catch {
      return 0;
    }
  };

  const localArticlesCount = checkLocalData();

  if (imported || localArticlesCount === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-card border-primary/30 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <AlertCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            Dados Locais Encontrados
          </h3>
          <p className="text-muted-foreground mb-4">
            Encontramos {localArticlesCount} artigos salvos localmente. 
            Deseja importá-los para o banco de dados Supabase? 
            Isso permitirá que os dados sejam sincronizados entre dispositivos.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={importLocalArticles}
              disabled={importing || !user}
              className="bg-gradient-hero hover:shadow-glow-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              {importing ? 'Importando...' : 'Importar Dados'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setImported(true)}
              className="border-primary/50"
            >
              Pular
            </Button>
          </div>
          {!user && (
            <p className="text-amber-600 text-sm mt-2">
              ⚠️ Você precisa estar logado para importar dados.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LocalDataImporter;