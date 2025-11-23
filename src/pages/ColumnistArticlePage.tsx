import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, User, Calendar, BookOpen, ArrowRight } from 'lucide-react';
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
import { getProductionUrl } from '@/utils/shareHelpers';

import { sanitizeHtml } from '@/utils/contentSanitizer';

// Função para formatar e sanitizar o conteúdo do artigo
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
  
  // SECURITY: Sanitize HTML to prevent XSS attacks
  return sanitizeHtml(formattedContent);
};

const ColumnistArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getArticleById, incrementViews, getArticlesByColumnist } = useSupabaseNews();
  const [columnistProfile, setColumnistProfile] = React.useState<any>(null);
  
  // Params: { id }
  
  const article = id ? getArticleById(id) : null;
  // Article found
  
  const relatedArticles = article?.columnist_id ? getArticlesByColumnist(article.columnist_id).filter(a => a.id !== article.id) : [];
  
  // Load columnist profile from Supabase to get updated data
  React.useEffect(() => {
    const loadColumnistProfile = async () => {
      if (article?.columnist_id) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
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

    loadColumnistProfile();
  }, [article?.columnist_id]);
  
  // Incrementar visualizações quando o artigo for encontrado
  React.useEffect(() => {
    if (article) {
      // Incrementing views for article
      incrementViews(article.id);
    }
  }, [article, incrementViews]);

  // Scroll para o topo quando mudar de artigo
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!article || !article.columnist_id) {
    // Article not found or not a columnist article
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-4">
              O artigo que você está procurando não existe ou não é um artigo de colunista.
            </p>
            <div className="space-x-4">
              <Link to="/">
                <Button className="bg-gradient-hero hover:shadow-glow-primary">
                  Voltar ao início
                </Button>
              </Link>
              <Link to="/noticias">
                <Button variant="outline">
                  Ver todas as notícias
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
        <RadioPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Breadcrumb e botão voltar */}
      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/colunista/${article.columnist_id}`} className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos artigos de {article.columnist_name}
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Início
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo do artigo */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent leading-tight">
            {article.title}
          </h1>

          {/* Subtítulo */}
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Info do colunista */}
          <div className="flex items-center justify-between mb-6 p-6 bg-gradient-card rounded-lg border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                {article.columnist_avatar && (article.columnist_avatar.startsWith('http') || article.columnist_avatar.startsWith('data:image/')) ? (
                  <img
                    src={article.columnist_avatar}
                    alt={article.columnist_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading columnist avatar in ColumnistArticlePage:', article.columnist_avatar?.substring(0, 100));
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="w-full h-full bg-muted/50 flex items-center justify-center">
                          <span class="text-lg text-muted-foreground font-bold">${article.columnist_name?.[0]?.toUpperCase()}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                    <span className="text-lg text-muted-foreground font-bold">
                      {article.columnist_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{article.columnist_name}</span>
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-primary font-medium">{article.columnist_specialty}</p>
                <p className="text-xs text-muted-foreground mt-1">{article.columnist_bio}</p>
              </div>
            </div>
          </div>

          {/* Stats do artigo */}
          <div className="flex items-center text-sm text-muted-foreground mb-6">
            <Clock className="w-4 h-4 mr-2" />
            <span>{new Date(article.created_at).toLocaleString('pt-BR')}</span>
          </div>

          {/* Botões de ação - Ver perfil e Compartilhar */}
          <div className="flex items-center gap-3 mb-6">
            <Link to={`/colunista/${article.columnist_id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-primary/10 hover:border-primary/50"
              >
                <User className="w-4 h-4 mr-2" />
                Ver perfil
              </Button>
            </Link>
            <ShareMenu
              title={article.title}
              excerpt={article.excerpt}
              url={getProductionUrl()}
              image={article.featured_image}
              category={article.category}
              author={article.columnist_name}
              columnist={article.columnist_name ? {
                name: columnistProfile?.name || article.columnist_name,
                specialty: columnistProfile?.specialty || article.columnist_specialty || 'Colunista do Portal RRN',
                bio: columnistProfile?.bio || article.columnist_bio || 'Colunista especializado em conteúdo informativo.',
                avatar: (columnistProfile?.avatar || article.columnist_avatar)
                  ? `${(columnistProfile?.avatar || article.columnist_avatar)}${article._profile_updated_at ? `?v=${new Date(article._profile_updated_at).getTime()}` : ''}`
                  : undefined,
              } : undefined}
            />
          </div>

          {/* Imagem principal */}
          <div className="relative rounded-lg mb-8 bg-muted/20">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-96 object-contain rounded-lg"
            />
          </div>
        </header>

        <Separator className="my-8" />

        {/* Conteúdo do artigo */}
        <div 
          className="rich-text-content max-w-none text-lg leading-relaxed"
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

        {/* Artigos relacionados do mesmo colunista */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-primary" />
              Mais artigos de {article.columnist_name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.slice(0, 4).map((related) => (
                <Link key={related.id} to={getArticleLink(related)}>
                  <Card className="group bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <div className="relative rounded-lg flex-shrink-0 bg-muted/20">
                        <img
                          src={related.featured_image}
                          alt={related.title}
                          className="w-24 h-24 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
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
            
            {/* Link para ver todos os artigos do colunista */}
            <div className="text-center mt-6">
              <Link to={`/colunista/${article.columnist_id}`}>
                <Button className="bg-gradient-hero hover:shadow-glow-primary">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver todos os artigos de {article.columnist_name}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </article>

      {/* Seção de Comentários */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <CommentsSection articleId={article.id} articleTitle={article.title} />
      </div>

      <Footer />
      <RadioPlayer />
    </div>
  );
};

export default ColumnistArticlePage;