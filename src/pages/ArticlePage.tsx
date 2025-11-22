import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RadioPlayer from '@/components/RadioPlayer';
import CommentsSection from '@/components/CommentsSection';
import { ShareMenu } from '@/components/share/ShareMenu';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { getArticleLink } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { LoadingState, ArticleSkeleton } from '@/components/accessibility/LoadingState';
import { generateMetaDescription, generatePageTitle, generateKeywordsFromContent, optimizeImageAlt, generateBreadcrumbData } from '@/utils/seoUtils';
import useAccessibility, { useLoadingAnnouncement } from '@/hooks/useAccessibility';
import { supabase } from '@/integrations/supabase/client';

// Função para formatar o conteúdo do artigo
const formatArticleContent = (content: string): string => {
  let formattedContent = content;
  
  // Adiciona espaçamento entre parágrafos se não existir
  formattedContent = formattedContent.replace(/<\/p><p>/g, '</p>\n\n<p>');
  
  // Garante que há quebras de linha antes e depois de headings
  formattedContent = formattedContent.replace(/<h([1-6])[^>]*>/g, '\n\n<h$1>');
  formattedContent = formattedContent.replace(/<\/h([1-6])>/g, '</h$1>\n\n');
  
  // Adiciona espaçamento em listas
  formattedContent = formattedContent.replace(/<\/li><li>/g, '</li>\n<li>');
  formattedContent = formattedContent.replace(/<ul[^>]*>/g, '\n\n<ul>');
  formattedContent = formattedContent.replace(/<\/ul>/g, '</ul>\n\n');
  formattedContent = formattedContent.replace(/<ol[^>]*>/g, '\n\n<ol>');
  formattedContent = formattedContent.replace(/<\/ol>/g, '</ol>\n\n');
  
  // Adiciona espaçamento em blockquotes
  formattedContent = formattedContent.replace(/<blockquote[^>]*>/g, '\n\n<blockquote>');
  formattedContent = formattedContent.replace(/<\/blockquote>/g, '</blockquote>\n\n');
  
  // Remove múltiplas quebras de linha consecutivas
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  // Remove espaços em branco desnecessários
  formattedContent = formattedContent.trim();
  
  return formattedContent;
};

const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getArticleById, incrementViews, articles } = useSupabaseNews();
  const { announcePageChange } = useAccessibility();
  const { announceLoadingState } = useLoadingAnnouncement();
  const [isLoading, setIsLoading] = React.useState(true);
  const [columnistProfile, setColumnistProfile] = React.useState<any>(null);
  
  const article = id ? getArticleById(id) : null;
  
  // Loading state simulation - only depends on ID changes
  React.useEffect(() => {
    setIsLoading(true);
    announceLoadingState(true, 'artigo');
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      announceLoadingState(false, 'artigo');
      
      const currentArticle = id ? getArticleById(id) : null;
      if (currentArticle) {
        announcePageChange(`Artigo carregado: ${currentArticle.title}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [id]); // Only depend on ID changes

  // Load columnist profile from Supabase when article changes
  React.useEffect(() => {
    const loadColumnistProfile = async () => {
      if (article?.columnist_id) {
        try {
          const { data, error } = await supabase.rpc('get_columnist_info', { 
            columnist_id: article.columnist_id 
          });

          if (!error && data && data.length > 0) {
            setColumnistProfile(data[0]);
          }
        } catch (error) {
          console.error('Error loading columnist profile:', error);
        }
      }
    };

    if (article) {
      loadColumnistProfile();
    }
  }, [article]);

  // Incrementar visualizações quando o loading terminar
  React.useEffect(() => {
    if (!isLoading && id) {
      const currentArticle = getArticleById(id);
      if (currentArticle) {
        incrementViews(currentArticle.id);
      }
    }
  }, [isLoading, id, getArticleById, incrementViews]);

  // Scroll para o topo quando mudar de artigo
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Carregando artigo..."
          description="Portal News - Carregando conteúdo"
        />
        <Navigation />
        <main className="max-w-4xl mx-auto px-6 py-8" id="main-content">
          <ArticleSkeleton />
        </main>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Artigo não encontrado - Portal News"
          description="O artigo solicitado não foi encontrado. Volte à página inicial para ver as últimas notícias."
        />
        <Navigation />
        <main className="flex items-center justify-center min-h-screen" id="main-content">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              O artigo que você está procurando não existe ou foi removido.
            </p>
            <Link to="/">
              <Button className="bg-gradient-hero hover:shadow-glow-primary">
                Voltar ao início
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  // Generate SEO data
  const currentUrl = window.location.href;
  const metaDescription = generateMetaDescription(article.content);
  const pageTitle = generatePageTitle(article.title, article.category);
  const keywords = generateKeywordsFromContent(article.title, article.content, article.category);
  const breadcrumbData = generateBreadcrumbData(window.location.pathname, article.title);
  
  // Create article object for SEO components (map to expected interface)
  const articleForSEO = {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    featuredImage: article.featured_image || '',
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    category: article.category,
    views: article.views,
    columnist: article.columnist_id ? {
      id: article.columnist_id,
      name: article.columnist_name || '',
      avatar: article.columnist_avatar || '',
      bio: article.columnist_bio || '',
      specialty: article.columnist_specialty || ''
    } : undefined
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageTitle}
        description={metaDescription}
        keywords={keywords}
        image={article.featured_image}
        url={currentUrl}
        type="article"
        author={article.columnist_name}
        publishedTime={article.created_at}
        modifiedTime={article.updated_at}
        section={article.category}
      />
      
      <ArticleStructuredData 
        article={articleForSEO} 
        url={currentUrl} 
      />
      
      <BreadcrumbStructuredData items={breadcrumbData} />
      
      <Navigation />
      
      {/* Breadcrumb e botão voltar */}
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às notícias
          </Link>
        </div>
      </div>

      {/* Conteúdo do artigo */}
      <main id="main-content" tabIndex={-1}>
        <article className="max-w-4xl mx-auto px-6 py-8" itemScope itemType="https://schema.org/NewsArticle">
        
        {/* Header do artigo */}
        <header className="mb-8">
          {/* Categoria e data */}
          <div className="flex items-center gap-4 mb-6">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {article.category}
            </Badge>
            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(article.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>

          {/* Título */}
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent leading-tight"
            itemProp="headline"
          >
            {article.title}
          </h1>

          {/* Subtítulo */}
          <p 
            className="text-xl text-muted-foreground mb-6 leading-relaxed"
            itemProp="description"
          >
            {article.excerpt}
          </p>

          {/* Stats do artigo */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-card rounded-lg border border-primary/20">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{new Date(article.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            
            {/* Botão de compartilhamento */}
            <div className="flex items-center">
              <ShareMenu
                title={article.title}
                excerpt={article.excerpt}
                url={window.location.href}
                image={article.featured_image}
                category={article.category}
                author={article.columnist_name}
                source={article.source_domain}
                sourceUrl={article.source_url}
                columnist={article.columnist_id ? {
                  name: columnistProfile?.name || article.columnist_name || '',
                  specialty: columnistProfile?.specialty || article.columnist_specialty || 'Colunista do Portal RRN',
                  bio: columnistProfile?.bio || article.columnist_bio || 'Colunista do Portal RRN',
                  avatar: (columnistProfile?.avatar || article.columnist_avatar)
                    ? `${(columnistProfile?.avatar || article.columnist_avatar)}${article._profile_updated_at ? `?v=${new Date(article._profile_updated_at).getTime()}` : ''}`
                    : undefined,
                } : undefined}
              />
            </div>
          </div>

          {/* Imagem principal */}
          <figure className="relative rounded-lg mb-8 bg-muted/20 overflow-hidden">
            <img
              src={article.featured_image}
              alt={optimizeImageAlt(article.title, "Imagem do artigo")}
              className="w-full max-h-96 object-contain rounded-lg"
              style={{ height: 'auto' }}
              itemProp="image"
              loading="eager"
              decoding="async"
            />
          </figure>

          {/* Info do autor */}
          {article.columnist_id ? (
            <Link to={`/colunista/${article.columnist_id}`}>
              <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                  {(columnistProfile?.avatar || article.columnist_avatar) && ((columnistProfile?.avatar || article.columnist_avatar).startsWith('http') || (columnistProfile?.avatar || article.columnist_avatar).startsWith('data:image/')) ? (
                    <img
                      src={columnistProfile?.avatar || article.columnist_avatar}
                      alt={columnistProfile?.name || article.columnist_name || 'Colunista'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading columnist avatar in ArticlePage:', (columnistProfile?.avatar || article.columnist_avatar)?.substring(0, 100));
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                            <span class="text-sm text-muted-foreground font-bold">${(columnistProfile?.name || article.columnist_name)?.[0]?.toUpperCase()}</span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground font-bold">
                        {(columnistProfile?.name || article.columnist_name)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{columnistProfile?.name || article.columnist_name}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Colunista</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{columnistProfile?.specialty || article.columnist_specialty}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-primary/20">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Portal News</span>
                </div>
                <p className="text-sm text-muted-foreground">Redação</p>
              </div>
            </div>
          )}
        </header>

        <Separator className="my-8" />

        {/* Conteúdo do artigo */}
        <div 
          className="rich-text-content max-w-none text-lg leading-relaxed"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content) }}
        />

        <Separator className="my-8" />

        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Categoria:</h3>
          <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/50 transition-colors">
            {article.category}
          </Badge>
        </div>

        {/* Artigos relacionados */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">
            {article.columnist_id ? `Outros artigos de ${article.columnist_name}` : 'Matérias Relacionadas'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(article.columnist_id 
              ? articles.filter(a => a.columnist_id === article.columnist_id && a.id !== article.id)
              : articles.filter(a => a.category === article.category && a.id !== article.id && a.status === 'published')
            )
              .slice(0, 4)
              .map((related) => (
                <Link key={related.id} to={getArticleLink(related)}>
                  <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="flex gap-4 p-4">
                        <div className="relative rounded-lg flex-shrink-0 bg-muted/20 overflow-hidden">
                          <img
                            src={related.featured_image}
                          alt={related.title}
                          className="w-24 h-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                          style={{ minHeight: '60px', maxHeight: '80px' }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                          {related.title}
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{new Date(related.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
          {article.columnist_id && (
            <div className="text-center mt-6">
              <Link to={`/colunista/${article.columnist_id}`}>
                <Button className="bg-gradient-hero hover:shadow-glow-primary">
                  Ver todos os artigos de {article.columnist_name}
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Hidden metadata for SEO */}
        <meta itemProp="datePublished" content={article.created_at} />
        <meta itemProp="dateModified" content={article.updated_at} />
        <meta itemProp="wordCount" content={article.content.replace(/<[^>]*>/g, '').split(' ').length.toString()} />
        <meta itemProp="author" content={article.columnist_name || "Redação Portal News"} />
        <meta itemProp="publisher" content="Portal News" />
      </article>

      {/* Seção de Comentários */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <CommentsSection articleId={article.id} articleTitle={article.title} />
      </div>
      </main>

      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default ArticlePage;