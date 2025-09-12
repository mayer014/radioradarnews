import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Banner {
  id: string;
  name: string;
  payload_jsonb: any;
  click_url?: string;
  active: boolean;
  is_pilot: boolean;
  created_at: string;
  updated_at: string;
}

interface QueueEntry {
  id: string;
  slot_key: string;
  banner_id: string;
  priority: number;
  starts_at?: string;
  ends_at?: string;
  is_active: boolean;
  banner?: Banner;
}

interface CurrentBanner extends Banner {
  queue_priority?: number;
  queue_ends_at?: string;
}

interface NewBannerContextType {
  banners: Banner[];
  loading: boolean;
  getCurrentBanner: (slotKey: string) => Promise<CurrentBanner | null>;
  addToQueue: (slotKey: string, bannerId: string, priority?: number, startsAt?: string, endsAt?: string) => Promise<void>;
  updateQueue: (queueId: string, updates: Partial<QueueEntry>) => Promise<void>;
  removeFromQueue: (queueId: string) => Promise<void>;
  getQueue: (slotKey?: string) => Promise<QueueEntry[]>;
  setPilot: (bannerId: string, isPilot: boolean) => Promise<void>;
  cleanupExpired: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  createBanner: (bannerData: Partial<Banner>) => Promise<Banner>;
  updateBanner: (bannerId: string, updates: Partial<Banner>) => Promise<void>;
}

const NewBannerContext = createContext<NewBannerContextType | undefined>(undefined);

export const NewBannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const callBannerService = useCallback(async (action: string, data: any = {}) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('banner-service', {
        body: { action, ...data }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);

      return result.data;
    } catch (error: any) {
      console.error(`Banner service error (${action}):`, error);
      throw new Error(error.message || `Erro na operação: ${action}`);
    }
  }, []);

  const refreshBanners = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners_normalized')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar banners:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar banners. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCurrentBanner = useCallback(async (slotKey: string): Promise<CurrentBanner | null> => {
    try {
      const result = await callBannerService('get_current_banner', { slot_key: slotKey });
      return result;
    } catch (error: any) {
      console.error('Erro ao obter banner atual:', error);
      return null;
    }
  }, [callBannerService]);

  const addToQueue = useCallback(async (
    slotKey: string, 
    bannerId: string, 
    priority: number = 0, 
    startsAt?: string, 
    endsAt?: string
  ) => {
    try {
      await callBannerService('add_to_queue', {
        slot_key: slotKey,
        banner_id: bannerId,
        priority,
        starts_at: startsAt,
        ends_at: endsAt
      });

      toast({
        title: "Sucesso",
        description: "Banner adicionado à fila com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [callBannerService, toast]);

  const updateQueue = useCallback(async (queueId: string, updates: Partial<QueueEntry>) => {
    try {
      await callBannerService('update_queue', {
        queue_id: queueId,
        ...updates
      });

      toast({
        title: "Sucesso",
        description: "Fila atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [callBannerService, toast]);

  const removeFromQueue = useCallback(async (queueId: string) => {
    try {
      await callBannerService('remove_from_queue', { queue_id: queueId });

      toast({
        title: "Sucesso",
        description: "Banner removido da fila com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [callBannerService, toast]);

  const getQueue = useCallback(async (slotKey?: string): Promise<QueueEntry[]> => {
    try {
      const result = await callBannerService('get_queue', { slot_key: slotKey });
      return result || [];
    } catch (error: any) {
      console.error('Erro ao obter fila:', error);
      return [];
    }
  }, [callBannerService]);

  const setPilot = useCallback(async (bannerId: string, isPilot: boolean) => {
    try {
      await callBannerService('set_pilot', {
        banner_id: bannerId,
        is_pilot: isPilot
      });

      // Atualiza o estado local
      setBanners(prev => prev.map(banner => 
        banner.id === bannerId 
          ? { ...banner, is_pilot: isPilot }
          : { ...banner, is_pilot: false } // Remove piloto dos outros
      ));

      toast({
        title: "Sucesso",
        description: isPilot ? "Banner definido como piloto." : "Banner removido como piloto.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [callBannerService, toast]);

  const cleanupExpired = useCallback(async () => {
    try {
      await callBannerService('cleanup_expired');
      
      toast({
        title: "Sucesso",
        description: "Banners expirados limpos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [callBannerService, toast]);

  const createBanner = useCallback(async (bannerData: Partial<Banner>): Promise<Banner> => {
    try {
      const { data, error } = await supabase
        .from('banners_normalized')
        .insert({
          name: bannerData.name || '',
          payload_jsonb: bannerData.payload_jsonb || {},
          click_url: bannerData.click_url,
          active: bannerData.active !== false,
          is_pilot: bannerData.is_pilot || false
        })
        .select()
        .single();

      if (error) throw error;

      setBanners(prev => [...prev, data]);
      
      toast({
        title: "Sucesso",
        description: "Banner criado com sucesso.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updateBanner = useCallback(async (bannerId: string, updates: Partial<Banner>) => {
    try {
      const { data, error } = await supabase
        .from('banners_normalized')
        .update(updates)
        .eq('id', bannerId)
        .select()
        .single();

      if (error) throw error;

      setBanners(prev => prev.map(banner => 
        banner.id === bannerId ? { ...banner, ...data } : banner
      ));

      toast({
        title: "Sucesso",
        description: "Banner atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    refreshBanners();
  }, [refreshBanners]);

  // Limpar automaticamente banners expirados a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  const value: NewBannerContextType = {
    banners,
    loading,
    getCurrentBanner,
    addToQueue,
    updateQueue,
    removeFromQueue,
    getQueue,
    setPilot,
    cleanupExpired,
    refreshBanners,
    createBanner,
    updateBanner
  };

  return (
    <NewBannerContext.Provider value={value}>
      {children}
    </NewBannerContext.Provider>
  );
};

export const useNewBanner = () => {
  const context = useContext(NewBannerContext);
  if (context === undefined) {
    throw new Error('useNewBanner must be used within a NewBannerProvider');
  }
  return context;
};