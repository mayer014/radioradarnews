import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import SocialMediaButtons from '@/components/SocialMediaButtons';
import { useSupabaseContactInfo } from '@/contexts/SupabaseContactInfoContext';

interface SuccessPromoDialogProps {
  open: boolean;
  onClose: () => void;
}

const SuccessPromoDialog: React.FC<SuccessPromoDialogProps> = ({ open, onClose }) => {
  const { publicContactInfo } = useSupabaseContactInfo();

  const whatsappPhone = publicContactInfo?.phone1?.replace(/\D/g, '') || '';
  const fullPhone = whatsappPhone.startsWith('55') ? whatsappPhone : `55${whatsappPhone}`;
  const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(
    'Olá! Acabei de cadastrar meu anúncio no site e gostaria de solicitar minha arte de divulgação para as redes sociais. 😊'
  )}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Cadastro realizado com sucesso! 🎉</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Quer aumentar ainda mais a visibilidade do seu anúncio?
            Siga nossas páginas nas redes sociais e solicite sua <strong className="text-foreground">arte de divulgação gratuita</strong> para
            ser compartilhada em nossas redes!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Social follow */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              📲 Siga nossas redes sociais
            </p>
            <SocialMediaButtons
              facebookUrl={publicContactInfo?.facebook_url}
              instagramUrl={publicContactInfo?.instagram_url}
              twitterUrl={publicContactInfo?.twitter_url}
              youtubeUrl={publicContactInfo?.youtube_url}
              size="md"
              className="justify-center"
            />
          </div>

          {/* WhatsApp CTA */}
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              📢 Solicite sua arte de divulgação
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white w-full"
              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Pedir arte pelo WhatsApp
            </Button>
          </div>
        </div>

        <Button variant="ghost" onClick={onClose} className="mt-2 text-muted-foreground">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessPromoDialog;
