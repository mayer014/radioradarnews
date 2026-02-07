import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceProvider {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  description: string;
  city: string;
  neighborhood: string | null;
  whatsapp: string;
  charges_estimate: boolean;
  charges_displacement: boolean;
  notes: string | null;
  available_days: string[];
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: { name: string; icon: string; slug: string } | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useServiceProviders() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setCategories(data as ServiceCategory[]);
  }, []);

  const fetchProviders = useCallback(async (filters?: { category_id?: string; city?: string; search?: string }) => {
    setLoading(true);
    let query = supabase
      .from('service_providers')
      .select('*, category:service_categories(name, icon, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.category_id) query = query.eq('category_id', filters.category_id);
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);

    const { data } = await query;
    if (data) setProviders(data as any);
    setLoading(false);
  }, []);

  const fetchMyProviders = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('service_providers')
      .select('*, category:service_categories(name, icon, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data || []) as ServiceProvider[];
  }, []);

  const createProvider = useCallback(async (provider: Omit<ServiceProvider, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
    const { data, error } = await supabase.from('service_providers').insert(provider).select().single();
    return { data, error };
  }, []);

  const updateProvider = useCallback(async (id: string, updates: Partial<ServiceProvider>) => {
    const { category, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase.from('service_providers').update(cleanUpdates).eq('id', id).select().single();
    return { data, error };
  }, []);

  const deleteProvider = useCallback(async (id: string) => {
    const { error } = await supabase.from('service_providers').delete().eq('id', id);
    return { error };
  }, []);

  const getProvider = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*, category:service_categories(name, icon, slug)')
      .eq('id', id)
      .single();
    return { data: data as ServiceProvider | null, error };
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, [fetchCategories, fetchProviders]);

  return { providers, categories, loading, fetchProviders, fetchMyProviders, createProvider, updateProvider, deleteProvider, getProvider, fetchCategories };
}
