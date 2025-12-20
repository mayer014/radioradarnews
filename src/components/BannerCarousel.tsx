import React, { useState, useEffect, useCallback } from 'react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  banner_type: string;
  is_pilot: boolean;
  sort_order?: number;
}

interface BannerCarouselProps {
  banners: Banner[];
  position: 'hero' | 'category' | 'columnist';
  className?: string;
  rotationInterval?: number; // milliseconds
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ 
  banners, 
  position, 
  className = '',
  rotationInterval = 5000 // 5 seconds default
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sort banners by sort_order
  const sortedBanners = [...banners].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const goToNext = useCallback(() => {
    if (sortedBanners.length <= 1) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length);
      setIsTransitioning(false);
    }, 300);
  }, [sortedBanners.length]);

  // Auto-rotate banners
  useEffect(() => {
    if (sortedBanners.length <= 1) return;

    const interval = setInterval(goToNext, rotationInterval);
    return () => clearInterval(interval);
  }, [sortedBanners.length, rotationInterval, goToNext]);

  // Reset index when banners change
  useEffect(() => {
    setCurrentIndex(0);
  }, [banners]);

  if (!sortedBanners.length) {
    return null;
  }

  const currentBanner = sortedBanners[currentIndex];

  if (!currentBanner) {
    return null;
  }

  return (
    <div className={`banner-carousel max-w-full ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-muted/20">
        <div 
          className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="w-full h-auto object-cover"
            loading="lazy"
            style={{ 
              display: 'block',
              maxWidth: '100%',
              height: 'auto'
            }}
            onError={(e) => {
              console.error('Error loading banner image:', currentBanner.image_url);
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent && !parent.querySelector('.banner-fallback')) {
                parent.innerHTML += `
                  <div class="banner-fallback w-full h-32 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                    <div class="w-full h-full bg-muted/30 rounded"></div>
                  </div>
                `;
              }
            }}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        {/* Indicators */}
        {sortedBanners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
            {sortedBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;
