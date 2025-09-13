import React, { useState, useEffect } from 'react';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, Plus, Edit } from 'lucide-react';
import ModularURLImporter from '@/components/ModularURLImporter';
import ArticleBasicInfo from '@/components/news-editor/ArticleBasicInfo';
import ArticleContentEditor from '@/components/news-editor/ArticleContentEditor';
import ArticleSettings from '@/components/news-editor/ArticleSettings';
import ArticleImageUpload from '@/components/news-editor/ArticleImageUpload';
import ArticleMetadata from '@/components/news-editor/ArticleMetadata';
import StepNav from '@/components/news-editor/StepNav';
import ArticleReview from '@/components/news-editor/ArticleReview';
import FavoriteSites from '@/components/FavoriteSites';
import type { RewrittenContent } from '@/services/AIContentRewriter';
import { getInternalCategorySlug } from '@/utils/categoryMapper';

interface NewsEditorProps {
  articleId?: string | null;
  onClose: () => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ articleId, onClose }) => {
  const { articles, addArticle, updateArticle, getArticleById } = useSupabaseNews();
  const { profile } = useSupabaseAuth();
  const { users } = useUsers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    featuredImage: '',
    featured: false,
    isDraft: false,
    selectedColumnist: ''
  });

  // Estado para opções de publicação (administrador)
  const [publishingOptions, setPublishingOptions] = useState<{
    publishType: 'category' | 'columnist';
    selectedCategory?: string;
    selectedColumnist?: string;
  }>({
    publishType: 'category',
    selectedCategory: '',
    selectedColumnist: ''
  });

  // Carregar dados se for edição
  useEffect(() => {
    if (articleId) {
      const article = getArticleById(articleId);
      if (article) {
        setFormData({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          category: article.category, // Manter categoria como slug interno
          featuredImage: article.featured_image || '',
          featured: article.featured,
          isDraft: article.status === 'draft',
          selectedColumnist: article.columnist_id || ''
        });
      }
    }
  }, [articleId, getArticleById]);

  const generateExcerpt = (content: string): string => {
    // Remove HTML tags e pega os primeiros 150 caracteres
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 150 
      ? textContent.substring(0, 150) + '...'
      : textContent;
  };

  const handleSave = async (forcedDraftStatus?: boolean) => {
    const isColumnist = profile?.role === 'colunista';
    const isAdmin = profile?.role === 'admin';
    
    // Validações básicas
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo.",
        variant: "destructive",
      });
      return;
    }

    // Validações específicas por tipo de usuário
    if (isAdmin) {
      // Administrador deve escolher tipo de publicação
      if (!publishingOptions.publishType) {
        toast({
          title: "Opção de publicação obrigatória",
          description: "Como administrador, você deve escolher onde publicar o artigo.",
          variant: "destructive",
        });
        return;
      }
      
      // Validar se categoria foi selecionada (se tipo for categoria)
      if (publishingOptions.publishType === 'category' && !publishingOptions.selectedCategory) {
        toast({
          title: "Categoria obrigatória",
          description: "Selecione uma categoria para publicar o artigo.",
          variant: "destructive",
        });
        return;
      }
      
      // Validar se colunista foi selecionado (se tipo for colunista)
      if (publishingOptions.publishType === 'columnist' && !publishingOptions.selectedColumnist) {
        toast({
          title: "Colunista obrigatório",
          description: "Selecione um colunista para publicar o artigo.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Use forcedDraftStatus if provided, otherwise use formData.isDraft
      const isDraft = forcedDraftStatus !== undefined ? forcedDraftStatus : formData.isDraft;
      
      // Auto-gerar excerpt se não fornecido
      const excerpt = formData.excerpt.trim() || generateExcerpt(formData.content);

      // Determinar dados do artigo baseado no tipo de usuário e opções
      let articleData: any;
      
      if (isColumnist) {
        // Colunista: sempre publica em sua própria página
        articleData = {
          title: formData.title,
          content: formData.content,
          excerpt,
          category: 'Artigo', // Categoria padrão para artigos de colunista
          featured_image: formData.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
          featured: formData.featured,
          status: isDraft ? 'draft' as const : 'published' as const,
          is_column_copy: false,
          source_url: '',
          source_domain: '',
          columnist_id: profile.id,
          columnist_name: profile.name,
          columnist_avatar: profile.avatar,
          columnist_bio: profile.bio,
          columnist_specialty: profile.specialty
        };
      } else if (isAdmin) {
        // Administrador: usar opções de publicação selecionadas
        if (publishingOptions.publishType === 'category') {
          // Publicar como artigo de categoria - converter para slug interno
          const categorySlug = getInternalCategorySlug(publishingOptions.selectedCategory || '');
          articleData = {
            title: formData.title,
            content: formData.content,
            excerpt,
            category: categorySlug,
            featured_image: formData.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
            featured: formData.featured,
            status: isDraft ? 'draft' as const : 'published' as const,
            is_column_copy: false,
            source_url: '',
            source_domain: '',
            columnist_id: null,
            columnist_name: null,
            columnist_avatar: null,
            columnist_bio: null,
            columnist_specialty: null
          };
        } else {
          // Publicar em nome de um colunista
          const selectedUser = users.find(u => u.id === publishingOptions.selectedColumnist && u.role === 'colunista');
          if (selectedUser?.columnistProfile) {
            articleData = {
              title: formData.title,
              content: formData.content,
              excerpt,
              category: 'Artigo', // Categoria padrão para artigos de colunista
              featured_image: formData.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
              featured: formData.featured,
              status: isDraft ? 'draft' as const : 'published' as const,
              is_column_copy: false,
              source_url: '',
              source_domain: '',
              columnist_id: selectedUser.id,
              columnist_name: selectedUser.name,
              columnist_avatar: selectedUser.columnistProfile.avatar || profile?.avatar,
              columnist_bio: selectedUser.columnistProfile.bio || profile?.bio,
              columnist_specialty: selectedUser.columnistProfile.specialty || profile?.specialty
            };
          }
        }
      }

      // Save article data
      if (articleId) {
        // Updating existing article
        updateArticle(articleId, articleData);
        toast({
          title: "Artigo atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Adding new article
        addArticle(articleData);
        toast({
          title: isDraft ? "Rascunho salvo" : "Artigo publicado",
          description: isDraft 
            ? "O rascunho foi salvo e pode ser editado posteriormente." 
            : "O novo artigo foi publicado com sucesso.",
        });
      }

      // Save completed, closing editor
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = (data: {
    rewrittenContent: RewrittenContent;
    generatedImage?: { url: string };
    saveAsDraft: boolean;
  }) => {
    const { rewrittenContent, generatedImage, saveAsDraft } = data;
    
    // Generate slug from title if not provided
    const slug = rewrittenContent.slug || 
      rewrittenContent.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 60);

    // Use generated image if available, otherwise use a default based on category
    let featuredImage = '';
    if (generatedImage?.url) {
      featuredImage = generatedImage.url;
    } else {
      // Category-based default images
      const categoryImages = {
        'Política': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop',
        'Policial': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        'Entretenimento': 'https://images.unsplash.com/photo-1499364615650-ec38552909c6?w=800&h=400&fit=crop',
        'Internacional': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
        'Esportes': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
        'Tecnologia / Economia': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
        'Ciência / Saúde': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=400&fit=crop'
      };
      featuredImage = categoryImages[rewrittenContent.category_suggestion as keyof typeof categoryImages] || 
                     'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';
    }

    // Fill form with imported content
    setFormData({
      title: rewrittenContent.title,
      content: rewrittenContent.content_html,
      excerpt: rewrittenContent.excerpt,
      category: getInternalCategorySlug(rewrittenContent.category_suggestion),
      featuredImage,
      featured: false,
      isDraft: saveAsDraft,
      selectedColumnist: ''
    });

    toast({
      title: "Conteúdo importado com sucesso!",
      description: `Artigo "${rewrittenContent.title}" foi importado com conteúdo completo, fonte e imagem.`,
    });
  };

  // Wizard steps configuration
  const steps = [
    { key: 'favorites', label: 'Sites Favoritos', hidden: !!articleId || profile?.role !== 'admin' },
    { key: 'import', label: 'Importar URL', hidden: !!articleId || profile?.role === 'colunista' },
    { key: 'basic', label: 'Informações Básicas' },
    { key: 'content', label: 'Conteúdo' },
    { key: 'media', label: 'Imagem e Configurações' },
    { key: 'review', label: 'Revisão' },
  ];

  const visibleSteps = steps.filter((s) => !s.hidden);
  const [activeStep, setActiveStep] = useState(!!articleId ? 1 : 0);
  const goNext = () => setActiveStep((s) => Math.min(s + 1, visibleSteps.length - 1));
  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));
  const isLastStep = activeStep === visibleSteps.length - 1;
  const reviewIdx = visibleSteps.findIndex((s) => s.key === 'review');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-card backdrop-blur-sm border-b border-primary/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-primary/50 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                {articleId ? (
                  <Edit className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-primary" />
                )}
                <div>
                  <h1 className="text-xl font-bold">
                    {articleId ? 'Editar Artigo' : 'Criar Novo Artigo'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {articleId ? 'Faça as alterações necessárias' : 'Crie um artigo completo e atrativo'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => reviewIdx >= 0 && setActiveStep(reviewIdx)}
                className="border-secondary/50 text-secondary hover:bg-secondary/10 flex-1 sm:flex-none"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              
              <Button
                onClick={() => handleSave(true)}
                disabled={loading}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Rascunho'}
              </Button>
              
              <Button
                onClick={() => handleSave(false)}
                disabled={loading}
                className="bg-gradient-hero hover:shadow-glow-primary flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Publicando...' : (articleId ? 'Atualizar' : 'Publicar')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Navigation + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <StepNav steps={steps} currentStep={activeStep} onStepChange={setActiveStep} />
        </div>

        {visibleSteps[activeStep]?.key === 'import' && !articleId && (
          <div className="mb-8">
            <ModularURLImporter onImportComplete={(data) => {
              handleImportComplete(data);
              goNext();
            }} />
          </div>
        )}

        {visibleSteps[activeStep]?.key === 'favorites' && !articleId && profile?.role === 'admin' && (
          <div className="mb-8">
            <FavoriteSites />
          </div>
        )}

        {visibleSteps[activeStep]?.key === 'basic' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            <div className="xl:col-span-3">
              <ArticleBasicInfo
                title={formData.title}
                excerpt={formData.excerpt}
                onTitleChange={(title) => setFormData({ ...formData, title })}
                onExcerptChange={(excerpt) => setFormData({ ...formData, excerpt })}
              />
            </div>
            <div className="xl:col-span-1 space-y-6">
              <ArticleSettings
                category={formData.category}
                featured={formData.featured}
                selectedColumnist={formData.selectedColumnist}
                onCategoryChange={(category) => setFormData({ ...formData, category })}
                onFeaturedChange={(featured) => setFormData({ ...formData, featured })}
                onColumnistChange={(selectedColumnist) => setFormData({ ...formData, selectedColumnist })}
              />
              {articleId && (() => {
                const article = getArticleById(articleId);
                return article ? <ArticleMetadata article={article as any} /> : null;
              })()}
            </div>
          </div>
        )}

        {visibleSteps[activeStep]?.key === 'content' && (
          <ArticleContentEditor
            content={formData.content}
            onContentChange={(content) => setFormData({ ...formData, content })}
          />
        )}

        {visibleSteps[activeStep]?.key === 'media' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            <div className="xl:col-span-3">
              <ArticleImageUpload
                featuredImage={formData.featuredImage}
                onImageChange={(featuredImage) => setFormData({ ...formData, featuredImage })}
              />
            </div>
            <div className="xl:col-span-1">
              <ArticleSettings
                category={formData.category}
                featured={formData.featured}
                selectedColumnist={formData.selectedColumnist}
                onCategoryChange={(category) => setFormData({ ...formData, category })}
                onFeaturedChange={(featured) => setFormData({ ...formData, featured })}
                onColumnistChange={(selectedColumnist) => setFormData({ ...formData, selectedColumnist })}
              />
            </div>
          </div>
        )}

        {visibleSteps[activeStep]?.key === 'review' && (
          <div className="space-y-6">
            <ArticleReview
              data={{
                title: formData.title,
                excerpt: formData.excerpt,
                category: formData.category,
                featuredImage: formData.featuredImage,
                content: formData.content,
              }}
              publishingOptions={publishingOptions}
              onPublishingOptionsChange={setPublishingOptions}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={activeStep === 0}
            className="border-primary/50 hover:bg-primary/10"
          >
            Voltar
          </Button>

          {isLastStep ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                {loading ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={loading}
                className="bg-gradient-hero hover:shadow-glow-primary"
              >
                {loading ? 'Publicando...' : (articleId ? 'Atualizar' : 'Publicar')}
              </Button>
            </div>
          ) : (
            <Button onClick={goNext} className="bg-gradient-hero hover:shadow-glow-primary">
              Próximo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsEditor;