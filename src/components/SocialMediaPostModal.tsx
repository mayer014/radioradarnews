import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Facebook, Image, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateFeedImage, generateCaption } from '@/utils/shareHelpers';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  featured_image?: string | null;
  columnist_id?: string | null;
  columnist_name?: string | null;
  columnist_specialty?: string | null;
  columnist_bio?: string | null;
  columnist_avatar?: string | null;
}

interface SocialMediaPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Article | null;
}

export function SocialMediaPostModal({ open, onOpenChange, article }: SocialMediaPostModalProps) {
  const [artImageUrl, setArtImageUrl] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [caption, setCaption] = useState('');
  const [isPostingFacebook, setIsPostingFacebook] = useState(false);
  const [isPostingInstagram, setIsPostingInstagram] = useState(false);
  const [facebookSuccess, setFacebookSuccess] = useState(false);
  const [instagramSuccess, setInstagramSuccess] = useState(false);

  // Gerar arte quando o modal abre
  useEffect(() => {
    if (open && article) {
      handleGenerateArt();
      handleGenerateCaptionText();
    } else {
      // Reset state when modal closes
      setArtImageUrl(null);
      setFacebookSuccess(false);
      setInstagramSuccess(false);
    }
  }, [open, article]);

  const handleGenerateCaptionText = () => {
    if (!article) return;
    
    const isColumnist = !!article.columnist_id;
    const articleUrl = isColumnist 
      ? `${window.location.origin}/colunista/${article.columnist_id}/artigo/${article.id}`
      : `${window.location.origin}/artigo/${article.id}`;
    
    const captionText = generateCaption({
      title: article.title,
      category: article.category,
      url: articleUrl,
      author: isColumnist ? article.columnist_name || undefined : undefined
    });
    
    setCaption(captionText);
  };

  const handleGenerateArt = async () => {
    if (!article) return;
    
    setIsGeneratingArt(true);
    try {
      const isColumnist = !!article.columnist_id;
      
      const columnist = isColumnist ? {
        id: article.columnist_id!,
        name: article.columnist_name || 'Colunista',
        specialty: article.columnist_specialty || '',
        bio: article.columnist_bio || '',
        avatar: article.columnist_avatar || undefined
      } : undefined;

      const blob = await generateFeedImage({
        title: article.title,
        image: article.featured_image || '',
        category: article.category,
        summary: article.excerpt,
        columnist: isColumnist ? {
          name: article.columnist_name || 'Colunista',
          specialty: article.columnist_specialty || '',
          bio: article.columnist_bio || ''
        } : undefined
      });

      if (blob) {
        // Converter blob para data URL para preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setArtImageUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        toast.error('Erro ao gerar arte');
      }
    } catch (error) {
      console.error('Erro ao gerar arte:', error);
      toast.error('Erro ao gerar arte');
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const uploadArtToStorage = async (): Promise<string | null> => {
    if (!artImageUrl || !article) return null;
    
    try {
      // Converter data URL para blob
      const response = await fetch(artImageUrl);
      const blob = await response.blob();
      
      // Upload para Supabase Storage
      const fileName = `social-art-${article.id}-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('art-templates')
        .upload(`generated/${fileName}`, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Erro no upload:', error);
        return null;
      }

      // Retornar URL pública
      const { data: publicUrl } = supabase.storage
        .from('art-templates')
        .getPublicUrl(`generated/${fileName}`);
      
      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }
  };

  const postToFacebook = async () => {
    if (!article) return;
    
    setIsPostingFacebook(true);
    try {
      // Buscar configuração do Facebook
      const { data: configs } = await supabase
        .from('social_media_config')
        .select('*')
        .eq('platform', 'facebook')
        .eq('is_active', true)
        .maybeSingle();

      if (!configs) {
        toast.error('Facebook não configurado. Configure na aba Redes Sociais.');
        return;
      }

      const isColumnist = !!article.columnist_id;
      const articleUrl = isColumnist 
        ? `${window.location.origin}/colunista/${article.columnist_id}/artigo/${article.id}`
        : `${window.location.origin}/artigo/${article.id}`;

      // Postar usando endpoint /feed com link
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${configs.page_id}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: caption,
            link: articleUrl,
            access_token: configs.access_token
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Facebook error:', result);
        toast.error(`Erro no Facebook: ${result.error?.message || 'Erro desconhecido'}`);
        
        // Registrar falha
        await supabase.from('social_media_posts').insert({
          article_id: article.id,
          platform: 'facebook',
          caption: caption,
          status: 'failed',
          error_message: result.error?.message,
          is_columnist_article: isColumnist
        });
        return;
      }

      // Registrar sucesso
      await supabase.from('social_media_posts').insert({
        article_id: article.id,
        platform: 'facebook',
        post_id: result.id || result.post_id,
        caption: caption,
        status: 'published',
        is_columnist_article: isColumnist
      });

      setFacebookSuccess(true);
      toast.success('Publicado no Facebook!');
    } catch (error) {
      console.error('Erro ao postar no Facebook:', error);
      toast.error('Erro ao postar no Facebook');
    } finally {
      setIsPostingFacebook(false);
    }
  };

  const postToInstagram = async () => {
    if (!article || !artImageUrl) return;
    
    setIsPostingInstagram(true);
    try {
      // Fazer upload da arte primeiro
      const imageUrl = await uploadArtToStorage();
      if (!imageUrl) {
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Buscar configuração do Instagram
      const { data: configs } = await supabase
        .from('social_media_config')
        .select('*')
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .maybeSingle();

      if (!configs || !configs.instagram_user_id) {
        toast.error('Instagram não configurado. Configure na aba Redes Sociais.');
        return;
      }

      const isColumnist = !!article.columnist_id;

      // Etapa 1: Criar container de mídia
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${configs.instagram_user_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: configs.access_token
          })
        }
      );

      const containerResult = await containerResponse.json();

      if (!containerResponse.ok) {
        console.error('Instagram container error:', containerResult);
        toast.error(`Erro no Instagram: ${containerResult.error?.message || 'Erro ao criar mídia'}`);
        
        await supabase.from('social_media_posts').insert({
          article_id: article.id,
          platform: 'instagram',
          image_url: imageUrl,
          caption: caption,
          status: 'failed',
          error_message: containerResult.error?.message,
          is_columnist_article: isColumnist
        });
        return;
      }

      toast.info('Processando imagem no Instagram...');
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Etapa 2: Publicar container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${configs.instagram_user_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerResult.id,
            access_token: configs.access_token
          })
        }
      );

      const publishResult = await publishResponse.json();

      if (!publishResponse.ok) {
        console.error('Instagram publish error:', publishResult);
        toast.error(`Erro ao publicar no Instagram: ${publishResult.error?.message || 'Erro ao publicar'}`);
        
        await supabase.from('social_media_posts').insert({
          article_id: article.id,
          platform: 'instagram',
          image_url: imageUrl,
          caption: caption,
          status: 'failed',
          error_message: publishResult.error?.message,
          is_columnist_article: isColumnist
        });
        return;
      }

      // Registrar sucesso
      await supabase.from('social_media_posts').insert({
        article_id: article.id,
        platform: 'instagram',
        post_id: publishResult.id,
        image_url: imageUrl,
        caption: caption,
        status: 'published',
        is_columnist_article: isColumnist
      });

      setInstagramSuccess(true);
      toast.success('Publicado no Instagram!');
    } catch (error) {
      console.error('Erro ao postar no Instagram:', error);
      toast.error('Erro ao postar no Instagram');
    } finally {
      setIsPostingInstagram(false);
    }
  };

  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Publicar nas Redes Sociais
          </DialogTitle>
          <DialogDescription>
            {article.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da Arte */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Arte para Feed</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateArt}
                disabled={isGeneratingArt}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isGeneratingArt ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
            </div>
            
            <div className="relative aspect-square w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
              {isGeneratingArt ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Gerando arte...</span>
                </div>
              ) : artImageUrl ? (
                <img
                  src={artImageUrl}
                  alt="Arte para redes sociais"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Nenhuma arte gerada</span>
                </div>
              )}
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Legenda</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Botões de Postagem */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={facebookSuccess ? "default" : "outline"}
              onClick={postToFacebook}
              disabled={isPostingFacebook || facebookSuccess}
              className="w-full"
            >
              {isPostingFacebook ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : facebookSuccess ? (
                <Check className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Facebook className="h-4 w-4 mr-2 text-primary" />
              )}
              {facebookSuccess ? 'Publicado!' : 'Postar no Facebook'}
            </Button>

            <Button
              variant={instagramSuccess ? "default" : "outline"}
              onClick={postToInstagram}
              disabled={isPostingInstagram || instagramSuccess || !artImageUrl}
              className="w-full"
            >
              {isPostingInstagram ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : instagramSuccess ? (
                <Check className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Instagram className="h-4 w-4 mr-2 text-primary" />
              )}
              {instagramSuccess ? 'Publicado!' : 'Postar no Instagram'}
            </Button>
          </div>

          {/* Avisos */}
          {!artImageUrl && !isGeneratingArt && (
            <p className="text-sm text-muted-foreground text-center">
              ⚠️ Gere a arte antes de postar no Instagram
            </p>
          )}

          {(facebookSuccess || instagramSuccess) && (
            <p className="text-sm text-primary text-center">
              ✅ Postagem(ns) realizada(s) com sucesso!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
