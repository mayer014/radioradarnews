import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Banner {
  id: string;
  name: string;
  gif_url: string;
  position: 'hero' | 'category' | 'columnist';
  category?: string;
  columnist_id?: string;
  is_active: boolean;
  is_default?: boolean;
  click_url?: string;
  start_date?: string;
  end_date?: string;
  duration?: number;
  sequence?: number;
  created_at: string;
  updated_at: string;
}

interface BannerContextType {
  banners: Banner[];
  loading: boolean;
  updateBanner: (id: string, updates: Partial<Banner>) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  getBannerByPosition: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner | undefined;
  getActiveBannersSequence: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner[];
  getDefaultBanner: (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string) => Banner | undefined;
  setAsDefault: (id: string) => Promise<void>;
  refreshBanners: () => Promise<void>;
  syncColumnistBannersWithUsers: (users: any[]) => Promise<void>;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const SupabaseBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBanners((data || []) as Banner[]);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar banners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    // Set up real-time subscription
    const channel = supabase
      .channel('banners-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'banners'
      }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Banner atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar banner",
        variant: "destructive",
      });
    }
  };

  const toggleBannerStatus = async (id: string) => {
    try {
      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Banner ${!banner.is_active ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do banner",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      // First, unset other defaults for the same position/category
      await supabase
        .from('banners')
        .update({ is_default: false })
        .eq('position', banner.position)
        .eq('category', banner.category || null);

      // Set this one as default
      const { error } = await supabase
        .from('banners')
        .update({ is_default: true, is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Banner definido como padrão",
      });
    } catch (error) {
      console.error('Error setting default banner:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir banner padrão",
        variant: "destructive",
      });
    }
  };

  const getBannerByPosition = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner | undefined => {
    const activeBanners = getActiveBannersSequence(position, category, columnistId);
    return activeBanners.length > 0 ? activeBanners[0] : getDefaultBanner(position, category, columnistId);
  };

  const getActiveBannersSequence = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner[] => {
    const now = new Date();
    
    let matchingBanners = banners.filter(banner => {
      if (banner.position !== position) return false;
      if (position === 'category' && banner.category !== category) return false;
      if (position === 'columnist' && banner.columnist_id !== columnistId) return false;
      if (!banner.is_active) return false;
      if (banner.is_default) return false;
      if (banner.start_date && new Date(banner.start_date) > now) return false;
      if (banner.end_date && new Date(banner.end_date) < now) return false;
      
      return true;
    });
    
    return matchingBanners.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  };

  const getDefaultBanner = (position: 'hero' | 'category' | 'columnist', category?: string, columnistId?: string): Banner | undefined => {
    return banners.find(banner => {
      if (banner.position !== position) return false;
      if (!banner.is_active || !banner.is_default) return false;
      if (position === 'category' && banner.category !== category) return false;
      if (position === 'columnist' && banner.columnist_id !== columnistId) return false;
      
      return true;
    });
  };

  const refreshBanners = async () => {
    await fetchBanners();
  };

  const syncColumnistBannersWithUsers = async (users: any[]) => {
    try {
      const columnists = (users || []).filter((u: any) => u.role === 'colunista');
      const existing = banners.filter(b => b.position === 'columnist');

      const missing = columnists
        .filter((c: any) => !existing.some(b => b.columnist_id === c.id))
        .map((c: any) => ({
          name: `Banner ${c.columnistProfile?.name || c.name}`,
          gif_url: '/src/assets/banner-politica.jpg',
          position: 'columnist' as const,
          columnist_id: c.id,
          is_active: c.columnistProfile?.isActive ?? true,
          click_url: ''
        }));

      if (missing.length > 0) {
        const { error } = await supabase.from('banners').insert(missing as any);
        if (error) throw error;
      }

      for (const b of existing) {
        const user = columnists.find((c: any) => c.id === b.columnist_id);
        const desired = user?.columnistProfile?.isActive ?? false;
        if (user && b.is_active !== desired) {
          const { error } = await supabase
            .from('banners')
            .update({ is_active: desired })
            .eq('id', b.id);
          if (error) throw error;
        }
      }

      await fetchBanners();
    } catch (error) {
      console.error('Error syncing columnist banners:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar banners de colunistas',
        variant: 'destructive',
      });
    }
  };

  return (
    <BannerContext.Provider value={{
      banners,
      loading,
      updateBanner,
      toggleBannerStatus,
      getBannerByPosition,
      getActiveBannersSequence,
      getDefaultBanner,
      setAsDefault,
      refreshBanners,
      syncColumnistBannersWithUsers,
    }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useSupabaseBanner = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useSupabaseBanner must be used within a SupabaseBannerProvider');
  }
  return context;
};