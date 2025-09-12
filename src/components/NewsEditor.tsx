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
import AIArticleGeneratorStep from '@/components/news-editor/AIArticleGeneratorStep';
import FavoriteSites from '@/components/FavoriteSites';
import type { RewrittenContent } from '@/services/AIContentRewriter';

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

  // Carregar dados se for edição
  useEffect(() => {
    if (articleId) {
      const article = getArticleById(articleId);
      if (article) {
        setFormData({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          category: article.category,
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
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, conteúdo e categoria.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Use forcedDraftStatus if provided, otherwise use formData.isDraft
      const isDraft = forcedDraftStatus !== undefined ? forcedDraftStatus : formData.isDraft;
      
      // Auto-gerar excerpt se não fornecido
      const excerpt = formData.excerpt.trim() || generateExcerpt(formData.content);

      // Obter informações do colunista selecionado (se houver)
      let columnistInfo = undefined;
      
      if (formData.selectedColumnist) {
        // Buscar dados do colunista selecionado usando o contexto
        const selectedUser = users.find(u => u.id === formData.selectedColumnist && u.role === 'colunista');
        if (selectedUser?.columnistProfile) {
          columnistInfo = {
            id: selectedUser.id,
            name: selectedUser.name,
            avatar: selectedUser.columnistProfile.avatar,
            bio: selectedUser.columnistProfile.bio,
            specialty: selectedUser.columnistProfile.specialty
          };
        }
      }
      
      // Se o usuário atual é colunista, usar suas próprias informações
      if (profile?.role === 'colunista') {
        columnistInfo = {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          bio: profile.bio,
          specialty: profile.specialty
        };
      }

      const articleData = {
        title: formData.title,
        content: formData.content,
        excerpt,
        category: formData.category,
        featured_image: formData.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
        featured: formData.featured,
        status: isDraft ? 'draft' as const : 'published' as const,
        is_column_copy: false,
        source_url: '',
        source_domain: '',
        columnist_id: columnistInfo?.id,
        columnist_name: columnistInfo?.name,
        columnist_avatar: columnistInfo?.avatar,
        columnist_bio: columnistInfo?.bio,
        columnist_specialty: columnistInfo?.specialty
      };

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
        'Tecnologia': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
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
      category: rewrittenContent.category_suggestion,
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

  const handleAIGeneration = (article: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    selectedColumnist?: string;
  }) => {
    setFormData({
      ...formData,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      selectedColumnist: article.selectedColumnist || '',
    });

    toast({
      title: "Artigo gerado com sucesso!",
      description: "O conteúdo foi preenchido automaticamente. Você pode revisar e ajustar antes de publicar.",
    });

    // Avançar para o próximo step
    goNext();
  };

  // Wizard steps configuration
  const steps = [
    { key: 'favorites', label: 'Sites Favoritos', hidden: !!articleId || profile?.role !== 'admin' },
    { key: 'import', label: 'Importar URL', hidden: !!articleId || profile?.role === 'colunista' },
    { key: 'ai-generate', label: 'Gerar com IA', hidden: !!articleId },
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

        {visibleSteps[activeStep]?.key === 'ai-generate' && !articleId && (
          <div className="mb-8">
            <AIArticleGeneratorStep onArticleGenerated={handleAIGeneration} />
          </div>
        )}

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