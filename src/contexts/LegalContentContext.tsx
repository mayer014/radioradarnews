import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LegalContent {
  id: string;
  type: 'privacy_policy' | 'terms_of_service';
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface LegalContentContextType {
  contents: LegalContent[];
  loading: boolean;
  getContent: (type: 'privacy_policy' | 'terms_of_service') => LegalContent | undefined;
  updateContent: (type: 'privacy_policy' | 'terms_of_service', title: string, content: string) => Promise<{ error?: string }>;
  refreshContents: () => Promise<void>;
}

const LegalContentContext = createContext<LegalContentContextType | undefined>(undefined);

export const LegalContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contents, setContents] = useState<LegalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_content')
        .select('*')
        .order('type');

      if (error) {
        console.error('Error fetching legal contents:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar conteúdos legais",
          variant: "destructive",
        });
        return;
      }

      setContents((data || []) as LegalContent[]);
    } catch (error) {
      console.error('Error fetching legal contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // Configurar real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('legal-content-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_content'
        },
        (payload) => {
          console.log('Real-time legal content change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newContent = payload.new as LegalContent;
            setContents(prev => [...prev, newContent]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedContent = payload.new as LegalContent;
            setContents(prev => prev.map(content => 
              content.id === updatedContent.id ? updatedContent : content
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setContents(prev => prev.filter(c => c.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getContent = (type: 'privacy_policy' | 'terms_of_service') => {
    return contents.find(content => content.type === type);
  };

  const updateContent = async (type: 'privacy_policy' | 'terms_of_service', title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('legal_content')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('type', type);

      if (error) {
        console.error('Error updating legal content:', error);
        return { error: error.message };
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso",
      });

      return {};
    } catch (error) {
      console.error('Error updating legal content:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const refreshContents = async () => {
    await fetchContents();
  };

  const value: LegalContentContextType = {
    contents,
    loading,
    getContent,
    updateContent,
    refreshContents
  };

  return (
    <LegalContentContext.Provider value={value}>
      {children}
    </LegalContentContext.Provider>
  );
};

export const useLegalContent = () => {
  const context = useContext(LegalContentContext);
  if (context === undefined) {
    throw new Error('useLegalContent must be used within a LegalContentProvider');
  }
  return context;
};