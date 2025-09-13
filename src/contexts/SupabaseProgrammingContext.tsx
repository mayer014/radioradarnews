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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        .select('value')
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching radio stream URL:', error);
        return;
      }

      if (data?.value) {
        const value = typeof data.value === 'object' && data.value !== null && 'url' in data.value 
          ? (data.value as { url: string }).url 
          : '';
        setRadioStreamUrlState(value);
      }
    } catch (error) {
      console.error('Error fetching radio stream URL:', error);
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
      .channel('radio-programs-changes')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setRadioStreamUrl = async (url: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          category: 'radio',
          key: 'stream_url',
          value: { url }
        });

      if (error) {
        console.error('Error updating radio stream URL:', error);
        return { error: 'Erro ao salvar URL da rádio' };
      }

      setRadioStreamUrlState(url);
      
      toast({
        title: "URL da rádio atualizada",
        description: "A URL do stream da rádio foi salva com sucesso.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating radio stream URL:', error);
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