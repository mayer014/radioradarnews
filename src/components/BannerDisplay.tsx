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
        return 'w-full h-32 sm:h-40 md:h-48 lg:h-56';
      case 'category':
        return 'w-full h-24 sm:h-28 md:h-32';
      case 'columnist':
        return 'w-full h-20 sm:h-24 md:h-28';
      default:
        return 'w-full h-32';
    }
  };

  return (
    <div className={`banner-display ${className}`}>
      <div className={`relative overflow-hidden rounded-lg bg-muted/20 ${getPositionClasses()}`}>
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          onError={(e) => {
            console.error('Error loading banner image:', banner.image_url);
            // Hide the image on error and show a fallback
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent && !parent.querySelector('.banner-fallback')) {
              parent.innerHTML += `
                <div class="banner-fallback absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                  <span class="text-muted-foreground text-sm font-medium">${banner.title}</span>
                </div>
              `;
            }
          }}
        />
        
        {banner.is_pilot && (
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
            Piloto
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default BannerDisplay;