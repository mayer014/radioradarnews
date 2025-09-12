import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useSupabaseBanner } from '@/contexts/SupabaseBannerContext';
import { ExternalLink } from 'lucide-react';

interface BannerProps {
  position: 'hero' | 'category' | 'columnist';
  category?: string;
  columnistId?: string;
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ position, category, columnistId, className = '' }) => {
  const { banners } = useSupabaseBanner();

  const currentBanner = useMemo(() => {
    // Filter active banners
    const activeBanners = banners.filter(banner => banner.is_active);
    
    // For now, just return the first active banner
    // Later we can implement more sophisticated positioning logic
    return activeBanners.length > 0 ? activeBanners[0] : null;
  }, [banners]);

  if (!currentBanner) {
    return null;
  }

  const handleBannerClick = () => {
    if (currentBanner.click_url) {
      window.open(currentBanner.click_url, '_blank', 'noopener,noreferrer');
    }
  };

  // For now, just use the gif_url directly from the banner
  const getImageUrl = () => {
    return currentBanner.gif_url;
  };

  const imageUrl = getImageUrl();

  if (!imageUrl) {
    return null;
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 my-4 sm:my-8 ${className}`}>
      <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden group relative">
        <div 
          className={`relative ${currentBanner.click_url ? 'cursor-pointer' : ''}`}
          onClick={handleBannerClick}
        >
          <img
            src={imageUrl}
            alt={currentBanner.name}
            className="w-full h-auto object-contain sm:object-cover transition-transform duration-300 group-hover:scale-[1.02] max-h-[120px] sm:max-h-[180px] md:max-h-[200px]"
          />
          
          {/* Overlay sutil para melhor interação */}
          {currentBanner.click_url && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
          
          {/* Indicador de que é clicável */}
          {currentBanner.click_url && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-1">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Label discreto para identificação (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground text-center mt-2 opacity-50 flex items-center justify-center space-x-2">
          <span>Banner: {currentBanner.name}</span>
          <span>| Posição: {position} {category && `| Categoria: ${category}`} {columnistId && `| Colunista: ${columnistId}`}</span>
        </div>
      )}
    </div>
  );
};

export default Banner;