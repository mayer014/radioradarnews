import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { getInternalCategorySlug } from '@/utils/categoryMapper';

// Use proper Supabase types
type BannerRow = Database['public']['Tables']['banners']['Row'];
type BannerInsert = Database['public']['Tables']['banners']['Insert'];
type BannerUpdate = Database['public']['Tables']['banners']['Update'];

interface Banner {
  id: string;
  title: string;
  image_url: string;
  banner_type: string;
  target_category?: string;
  target_columnist_id?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  sort_order: number;
  is_pilot: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface ActiveBanner {
  id: string;
  title: string;
  image_url: string;
  banner_type: string;
  is_pilot: boolean;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all banners
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('is_pilot', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar banners',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get active banner for specific area - prioritize specific banners over pilot
  const getActiveBanner = useCallback(async (
    bannerType: 'hero' | 'category' | 'columnist',
    targetCategory?: string,
    targetColumnistId?: string
  ): Promise<ActiveBanner | null> => {
    try {
      // First try to get specific banner (non-pilot) - CASE INSENSITIVE comparison
      let query = supabase
        .from('banners')
        .select('id, title, image_url, banner_type, is_pilot, target_category')
        .eq('banner_type', bannerType)
        .eq('status', 'active')
        .eq('is_pilot', false);

      if (bannerType === 'category' && targetCategory) {
        // Convert display name to internal slug for database search
        const internalCategorySlug = getInternalCategorySlug(targetCategory);
        // Use ilike for case-insensitive comparison
        query = query.ilike('target_category', internalCategorySlug);
      } else if (bannerType === 'columnist' && targetColumnistId) {
        query = query.eq('target_columnist_id', targetColumnistId);
      }

      const { data, error } = await query.order('sort_order', { ascending: true }).limit(1);

      if (error) {
        console.error('Error in specific banner query:', error);
      }

      // If we found a specific banner, return it (priority over pilot)
      if (data && data.length > 0) {
        return data[0];
      }

      // Only use pilot banner if no specific banner exists for this area
      const { data: pilotData, error: pilotError } = await supabase
        .from('banners')
        .select('id, title, image_url, banner_type, is_pilot')
        .eq('is_pilot', true)
        .eq('status', 'active')
        .limit(1)
        .single();
        
      if (pilotError) {
        console.error('Error getting pilot banner:', pilotError);
        return null;
      }
      
      return pilotData || null;
    } catch (error) {
      console.error('Error getting active banner:', error);
      return null;
    }
  }, []);

  // Create new banner
  const createBanner = useCallback(async (bannerData: Partial<Banner>) => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([bannerData as BannerInsert])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Banner criado com sucesso',
      });

      fetchBanners();
      return data;
    } catch (error) {
      console.error('Error creating banner:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar banner',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchBanners, toast]);

  // Update banner
  const updateBanner = useCallback(async (id: string, updates: Partial<Banner>) => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update(updates as BannerUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Banner atualizado com sucesso',
      });

      fetchBanners();
      return data;
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar banner',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchBanners, toast]);

  // Delete banner
  const deleteBanner = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Banner excluído com sucesso',
      });

      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir banner',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchBanners, toast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners,
    loading,
    fetchBanners,
    getActiveBanner,
    createBanner,
    updateBanner,
    deleteBanner
  };
};