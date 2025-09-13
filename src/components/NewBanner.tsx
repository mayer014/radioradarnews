import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useNewBanner } from '@/contexts/NewBannerContext';
import { ExternalLink } from 'lucide-react';

interface NewBannerProps {
  slotKey: string;
  className?: string;
}

const NewBanner: React.FC<NewBannerProps> = ({ slotKey, className = '' }) => {
  const { getCurrentBanner } = useNewBanner();
  const [currentBanner, setCurrentBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBanner = async () => {
      try {
        setLoading(true);
        setError(null);
        const banner = await getCurrentBanner(slotKey);
        
        if (isMounted) {
          setCurrentBanner(banner);
        }
      } catch (error: any) {
        console.error(`[NewBanner] Erro ao carregar banner para ${slotKey}:`, error);
        if (isMounted) {
          setError(error.message || 'Erro ao carregar banner');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBanner();

    // Atualizar banner a cada 30 segundos para verificar mudanças na fila
    const interval = setInterval(() => {
      if (isMounted) {
        fetchBanner();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [slotKey, getCurrentBanner]);

  // Se está carregando, mostra loading discreto
  if (loading) {
    return (
      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 my-4 sm:my-8 ${className}`}>
        <div className="animate-pulse bg-muted/50 rounded-lg h-32 w-full">
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            Carregando banner...
          </div>
        </div>
      </div>
    );
  }

  // Se deu erro ou não tem banner, não renderiza nada
  if (error || !currentBanner) {
    return null;
  }

  const handleBannerClick = () => {
    if (currentBanner.click_url) {
      window.open(currentBanner.click_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Extrair URL da imagem do payload
  let imageUrl = currentBanner.payload_jsonb?.image_url || currentBanner.payload_jsonb?.gif_url;
  
  // Converter URLs de /src/assets/ para URLs publicamente acessíveis
  if (imageUrl && imageUrl.startsWith('/src/assets/')) {
    imageUrl = imageUrl.replace('/src/assets/', '/');
  }
  
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
            alt={currentBanner.payload_jsonb?.alt_text || currentBanner.name}
            className="w-full h-auto object-contain sm:object-cover transition-transform duration-300 group-hover:scale-[1.02] max-h-[120px] sm:max-h-[180px] md:max-h-[200px]"
            loading="lazy"
            onError={(e) => {
              console.error(`[NewBanner] Erro ao carregar imagem do banner ${slotKey}:`, imageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
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

          {/* Indicador de banner piloto (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && currentBanner.is_pilot && (
            <div className="absolute top-2 left-2">
              <div className="bg-yellow-500/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-bold text-black">
                PILOTO
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Label discreto para identificação (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground text-center mt-2 opacity-50 flex items-center justify-center space-x-2">
          <span>Banner: {currentBanner.name}</span>
          <span>| Slot: {slotKey}</span>
          {currentBanner.is_pilot && <span>| PILOTO</span>}
          {currentBanner.queue_priority !== undefined && <span>| Prioridade: {currentBanner.queue_priority}</span>}
          {currentBanner.queue_ends_at && <span>| Expira: {new Date(currentBanner.queue_ends_at).toLocaleString('pt-BR')}</span>}
        </div>
      )}
    </div>
  );
};

export default NewBanner;