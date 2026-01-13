import React from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

interface SocialMediaButtonsProps {
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SocialMediaButtons: React.FC<SocialMediaButtonsProps> = ({
  facebookUrl,
  instagramUrl,
  twitterUrl,
  youtubeUrl,
  size = 'md',
  className = ''
}) => {
  const iconSize = size === 'sm' ? 16 : 20;
  const buttonClasses = size === 'sm' 
    ? 'p-1.5 rounded-full transition-all duration-300 hover:scale-110' 
    : 'p-2 rounded-full transition-all duration-300 hover:scale-110';

  const hasSocialLinks = facebookUrl || instagramUrl || twitterUrl || youtubeUrl;

  if (!hasSocialLinks) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:shadow-lg hover:shadow-pink-500/30`}
          aria-label="Instagram"
        >
          <Instagram size={iconSize} />
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} bg-[#1877F2] text-white hover:shadow-lg hover:shadow-blue-500/30`}
          aria-label="Facebook"
        >
          <Facebook size={iconSize} />
        </a>
      )}
      {twitterUrl && (
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} bg-foreground/10 text-foreground hover:bg-foreground/20`}
          aria-label="Twitter/X"
        >
          <Twitter size={iconSize} />
        </a>
      )}
      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} bg-[#FF0000] text-white hover:shadow-lg hover:shadow-red-500/30`}
          aria-label="YouTube"
        >
          <Youtube size={iconSize} />
        </a>
      )}
    </div>
  );
};

export default SocialMediaButtons;
