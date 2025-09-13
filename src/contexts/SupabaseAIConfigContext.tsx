import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIConfiguration {
  id: string;
  provider_name: string;
  api_key_encrypted: string | null;
  config_json: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseAIConfigContextType {
  configurations: AIConfiguration[];
  loading: boolean;
  addConfiguration: (config: Omit<AIConfiguration, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateConfiguration: (id: string, updates: Partial<AIConfiguration>) => Promise<{ error: string | null }>;
  deleteConfiguration: (id: string) => Promise<{ error: string | null }>;
  getConfiguration: (providerName: string) => AIConfiguration | undefined;
  refreshConfigurations: () => Promise<void>;
}

const SupabaseAIConfigContext = createContext<SupabaseAIConfigContextType | undefined>(undefined);

export const SupabaseAIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations((data || []).map(item => ({
        ...item,
        config_json: item.config_json as Record<string, any>
      })));
    } catch (error) {
      console.error('Erro ao buscar configurações de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();

    // Set up real-time subscription
    const channel = supabase
      .channel('ai_configurations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_configurations'
      }, () => {
        fetchConfigurations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addConfiguration = async (config: Omit<AIConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .insert([config]);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao adicionar configuração:', error);
      return { error: error.message || 'Erro ao adicionar configuração' };
    }
  };

  const updateConfiguration = async (id: string, updates: Partial<AIConfiguration>) => {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      return { error: error.message || 'Erro ao atualizar configuração' };
    }
  };

  const deleteConfiguration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao deletar configuração:', error);
      return { error: error.message || 'Erro ao deletar configuração' };
    }
  };

  const getConfiguration = (providerName: string) => {
    return configurations.find(config => config.provider_name === providerName);
  };

  const refreshConfigurations = async () => {
    await fetchConfigurations();
  };

  const value: SupabaseAIConfigContextType = {
    configurations,
    loading,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
    getConfiguration,
    refreshConfigurations
  };

  return (
    <SupabaseAIConfigContext.Provider value={value}>
      {children}
    </SupabaseAIConfigContext.Provider>
  );
};

export const useSupabaseAIConfig = () => {
  const context = useContext(SupabaseAIConfigContext);
  if (context === undefined) {
    throw new Error('useSupabaseAIConfig must be used within a SupabaseAIConfigProvider');
  }
  return context;
};