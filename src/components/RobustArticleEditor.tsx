import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { serviceLayer } from '@/services/SupabaseServiceLayer';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Save, Eye, Upload } from 'lucide-react';

interface ArticleFormData {
  id?: string;
  title: string;
  subtitle: string;
  body_richtext: string;
  excerpt: string;
  cover_image_url: string;
  status: 'draft' | 'published';
  author_id: string;
  category_id: string;
  scheduled_for?: string;
  seo_jsonb: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
}

interface RobustArticleEditorProps {
  articleId?: string;
  onSave?: (article: any) => void;
  onClose?: () => void;
}

const RobustArticleEditor: React.FC<RobustArticleEditorProps> = ({
  articleId,
  onSave,
  onClose
}) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    subtitle: '',
    body_richtext: '',
    excerpt: '',
    cover_image_url: '',
    status: 'draft',
    author_id: '',
    category_id: '',
    seo_jsonb: {}
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadInitialData();
  }, [articleId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load categories and authors
      const [categoriesResult, authorsResult] = await Promise.all([
        supabase.from('categories').select('id, name, slug').eq('is_active', true),
        supabase.from('authors').select('id, name').eq('is_active', true)
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (authorsResult.data) setAuthors(authorsResult.data);

      // Load article if editing
      if (articleId) {
        const { data: article, error } = await supabase
          .from('articles_normalized')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) throw error;
        if (article) {
          // Properly cast seo_jsonb to match our interface
          const seoData = article.seo_jsonb && typeof article.seo_jsonb === 'object' && !Array.isArray(article.seo_jsonb) 
            ? article.seo_jsonb as { meta_title?: string; meta_description?: string; keywords?: string[]; }
            : {};
          
          setFormData({
            ...article,
            seo_jsonb: seoData
          });
        }
      } else {
        // Set default author to current user if available
        const userAuthor = authorsResult.data?.find(a => a.id === user?.id);
        if (userAuthor) {
          setFormData(prev => ({ ...prev, author_id: userAuthor.id }));
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações necessárias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true);

      // Validation
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }
      
      if (!formData.body_richtext.trim()) {
        throw new Error('Conteúdo é obrigatório');
      }

      if (!formData.excerpt.trim()) {
        throw new Error('Resumo é obrigatório');
      }

      if (!formData.author_id) {
        throw new Error('Autor é obrigatório');
      }

      if (!formData.category_id) {
        throw new Error('Categoria é obrigatória');
      }

      // Prepare data
      const articleData = {
        ...formData,
        status: publish ? 'published' : formData.status
      };

      let result;
      
      if (articleId) {
        // Update existing article
        result = await serviceLayer.updateArticle(articleId, articleData);
      } else {
        // Create new article
        result = await serviceLayer.createArticle(articleData);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: publish ? "Artigo publicado!" : "Artigo salvo!",
        description: `Artigo ${publish ? 'publicado' : 'salvo'} com sucesso`,
      });

      if (onSave) {
        onSave(result.data);
      }

      if (onClose && !articleId) {
        onClose();
      }

    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o artigo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload directly to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ 
        ...prev, 
        cover_image_url: publicUrl 
      }));
      
      toast({
        title: "Imagem carregada",
        description: "Imagem de capa carregada com sucesso",
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível carregar a imagem",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            {articleId ? 'Editar Artigo' : 'Novo Artigo'}
          </h1>
          <p className="text-muted-foreground">
            Editor robusto com validação e retry automático
          </p>
        </div>
        <div className="flex space-x-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-gradient-hero"
          >
            <Eye className="h-4 w-4 mr-2" />
            {saving ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título do artigo"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Digite o subtítulo (opcional)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Resumo *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Escreva um resumo do artigo"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Content */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Conteúdo</h3>
            <div>
              <Label htmlFor="content">Conteúdo do Artigo *</Label>
              <Textarea
                id="content"
                value={formData.body_richtext}
                onChange={(e) => setFormData(prev => ({ ...prev, body_richtext: e.target.value }))}
                placeholder="Escreva o conteúdo do artigo"
                rows={15}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                HTML básico é suportado (p, strong, em, a, ul, ol, li)
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status atual:</span>
                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                  {formData.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Meta Info */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Configurações</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="author">Autor *</Label>
                <Select 
                  value={formData.author_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, author_id: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o autor" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Cover Image */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Imagem de Capa</h3>
            <div className="space-y-4">
              {formData.cover_image_url && (
                <div>
                  <img 
                    src={formData.cover_image_url} 
                    alt="Capa do artigo" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="image-upload">Carregar Imagem</Label>
                <div className="mt-1">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Clique para carregar imagem</p>
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image-url">Ou cole a URL</Label>
                <Input
                  id="image-url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* SEO */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meta-title">Meta Título</Label>
                <Input
                  id="meta-title"
                  value={formData.seo_jsonb.meta_title || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seo_jsonb: { ...prev.seo_jsonb, meta_title: e.target.value }
                  }))}
                  placeholder="Título para SEO"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="meta-description">Meta Descrição</Label>
                <Textarea
                  id="meta-description"
                  value={formData.seo_jsonb.meta_description || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seo_jsonb: { ...prev.seo_jsonb, meta_description: e.target.value }
                  }))}
                  placeholder="Descrição para SEO"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RobustArticleEditor;