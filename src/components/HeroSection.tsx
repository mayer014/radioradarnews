import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import heroBackground from '@/assets/hero-background.jpg';
import BannerCarousel from '@/components/BannerCarousel';
import { useBanners } from '@/hooks/useBanners';

const HeroSection = () => {
  const { theme } = useTheme();
  const { getActiveBanners } = useBanners();
  const logoUrl = '/lovable-uploads/ef193e05-ec63-47a4-9731-ac6dd613febc.png';
  const [heroBanners, setHeroBanners] = useState<any[]>([]);

  useEffect(() => {
    const loadHeroBanners = async () => {
      const banners = await getActiveBanners('hero');
      setHeroBanners(banners);
    };
    
    loadHeroBanners();
  }, [getActiveBanners]);
  
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28">
      {/* Background com Parallax Animado - Apenas no tema escuro */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-parallax-zoom"
        style={theme === 'dark' ? { 
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: '120%',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background"></div>
      </div>

      {/* Elementos Flutuantes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-parallax-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/30 rounded-full blur-2xl animate-parallax-float"></div>
        <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-accent/25 rounded-full blur-3xl animate-parallax-float"></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="animate-bounce-in">
          <div className="inline-flex items-center space-x-2 bg-gradient-card backdrop-blur-sm border border-primary/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 animate-neon-pulse">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-accent">AO VIVO AGORA</span>
          </div>
          
          <div className="mb-6 animate-gradient-flow">
            <div className="inline-block bg-background/10 backdrop-blur-sm rounded-2xl p-2 sm:p-4 shadow-lg">
              <img 
                src={logoUrl} 
                alt="Radio Radar RRN News" 
                className="max-w-full h-auto mx-auto max-h-20 xs:max-h-24 sm:max-h-28 md:max-h-32 lg:max-h-40 drop-shadow-lg"
              />
            </div>
          </div>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 animate-slide-up delay-200 px-2">
            O futuro do jornalismo digital está aqui. Notícias, música e entretenimento em uma experiência única e imersiva.
          </p>

        </div>

        {/* Hero Banner Carousel */}
        {heroBanners.length > 0 && (
          <div className="mt-6 sm:mt-8 px-2 sm:px-0">
            <BannerCarousel 
              banners={heroBanners} 
              position="hero"
              className="animate-slide-up delay-300"
            />
          </div>
        )}

      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;