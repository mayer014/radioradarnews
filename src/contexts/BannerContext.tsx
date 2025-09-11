import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import bannerPrincipal from '@/assets/banner-principal.jpg';
import bannerPolitica from '@/assets/banner-politica.jpg';
import bannerPolicial from '@/assets/banner-policial.jpg';
import bannerEntretenimento from '@/assets/banner-entretenimento.jpg';
import bannerInternacional from '@/assets/banner-internacional.jpg';
import bannerEsportes from '@/assets/banner-esportes.jpg';
import bannerTecnologia from '@/assets/banner-tecnologia.jpg';
import bannerCienciaSaude from '@/assets/banner-ciencia-saude.jpg';

export interface Banner {
  id: string;
  name: string;
  gifUrl: string;
  position: 'hero' | 'category' | 'columnist';
  category?: string;
  columnistId?: string;
  isActive: boolean;
  isDefault?: boolean;
  clickUrl?: string;
  startDate?: string;
  endDate?: string;
  duration?: number; // duração em segundos para banners fixos
  sequence?: number; // ordem na sequência (0 = primeiro)
  createdAt: string;
  updatedAt: string;
}

interface BannerContextType {
  banners: Banner[];
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  toggleBannerStatus: (id: string) => void;
  getBannerByPosition: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner | undefined;
  getActiveBannersSequence: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner[];
  getDefaultBanner: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner | undefined;
  setAsDefault: (id: string) => void;
  syncColumnistBannersWithUsers: (users: any[]) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

// Banners fixos do sistema (um para cada categoria)
const initialBanners: Banner[] = [
  {
    id: 'hero-banner',
    name: 'Banner Principal',
    gifUrl: bannerPrincipal,
    position: 'hero',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'politica-banner',
    name: 'Banner Política',
    gifUrl: bannerPolitica,
    position: 'category',
    category: 'Política',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'policial-banner',
    name: 'Banner Policial',
    gifUrl: bannerPolicial,
    position: 'category',
    category: 'Policial',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'entretenimento-banner',
    name: 'Banner Entretenimento',
    gifUrl: bannerEntretenimento,
    position: 'category',
    category: 'Entretenimento',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'internacional-banner',
    name: 'Banner Internacional',
    gifUrl: bannerInternacional,
    position: 'category',
    category: 'Internacional',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'esportes-banner',
    name: 'Banner Esportes',
    gifUrl: bannerEsportes,
    position: 'category',
    category: 'Esportes',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tecnologia-banner',
    name: 'Banner Tecnologia',
    gifUrl: bannerTecnologia,
    position: 'category',
    category: 'Tecnologia',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ciencia-saude-banner',
    name: 'Banner Ciência / Saúde',
    gifUrl: bannerCienciaSaude,
    position: 'category',
    category: 'Ciência / Saúde',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ana-costa-banner',
    name: 'Banner Ana Costa',
    gifUrl: bannerPolitica,
    position: 'columnist',
    columnistId: 'ana-costa',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'joao-santos-banner',
    name: 'Banner João Santos',
    gifUrl: bannerPolicial,
    position: 'columnist',
    columnistId: 'joao-santos',
    isActive: true,
    clickUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const BANNERS_STORAGE_KEY = 'banners_store';

export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);

  // Inicializar banners após o componente montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBanners(parsed);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading banners from storage:', error);
    }
    // Initialize with default banners
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(initialBanners));
  }, []);

  // Persist banners to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
    } catch (error) {
      console.error('Error saving banners to storage:', error);
    }
  }, [banners]);

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    setBanners(prev => prev.map(banner => 
      banner.id === id 
        ? { ...banner, ...updates, updatedAt: new Date().toISOString() }
        : banner
    ));
  };

  const toggleBannerStatus = (id: string) => {
    setBanners(prev => prev.map(banner => 
      banner.id === id 
        ? { ...banner, isActive: !banner.isActive, updatedAt: new Date().toISOString() }
        : banner
    ));
  };

  const getBannerByPosition = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner | undefined => {
    const activeBanners = getActiveBannersSequence(position, category, columnistId);
    return activeBanners.length > 0 ? activeBanners[0] : getDefaultBanner(position, category, columnistId);
  };

  const getActiveBannersSequence = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner[] => {
    const now = new Date();
    
    let matchingBanners = banners.filter(banner => {
      // Verificar posição
      if (banner.position !== position) return false;
      
      // Verificar categoria ou colunista
      if (position === 'category' && banner.category !== category) return false;
      if (position === 'columnist' && banner.columnistId !== columnistId) return false;
      
      // Verificar se está ativo
      if (!banner.isActive) return false;
      
      // Verificar se não é banner padrão
      if (banner.isDefault) return false;
      
      // Verificar período de programação
      if (banner.startDate && new Date(banner.startDate) > now) return false;
      if (banner.endDate && new Date(banner.endDate) < now) return false;
      
      return true;
    });
    
    // Ordenar por sequência
    return matchingBanners.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  };

  const getDefaultBanner = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner | undefined => {
    return banners.find(banner => {
      if (banner.position !== position) return false;
      if (!banner.isActive || !banner.isDefault) return false;
      
      if (position === 'category' && banner.category !== category) return false;
      if (position === 'columnist' && banner.columnistId !== columnistId) return false;
      
      return true;
    });
  };

  const setAsDefault = (id: string) => {
    setBanners(prev => prev.map(banner => {
      if (banner.id === id) {
        // Encontrar outros banners padrão da mesma posição/categoria
        const currentBanner = banner;
        const otherDefaultBanners = prev.filter(b => 
          b.id !== id && 
          b.isDefault && 
          b.position === currentBanner.position &&
          b.category === currentBanner.category &&
          b.columnistId === currentBanner.columnistId
        );
        
        // Desmarcar outros banners padrão
        otherDefaultBanners.forEach(b => b.isDefault = false);
        
        return { 
          ...banner, 
          isDefault: true, 
          isActive: true,
          updatedAt: new Date().toISOString() 
        };
      }
      return banner;
    }));
  };

  const syncColumnistBannersWithUsers = (users: any[]) => {
    setBanners(prev => {
      const currentBanners = [...prev];
      
      // Encontrar colunistas que não têm banner ainda
      const columnists = users.filter(u => u.role === 'colunista');
      const existingColumnistBannerIds = currentBanners
        .filter(b => b.position === 'columnist')
        .map(b => b.columnistId);
      
      // Criar banners para novos colunistas
      const newBanners = columnists
        .filter(columnist => !existingColumnistBannerIds.includes(columnist.id))
        .map(columnist => ({
          id: `${columnist.id}-banner`,
          name: `Banner ${columnist.columnistProfile?.name || columnist.name}`,
          gifUrl: bannerPolitica, // Banner padrão para novos colunistas
          position: 'columnist' as const,
          columnistId: columnist.id,
          isActive: columnist.columnistProfile?.isActive ?? true,
          clickUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      
      // Atualizar banners existentes de colunistas
      const updatedBanners = currentBanners.map(banner => {
        if (banner.position === 'columnist' && banner.columnistId) {
          const user = columnists.find(u => u.id === banner.columnistId);
          const isColumnistActive = user?.columnistProfile?.isActive ?? false;
          
          if (banner.isActive !== isColumnistActive) {
            return { ...banner, isActive: isColumnistActive, updatedAt: new Date().toISOString() };
          }
        }
        return banner;
      });
      
      // Retornar todos os banners (existentes atualizados + novos)
      return [...updatedBanners, ...newBanners];
    });
  };

  return (
    <BannerContext.Provider value={{
      banners,
      updateBanner,
      toggleBannerStatus,
      getBannerByPosition,
      getActiveBannersSequence,
      getDefaultBanner,
      setAsDefault,
      syncColumnistBannersWithUsers,
    }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};