import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Facebook, Image, Loader2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateUtilityArt, generateUtilityCaption, UtilityArtData } from '@/utils/utilityArtGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useArtTemplates } from '@/contexts/ArtTemplateContext';
import { VPSImageService } from '@/services/VPSImageService';

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
  const [uploadedArtUrl, setUploadedArtUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && data) {
      handleGenerateArt();
      setCaption(generateUtilityCaption(data, PRODUCTION_URL));
    } else {
      setArtImageUrl(null);
      setUploadedArtUrl(null);
      setFacebookSuccess(false);
      setInstagramSuccess(false);
    }
  }, [open, data]);

  const handleGenerateArt = async () => {
    if (!data) return;
    setIsGeneratingArt(true);
    try {
      const logoUrl = templates.utility?.logo?.imageUrl || templates.regular?.logo?.imageUrl || '';
      const blob = await generateUtilityArt(data, logoUrl);
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

  const uploadArtToStorage = async (): Promise<string | null> => {
    if (!artImageUrl) return null;
    try {
      const fileName = 'social-art-utility-latest.png';
      const { data: { session } } = await supabase.auth.getSession();

      // Try edge function proxy first
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
            file_data: artImageUrl,
            file_name: fileName,
            mime_type: 'image/png',
            type: 'article'
          })
        }
      );

      if (proxyResponse.ok) {
        const result = await proxyResponse.json();
        if (result.success && result.url) return result.url;
      }

      // Fallback: VPS direct
      const response = await fetch(artImageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      const vpsResult = await VPSImageService.uploadImage(file, 'article', false);
      if (vpsResult.success && vpsResult.url) return vpsResult.url;

      // Fallback: Supabase Storage
      const { data: storageData, error } = await supabase.storage
        .from('art-templates')
        .upload(`generated/${fileName}`, blob, { contentType: 'image/png', upsert: true });
      if (error) { toast.error('Upload falhou'); return null; }
      const { data: publicUrl } = supabase.storage.from('art-templates').getPublicUrl(`generated/${fileName}`);
      return publicUrl.publicUrl;
    } catch (error) {
      toast.error(`Erro no upload: ${(error as Error).message}`);
      return null;
    }
  };

  const postToSocial = async (platform: 'facebook' | 'instagram') => {
    if (!data || !artImageUrl) return;
    const setPosting = platform === 'facebook' ? setIsPostingFacebook : setIsPostingInstagram;
    const setSuccess = platform === 'facebook' ? setFacebookSuccess : setInstagramSuccess;

    setPosting(true);
    try {
      const imageUrl = uploadedArtUrl || await uploadArtToStorage();
      if (!imageUrl) { toast.error('Erro ao fazer upload da imagem'); setPosting(false); return; }
      if (!uploadedArtUrl) setUploadedArtUrl(imageUrl);

      if (platform === 'instagram') toast.info('Processando imagem no Instagram...');

      const response = await supabase.functions.invoke('social-media-post', {
        body: {
          platform,
          article_id: null,
          image_url: imageUrl,
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
