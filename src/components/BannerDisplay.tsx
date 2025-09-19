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
    // Usar as mesmas dimensões do hero para todos os banners
    return 'w-full h-24 xs:h-28 sm:h-32 md:h-40 lg:h-48 xl:h-56';
  };

  return (
    <div className={`banner-display max-w-full ${className}`}>
      <div className={`relative overflow-hidden rounded-lg bg-muted/20 ${getPositionClasses()}`}>
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-contain object-center"
          loading="lazy"
          style={{ 
            maxWidth: '100%', 
            objectFit: 'contain',
            objectPosition: 'center'
          }}
          onError={(e) => {
            console.error('Error loading banner image:', banner.image_url);
            // Hide the image on error and show a minimal fallback without text
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent && !parent.querySelector('.banner-fallback')) {
              parent.innerHTML += `
                <div class="banner-fallback absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div class="w-full h-full bg-muted/30 rounded"></div>
                </div>
              `;
            }
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default BannerDisplay;