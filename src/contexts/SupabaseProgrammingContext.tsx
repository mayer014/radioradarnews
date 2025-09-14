import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Program {
  id: string;
  title: string;
  host: string;
  start_time: string;
  end_time: string;
  description: string;
  status: 'live' | 'upcoming' | 'ended';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseProgrammingContextType {
  programs: Program[];
  radioStreamUrl: string;
  streamConfigVersion: number;
  loading: boolean;
  setRadioStreamUrl: (url: string) => Promise<{ error: string | null }>;
  addProgram: (program: Omit<Program, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateProgram: (id: string, program: Partial<Program>) => Promise<{ error: string | null }>;
  deleteProgram: (id: string) => Promise<{ error: string | null }>;
  getProgramById: (id: string) => Program | undefined;
  toggleProgramStatus: (id: string) => Promise<{ error: string | null }>;
  refreshPrograms: () => Promise<void>;
}

const SupabaseProgrammingContext = createContext<SupabaseProgrammingContextType | undefined>(undefined);

export const SupabaseProgrammingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [radioStreamUrl, setRadioStreamUrlState] = useState<string>('');
  const [streamConfigVersion, setStreamConfigVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sanitizeRadioUrl = (url: string) => {
    if (!url) return '';
    let out = url.trim();
    // Remove quotes and extra whitespace
    out = out.replace(/^["']|["']$/g, '');
    if (out.startsWith('ttps://') || out.startsWith('ttp://')) out = 'h' + out;
    return out;
  };

  // Bootstrap from localStorage immediately + migrate legacy key
  useEffect(() => {
    try {
      const rrn = localStorage.getItem('rrn_radio_url');
      const legacy = localStorage.getItem('radio_stream_url');

      // Migrate legacy -> rrn if needed
      if (!rrn && legacy) {
        const migrated = sanitizeRadioUrl(legacy);
        localStorage.setItem('rrn_radio_url', migrated);
        localStorage.removeItem('radio_stream_url');
        console.log('[RADIO BOOTSTRAP] Migrated legacy radio_stream_url -> rrn_radio_url');
        if (!radioStreamUrl) {
          setRadioStreamUrlState(migrated);
          setStreamConfigVersion((v) => v + 1);
        }
        return;
      }

      // Always remove legacy key to avoid conflicts
      if (legacy) {
        localStorage.removeItem('radio_stream_url');
      }

      if (rrn && !radioStreamUrl) {
        console.log('[RADIO BOOTSTRAP] Loading from localStorage:', rrn);
        setRadioStreamUrlState(sanitizeRadioUrl(rrn));
        setStreamConfigVersion((v) => v + 1);
      }
    } catch (e) {
      console.warn('[RADIO BOOTSTRAP] localStorage unavailable', e);
    }
  }, []);

  // Função para carregar programas
  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('radio_programs')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching programs:', error);
        return;
      }

      const mappedPrograms = (data || []).map(program => ({
        ...program,
        status: program.status as 'live' | 'upcoming' | 'ended'
      }));
      setPrograms(mappedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar URL da rádio
  const fetchRadioStreamUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, value, updated_at, created_at')
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching radio stream URL:', error);
      }

      let value = '';
      const rows = data || [];

      if (rows.length > 1) {
        console.warn('[RADIO CONFIG] Duplicated stream_url rows detected:', rows.length);
      }

      // Prefer first non-empty url
      for (const row of rows as any[]) {
        const v: any = row.value;
        let url = '';
        if (typeof v === 'string') {
          url = v;
        } else if (v && typeof v === 'object' && typeof v.url === 'string') {
          url = v.url;
        }
        if (url && url.trim() !== '') {
          value = url;
          break;
        }
      }

      // Fallback to first row even if empty
      if (!value && rows[0]) {
        const v: any = (rows[0] as any).value;
        if (typeof v === 'string') value = v;
        else if (v && typeof v.url === 'string') value = v.url;
      }

      // If DB not configured, try public edge config
      if (!value) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: cfg } = await supabase.functions.invoke('public-config');
          if (cfg?.radioStreamUrl) {
            value = cfg.radioStreamUrl;
          }
        } catch (e) {
          console.warn('public-config fallback failed', e);
        }
      }

      // Final fallback to runtime/build env
      if (!value) {
        const { ENV } = await import('@/config/environment');
        value = ENV.RADIO_STREAM_URL || '';
      }

      const cleaned = sanitizeRadioUrl(value);
      setRadioStreamUrlState(cleaned);
      localStorage.setItem('rrn_radio_url', cleaned);
      localStorage.removeItem('radio_stream_url');
      setStreamConfigVersion((v) => v + 1);
    } catch (error) {
      console.error('Error fetching radio stream URL:', error);
      const { ENV } = await import('@/config/environment');
      const cleaned = sanitizeRadioUrl(ENV.RADIO_STREAM_URL || '');
      setRadioStreamUrlState(cleaned);
      setStreamConfigVersion((v) => v + 1);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchPrograms();
    fetchRadioStreamUrl();
  }, []);

  // Configurar real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('radio-programs-and-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_programs'
        },
        (payload) => {
          console.log('Program change:', payload);
          fetchPrograms(); // Recarregar programas quando houver mudanças
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: 'category=eq.radio'
        },
        (payload) => {
          console.log('[RADIO REALTIME] Settings change:', payload);
          fetchRadioStreamUrl(); // Atualizar URL quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setRadioStreamUrl = async (url: string): Promise<{ error: string | null }> => {
    try {
      const cleaned = sanitizeRadioUrl(url);
      // Atualiza qualquer registro existente (inclusive duplicados antigos)
      const { data: updated, error: updateError } = await supabase
        .from('settings')
        .update({ value: { url: cleaned } })
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .select('id');

      if (updateError) {
        console.error('Error updating radio stream URL:', updateError);
        return { error: 'Erro ao salvar URL da rádio' };
      }

      // Se não atualizou nada, cria o registro
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ category: 'radio', key: 'stream_url', value: { url: cleaned } });
        if (insertError) {
          console.error('Error inserting radio stream URL:', insertError);
          return { error: 'Erro ao salvar URL da rádio' };
        }
      }

      setRadioStreamUrlState(cleaned);
      localStorage.setItem('rrn_radio_url', cleaned);
      localStorage.removeItem('radio_stream_url');
      setStreamConfigVersion((v) => v + 1);

      toast({
        title: 'URL da rádio atualizada',
        description: 'A URL do stream da rádio foi salva com sucesso.',
      });

      return { error: null };
    } catch (e) {
      console.error('Error updating radio stream URL:', e);
      return { error: 'Erro ao salvar URL da rádio' };
    }
  };

  const addProgram = async (programData: Omit<Program, 'id' | 'created_at' | 'updated_at'>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('radio_programs')
        .insert({
          title: programData.title,
          host: programData.host,
          start_time: programData.start_time,
          end_time: programData.end_time,
          description: programData.description,
          status: programData.status,
          is_active: programData.is_active
        });

      if (error) {
        console.error('Error adding program:', error);
        return { error: error.message || 'Erro ao adicionar programa' };
      }

      // Atualiza imediatamente a lista (sem depender do realtime)
      await fetchPrograms();

      toast({
        title: "Programa adicionado",
        description: "O programa foi criado com sucesso.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error adding program:', error);
      return { error: error?.message || 'Erro ao adicionar programa' };
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('radio_programs')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating program:', error);
        return { error: error.message || 'Erro ao atualizar programa' };
      }

      // Atualiza imediatamente a lista (sem depender do realtime)
      await fetchPrograms();

      toast({
        title: "Programa atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating program:', error);
      return { error: error?.message || 'Erro ao atualizar programa' };
    }
  };

  const deleteProgram = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('radio_programs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting program:', error);
        return { error: error.message || 'Erro ao deletar programa' };
      }

      // Atualiza imediatamente a lista (sem depender do realtime)
      await fetchPrograms();

      toast({
        title: "Programa deletado",
        description: "O programa foi removido com sucesso.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting program:', error);
      return { error: error?.message || 'Erro ao deletar programa' };
    }
  };

  const getProgramById = (id: string) => {
    return programs.find(program => program.id === id);
  };

  const toggleProgramStatus = async (id: string): Promise<{ error: string | null }> => {
    const program = getProgramById(id);
    if (!program) {
      return { error: 'Programa não encontrado' };
    }

    const newStatus = program.status === 'live' ? 'upcoming' : 'live';
    return await updateProgram(id, { status: newStatus });
  };

  const refreshPrograms = async () => {
    await fetchPrograms();
  };

  return (
    <SupabaseProgrammingContext.Provider
      value={{
        programs,
        radioStreamUrl,
        streamConfigVersion,
        loading,
        setRadioStreamUrl,
        addProgram,
        updateProgram,
        deleteProgram,
        getProgramById,
        toggleProgramStatus,
        refreshPrograms,
      }}
    >
      {children}
    </SupabaseProgrammingContext.Provider>
  );
};

export const useSupabaseProgramming = () => {
  const context = useContext(SupabaseProgrammingContext);
  if (!context) {
    throw new Error('useSupabaseProgramming must be used within a SupabaseProgrammingProvider');
  }
  return context;
};