import React from 'react';
import { Share2, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { generateFeedImage, generateCaption, downloadBlob } from '@/utils/shareHelpers';

interface ShareMenuProps {
  title: string;
  excerpt: string;
  url: string;
  image: string;
  category: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  columnist?: {
    name: string;
    specialty: string;
    bio: string;
    avatar?: string;
  };
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  title,
  excerpt,
  url,
  image,
  category,
  author,
  source,
  sourceUrl,
  columnist
}) => {
  const { toast } = useToast();

  const handleNativeShare = async () => {
    const shareData = {
      title,
      text: excerpt,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleCopyCaption = async () => {
    try {
      const caption = generateCaption({ title, url, category, author });
      await navigator.clipboard.writeText(caption);
      
      toast({
        title: "Legenda copiada!",
        description: "A legenda foi copiada para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar legenda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar a legenda.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async () => {
    try {
      const imageBlob = await generateFeedImage({ 
        title, 
        image, 
        category, 
        columnist,
        summary: excerpt,
        source,
        sourceUrl
      });
      const fileName = `portal-news-${title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}.jpg`;
      downloadBlob(fileName, imageBlob);
      
      toast({
        title: "Imagem baixada!",
        description: "A imagem para Feed foi salva em seus downloads.",
      });
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="hover:bg-primary/10 hover:border-primary/50"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 z-50 bg-popover border-border shadow-lg">
        <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadImage} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Baixar imagem para Feed
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopyCaption} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copiar legenda
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copiar link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};