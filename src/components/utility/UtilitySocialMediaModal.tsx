import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Facebook, Image, Loader2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateUtilityArt, generateUtilityCaption, UtilityArtData } from '@/utils/utilityArtGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useArtTemplates } from '@/contexts/ArtTemplateContext';


interface UtilitySocialMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: UtilityArtData | null;
}

const PRODUCTION_URL = 'https://radioradar.news';

export function UtilitySocialMediaModal({ open, onOpenChange, data }: UtilitySocialMediaModalProps) {
  const { templates } = useArtTemplates();
  const [artImageUrl, setArtImageUrl] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [caption, setCaption] = useState('');
  const [isPostingFacebook, setIsPostingFacebook] = useState(false);
  const [isPostingInstagram, setIsPostingInstagram] = useState(false);
  const [facebookSuccess, setFacebookSuccess] = useState(false);
  const [instagramSuccess, setInstagramSuccess] = useState(false);
  

  useEffect(() => {
    if (open && data) {
      handleGenerateArt();
      setCaption(generateUtilityCaption(data, PRODUCTION_URL));
    } else {
      setArtImageUrl(null);
      
      setFacebookSuccess(false);
      setInstagramSuccess(false);
    }
  }, [open, data]);

  const handleGenerateArt = async () => {
    if (!data) return;
    setIsGeneratingArt(true);
    try {
      const utilTemplate = templates.utility || undefined;
      const blob = await generateUtilityArt(data, utilTemplate);
      const reader = new FileReader();
      reader.onloadend = () => setArtImageUrl(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Erro ao gerar arte:', error);
      toast.error('Erro ao gerar arte');
    } finally {
      setIsGeneratingArt(false);
    }
  };

  // Upload is now handled server-side in the edge function
  // We just pass the base64 image data directly

  const postToSocial = async (platform: 'facebook' | 'instagram') => {
    if (!data || !artImageUrl) return;
    const setPosting = platform === 'facebook' ? setIsPostingFacebook : setIsPostingInstagram;
    const setSuccess = platform === 'facebook' ? setFacebookSuccess : setInstagramSuccess;

    setPosting(true);
    try {
      if (platform === 'instagram') toast.info('Processando imagem no Instagram...');

      const response = await supabase.functions.invoke('social-media-post', {
        body: {
          platform,
          article_id: null,
          image_data: artImageUrl,
          caption,
          article_url: `${PRODUCTION_URL}/${data.type === 'service_provider' ? 'prestadores' : 'vagas'}`,
          is_columnist: false
        }
      });

      const result = response.data;
      if (result?.success) {
        setSuccess(true);
        toast.success(`Publicado no ${platform === 'facebook' ? 'Facebook' : 'Instagram'}!`);
      } else {
        toast.error(`Erro: ${result?.error || response.error?.message || 'Desconhecido'}`);
      }
    } catch (error) {
      toast.error(`Erro ao postar no ${platform}`);
    } finally {
      setPosting(false);
    }
  };

  if (!data) return null;

  const displayTitle = data.type === 'service_provider'
    ? data.name || 'Prestador'
    : data.title || 'Vaga';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Publicar nas Redes Sociais
          </DialogTitle>
          <DialogDescription>{displayTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Art preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Arte para Feed</label>
              <Button variant="outline" size="sm" onClick={handleGenerateArt} disabled={isGeneratingArt}>
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
                <img src={artImageUrl} alt="Arte para redes sociais" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Nenhuma arte gerada</span>
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Legenda</label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} className="resize-none" />
          </div>

          {/* Post buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={facebookSuccess ? 'default' : 'outline'}
              onClick={() => postToSocial('facebook')}
              disabled={isPostingFacebook || facebookSuccess || !artImageUrl}
              className="w-full"
            >
              {isPostingFacebook ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                facebookSuccess ? <Check className="h-4 w-4 mr-2 text-primary" /> :
                  <Facebook className="h-4 w-4 mr-2 text-primary" />}
              {facebookSuccess ? 'Publicado!' : 'Postar no Facebook'}
            </Button>
            <Button
              variant={instagramSuccess ? 'default' : 'outline'}
              onClick={() => postToSocial('instagram')}
              disabled={isPostingInstagram || instagramSuccess || !artImageUrl}
              className="w-full"
            >
              {isPostingInstagram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                instagramSuccess ? <Check className="h-4 w-4 mr-2 text-primary" /> :
                  <Instagram className="h-4 w-4 mr-2 text-primary" />}
              {instagramSuccess ? 'Publicado!' : 'Postar no Instagram'}
            </Button>
          </div>

          {(facebookSuccess || instagramSuccess) && (
            <p className="text-sm text-primary text-center">✅ Postagem(ns) realizada(s) com sucesso!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
