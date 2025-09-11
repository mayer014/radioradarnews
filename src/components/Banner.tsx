import React from 'react';
import { Card } from '@/components/ui/card';
import { useBannerSequence } from '@/hooks/useBannerSequence';
import { ExternalLink, Play } from 'lucide-react';

interface BannerProps {
  position: 'hero' | 'category' | 'columnist';
  category?: string;
  columnistId?: string;
  className?: string;
}

const Banner: React.FC<BannerProps> = ({ position, category, columnistId, className = '' }) => {
  const { 
    currentBanner, 
    isTransitioning, 
    totalBanners, 
    currentIndex, 
    hasSequence,
    nextBanner 
  } = useBannerSequence({ position, category, columnistId });

  if (!currentBanner) {
    return null;
  }

  const handleBannerClick = () => {
    if (currentBanner.clickUrl) {
      window.open(currentBanner.clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getBannerTypeLabel = () => {
    if (currentBanner.isDefault) return 'PADRÃO';
    if (hasSequence) return `${currentIndex + 1}/${totalBanners}`;
    return 'ATIVO';
  };
  
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 my-4 sm:my-8 ${className} ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden group relative">
        <div 
          className={`relative ${currentBanner.clickUrl ? 'cursor-pointer' : ''}`}
          onClick={handleBannerClick}
        >
          <img
            src={currentBanner.gifUrl}
            alt={currentBanner.name}
            className="w-full h-auto object-contain sm:object-cover transition-transform duration-300 group-hover:scale-[1.02] max-h-[120px] sm:max-h-[180px] md:max-h-[200px]"
          />
          
          {/* Overlay sutil para melhor interação */}
          {currentBanner.clickUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
          
          {/* Indicador de que é clicável */}
          {currentBanner.clickUrl && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-1">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {/* Indicador de sequência */}
          {hasSequence && (
            <div className="absolute top-2 left-2 flex items-center space-x-1">
              <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 text-primary text-xs font-medium border border-primary/20">
                {currentIndex + 1}/{totalBanners}
              </div>
              {totalBanners > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextBanner();
                  }}
                  className="bg-background/90 backdrop-blur-sm rounded-full p-1 text-primary hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20"
                  title="Próximo banner"
                >
                  <Play className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Indicadores de progresso para sequência */}
          {hasSequence && totalBanners > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {Array.from({ length: totalBanners }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentIndex ? 'bg-primary' : 'bg-primary/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Label discreto para identificação (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground text-center mt-2 opacity-50 flex items-center justify-center space-x-2">
          <span>Banner: {currentBanner.name}</span>
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
            currentBanner.isDefault ? 'bg-blue-600' : hasSequence ? 'bg-green-600' : 'bg-purple-600'
          }`}>
            {getBannerTypeLabel()}
          </span>
          <span>| Posição: {position} {category && `| Categoria: ${category}`} {columnistId && `| Colunista: ${columnistId}`}</span>
        </div>
      )}
    </div>
  );
};

export default Banner;