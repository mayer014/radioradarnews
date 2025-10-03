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

  return (
    <div className={`banner-display max-w-full ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-muted/20">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-auto object-cover"
          loading="lazy"
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
          onError={(e) => {
            console.error('Error loading banner image:', banner.image_url);
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
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default BannerDisplay;