import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteSite {
  id: string;
  name: string;
  url: string;
  description?: string;
  favicon_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SupabaseFavoriteSitesContextType {
  sites: FavoriteSite[];
  loading: boolean;
  addSite: (site: Omit<FavoriteSite, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateSite: (id: string, updates: Partial<FavoriteSite>) => Promise<{ error: string | null }>;
  deleteSite: (id: string) => Promise<{ error: string | null }>;
  toggleSiteStatus: (id: string) => Promise<{ error: string | null }>;
  reorderSites: (siteId: string, newOrder: number) => Promise<{ error: string | null }>;
  refreshSites: () => Promise<void>;
}

const SupabaseFavoriteSitesContext = createContext<SupabaseFavoriteSitesContextType | undefined>(undefined);

export const SupabaseFavoriteSitesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para carregar sites favoritos
  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_sites')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching favorite sites:', error);
        return;
      }

      setSites(data || []);
    } catch (error) {
      console.error('Error fetching favorite sites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchSites();
  }, []);

  // Configurar real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('favorite-sites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorite_sites'
        },
        (payload) => {
          console.log('Favorite site change:', payload);
          fetchSites(); // Recarregar sites quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addSite = async (siteData: Omit<FavoriteSite, 'id' | 'created_at' | 'updated_at'>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('favorite_sites')
        .insert({
          name: siteData.name,
          url: siteData.url,
          description: siteData.description,
          favicon_url: siteData.favicon_url,
          is_active: siteData.is_active,
          sort_order: siteData.sort_order
        });

      if (error) {
        console.error('Error adding favorite site:', error);
        return { error: 'Erro ao adicionar site favorito' };
      }

      toast({
        title: "Site adicionado",
        description: "O site foi adicionado aos favoritos.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error adding favorite site:', error);
      return { error: 'Erro ao adicionar site favorito' };
    }
  };

  const updateSite = async (id: string, updates: Partial<FavoriteSite>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('favorite_sites')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating favorite site:', error);
        return { error: 'Erro ao atualizar site favorito' };
      }

      toast({
        title: "Site atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating favorite site:', error);
      return { error: 'Erro ao atualizar site favorito' };
    }
  };

  const deleteSite = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('favorite_sites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting favorite site:', error);
        return { error: 'Erro ao deletar site favorito' };
      }

      toast({
        title: "Site removido",
        description: "O site foi removido dos favoritos.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting favorite site:', error);
      return { error: 'Erro ao deletar site favorito' };
    }
  };

  const toggleSiteStatus = async (id: string): Promise<{ error: string | null }> => {
    const site = sites.find(s => s.id === id);
    if (!site) {
      return { error: 'Site não encontrado' };
    }

    return await updateSite(id, { is_active: !site.is_active });
  };

  const reorderSites = async (siteId: string, newOrder: number): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('favorite_sites')
        .update({ sort_order: newOrder })
        .eq('id', siteId);

      if (error) {
        console.error('Error reordering site:', error);
        return { error: 'Erro ao reordenar site' };
      }

      return { error: null };
    } catch (error) {
      console.error('Error reordering site:', error);
      return { error: 'Erro ao reordenar site' };
    }
  };

  const refreshSites = async () => {
    await fetchSites();
  };

  return (
    <SupabaseFavoriteSitesContext.Provider value={{
      sites,
      loading,
      addSite,
      updateSite,
      deleteSite,
      toggleSiteStatus,
      reorderSites,
      refreshSites
    }}>
      {children}
    </SupabaseFavoriteSitesContext.Provider>
  );
};

export const useSupabaseFavoriteSites = () => {
  const context = useContext(SupabaseFavoriteSitesContext);
  if (context === undefined) {
    throw new Error('useSupabaseFavoriteSites must be used within a SupabaseFavoriteSitesProvider');
  }
  return context;
};