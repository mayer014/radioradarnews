import React from 'react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  banner_type: 'pilot' | 'hero' | 'category' | 'columnist';
  is_pilot: boolean;
}

interface BannerDisplayProps {
  banner: Banner | null;
  position: 'hero' | 'category' | 'columnist';
  className?: string;
}

const BannerDisplay: React.FC<BannerDisplayProps> = ({ 
  banner, 
  position, 
  className = '' 
}) => {
  if (!banner) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'hero':
        return 'w-full h-24 xs:h-28 sm:h-32 md:h-40 lg:h-48 xl:h-56';
      case 'category':
        return 'w-full h-16 xs:h-20 sm:h-24 md:h-28 lg:h-32';
      case 'columnist':
        return 'w-full h-14 xs:h-16 sm:h-20 md:h-24 lg:h-28';
      default:
        return 'w-full h-24 xs:h-28 sm:h-32';
    }
  };

  return (
    <div className={`banner-display max-w-full ${className}`}>
      <div className={`relative overflow-hidden rounded-lg bg-muted/20 ${getPositionClasses()}`}>
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
          loading="lazy"
          style={{ maxWidth: '100%', height: 'auto' }}
          onError={(e) => {
            console.error('Error loading banner image:', banner.image_url);
            // Hide the image on error and show a fallback
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent && !parent.querySelector('.banner-fallback')) {
              parent.innerHTML += `
                <div class="banner-fallback absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                  <span class="text-muted-foreground text-xs sm:text-sm font-medium px-2 text-center">${banner.title}</span>
                </div>
              `;
            }
          }}
        />
        
        {banner.is_pilot && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-primary/90 text-primary-foreground text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-md font-medium backdrop-blur-sm">
            Piloto
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default BannerDisplay;