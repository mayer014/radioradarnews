import { useState, useEffect, useCallback } from 'react';
import { useBanner } from '@/contexts/BannerContext';
import type { Banner } from '@/contexts/BannerContext';

interface UseBannerSequenceProps {
  position: 'hero' | 'category' | 'columnist';
  category?: string;
  columnistId?: string;
}

export const useBannerSequence = ({ position, category, columnistId }: UseBannerSequenceProps) => {
  const { getActiveBannersSequence, getDefaultBanner } = useBanner();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeBanners = getActiveBannersSequence(position, category, columnistId);
  const defaultBanner = getDefaultBanner(position, category, columnistId);

  // Função para detectar duração de GIF
  const detectGifDuration = useCallback(async (url: string): Promise<number> => {
    return new Promise((resolve) => {
      if (!url.toLowerCase().includes('.gif')) {
        resolve(10); // 10 segundos para imagens estáticas
        return;
      }

      // Para GIFs, tentamos detectar a duração real
      // Como é complexo detectar duração de GIF, usamos um fallback
      const img = new Image();
      img.onload = () => {
        // Heurística: GIFs pequenos (~5s), GIFs maiores (~10-15s)
        const estimatedDuration = img.width > 800 ? 15 : 8;
        resolve(estimatedDuration);
      };
      img.onerror = () => resolve(10);
      img.src = url;
    });
  }, []);

  // Função para avançar para o próximo banner
  const nextBanner = useCallback(async () => {
    if (activeBanners.length === 0) {
      setCurrentBanner(defaultBanner || null);
      setCurrentBannerIndex(0);
      return;
    }

    if (activeBanners.length === 1) {
      setCurrentBanner(activeBanners[0]);
      setCurrentBannerIndex(0);
      return;
    }

    setIsTransitioning(true);
    
    const nextIndex = (currentBannerIndex + 1) % activeBanners.length;
    const nextBannerToShow = activeBanners[nextIndex];
    
    // Se chegou ao final da sequência e não há banners ativos, volta ao padrão
    if (nextIndex === 0 && activeBanners.length > 1) {
      // Pequena pausa antes de voltar ao padrão ou reiniciar sequência
      setTimeout(() => {
        setCurrentBannerIndex(0);
        setCurrentBanner(activeBanners[0]);
        setIsTransitioning(false);
      }, 500);
    } else {
      setTimeout(() => {
        setCurrentBannerIndex(nextIndex);
        setCurrentBanner(nextBannerToShow);
        setIsTransitioning(false);
      }, 300);
    }
  }, [activeBanners, defaultBanner, currentBannerIndex]);

  // Efeito para configurar timer automático
  useEffect(() => {
    if (!currentBanner || activeBanners.length <= 1) return;

    const setupTimer = async () => {
      let duration: number;
      
      if (currentBanner.duration) {
        duration = currentBanner.duration;
      } else {
        duration = await detectGifDuration(currentBanner.gifUrl);
      }

      const timer = setTimeout(() => {
        nextBanner();
      }, duration * 1000);

      return () => clearTimeout(timer);
    };

    const cleanup = setupTimer();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [currentBanner, activeBanners.length, nextBanner, detectGifDuration]);

  // Efeito para inicializar banner
  useEffect(() => {
    if (activeBanners.length > 0) {
      setCurrentBanner(activeBanners[0]);
      setCurrentBannerIndex(0);
    } else {
      setCurrentBanner(defaultBanner || null);
      setCurrentBannerIndex(0);
    }
  }, [activeBanners, defaultBanner]);

  // Efeito para atualizar quando banners ativos mudam
  useEffect(() => {
    if (activeBanners.length === 0) {
      setCurrentBanner(defaultBanner || null);
      setCurrentBannerIndex(0);
    } else if (currentBannerIndex >= activeBanners.length) {
      setCurrentBannerIndex(0);
      setCurrentBanner(activeBanners[0]);
    }
  }, [activeBanners, defaultBanner, currentBannerIndex]);

  return {
    currentBanner,
    isTransitioning,
    totalBanners: activeBanners.length,
    currentIndex: currentBannerIndex,
    hasSequence: activeBanners.length > 1,
    nextBanner,
  };
};