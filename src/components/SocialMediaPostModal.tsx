import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Facebook, Image, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateFeedImage, generateCaption } from '@/utils/shareHelpers';
import { supabase } from '@/integrations/supabase/client';
import { VPSImageService } from '@/services/VPSImageService';
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

  // URL de produção do site
  const PRODUCTION_URL = 'https://radioradar.news';

  const handleGenerateCaptionText = () => {
    if (!article) return;
    
    const isColumnist = !!article.columnist_id;
    const articleUrl = isColumnist 
      ? `${PRODUCTION_URL}/colunista/${article.columnist_id}/artigo/${article.id}`
      : `${PRODUCTION_URL}/artigo/${article.id}`;
    
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
          bio: article.columnist_bio || '',
          avatar: article.columnist_avatar || undefined
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
    if (!artImageUrl || !article) {
      console.error('Upload falhou: artImageUrl ou article não definidos');
      return null;
    }
    
    try {
      console.log('🔄 Iniciando upload da arte para redes sociais...');
      
      const fileName = `social-art-${article.id}-${Date.now()}.png`;
      
      // ESTRATÉGIA DEFINITIVA: Usar Edge Function como proxy (contorna CORS em produção)
      // A Edge Function tem a API key e faz o upload diretamente para o VPS
      console.log('🔄 Enviando via Edge Function proxy para VPS...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const proxyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://bwxbhircezyhwekdngdk.supabase.co'}/functions/v1/vps-image-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGJoaXJjZXp5aHdla2RuZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjU4NDAsImV4cCI6MjA3MzIwMTg0MH0.cRpeDixAWnMRaKsdiQJeJ4KPx7-PJAP6M5m7ljhzEls',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            action: 'upload',
            file_data: artImageUrl, // já é data URL (base64)
            file_name: fileName,
            mime_type: 'image/png',
            type: 'article'
          })
        }
      );
      
      if (proxyResponse.ok) {
        const proxyResult = await proxyResponse.json();
        if (proxyResult.success && proxyResult.url) {
          console.log('✅ Upload via Edge Function concluído:', proxyResult.url);
          return proxyResult.url;
        }
        console.warn('⚠️ Edge Function retornou mas sem URL:', proxyResult);
      } else {
        const errorText = await proxyResponse.text();
        console.warn('⚠️ Edge Function falhou:', proxyResponse.status, errorText);
      }
      
      // FALLBACK 1: Tentar upload direto ao VPS (funciona no Lovable, pode falhar em produção por CORS)
      console.log('🔄 Tentando upload direto ao VPS...');
      const response = await fetch(artImageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      
      const vpsResult = await VPSImageService.uploadImage(file, 'article', false);
      
      if (vpsResult.success && vpsResult.url) {
        console.log('✅ Upload direto VPS concluído:', vpsResult.url);
        return vpsResult.url;
      }
      
      console.warn('⚠️ VPS direto falhou:', vpsResult.error);
      
      // FALLBACK 2: Supabase Storage
      console.log('🔄 Tentando Supabase Storage...');
      const { data, error } = await supabase.storage
        .from('art-templates')
        .upload(`generated/${fileName}`, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('❌ Todos os métodos falharam');
        toast.error(`Upload falhou em todos os métodos. Por favor, tente novamente.`);
        return null;
      }

      console.log('✅ Upload Supabase concluído:', data);

      const { data: publicUrl } = supabase.storage
        .from('art-templates')
        .getPublicUrl(`generated/${fileName}`);
      
      console.log('🔗 URL pública Supabase:', publicUrl.publicUrl);
      return publicUrl.publicUrl;
    } catch (error) {
      console.error('❌ Erro crítico ao fazer upload:', error);
      toast.error(`Erro inesperado: ${(error as Error).message}`);
      return null;
    }
  };

  const postToFacebook = async () => {
    if (!article || !artImageUrl) {
      toast.error('Gere a arte antes de postar no Facebook');
      return;
    }
    
    setIsPostingFacebook(true);
    try {
      // Fazer upload da arte primeiro
      const imageUrl = await uploadArtToStorage();
      if (!imageUrl) {
        toast.error('Erro ao fazer upload da imagem');
        setIsPostingFacebook(false);
        return;
      }

      const isColumnist = !!article.columnist_id;
      const articleUrl = isColumnist 
        ? `${PRODUCTION_URL}/colunista/${article.columnist_id}/artigo/${article.id}`
        : `${PRODUCTION_URL}/artigo/${article.id}`;

      console.log('📤 Enviando para Edge Function social-media-post...');
      
      // Usar Edge Function para contornar CORS em produção
      const response = await supabase.functions.invoke('social-media-post', {
        body: {
          platform: 'facebook',
          article_id: article.id,
          image_url: imageUrl,
          caption: caption,
          article_url: articleUrl,
          is_columnist: isColumnist
        }
      });

      console.log('📥 Resposta da Edge Function:', response);

      if (response.error) {
        console.error('❌ Erro na Edge Function:', response.error);
        toast.error(`Erro ao postar no Facebook: ${response.error.message}`);
        return;
      }

      if (response.data?.success) {
        setFacebookSuccess(true);
        toast.success('Publicado no Facebook!');
      } else {
        const errorMsg = response.data?.error || 'Erro desconhecido';
        console.error('❌ Facebook error:', errorMsg);
        toast.error(`Erro no Facebook: ${errorMsg}`);
      }
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

      const isColumnist = !!article.columnist_id;
      const articleUrl = isColumnist 
        ? `${PRODUCTION_URL}/colunista/${article.columnist_id}/artigo/${article.id}`
        : `${PRODUCTION_URL}/artigo/${article.id}`;

      console.log('📤 Enviando para Edge Function social-media-post (Instagram)...');
      
      toast.info('Processando imagem no Instagram...');
      
      // Usar Edge Function para contornar CORS em produção
      const response = await supabase.functions.invoke('social-media-post', {
        body: {
          platform: 'instagram',
          article_id: article.id,
          image_url: imageUrl,
          caption: caption,
          article_url: articleUrl,
          is_columnist: isColumnist
        }
      });

      console.log('📥 Resposta da Edge Function (Instagram):', response);

      if (response.error) {
        console.error('❌ Erro na Edge Function:', response.error);
        toast.error(`Erro ao postar no Instagram: ${response.error.message}`);
        return;
      }

      if (response.data?.success) {
        setInstagramSuccess(true);
        toast.success('Publicado no Instagram!');
      } else {
        const errorMsg = response.data?.error || 'Erro desconhecido';
        console.error('❌ Instagram error:', errorMsg);
        toast.error(`Erro no Instagram: ${errorMsg}`);
      }
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
              disabled={isPostingFacebook || facebookSuccess || !artImageUrl}
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
