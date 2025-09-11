import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContactInfo {
  id: string;
  phone1: string;
  phone2?: string;
  email1: string;
  email2?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  weekdays_hours: string;
  saturday_hours: string;
  sunday_hours: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
}

interface ContactInfoContextType {
  contactInfo: ContactInfo | null;
  loading: boolean;
  updateContactInfo: (updates: Partial<ContactInfo>) => Promise<void>;
  refreshContactInfo: () => Promise<void>;
}

const ContactInfoContext = createContext<ContactInfoContextType | undefined>(undefined);

export const SupabaseContactInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setContactInfo(data);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações de contato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();

    // Set up real-time subscription
    const channel = supabase
      .channel('contact-info-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contact_info'
      }, () => {
        fetchContactInfo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateContactInfo = async (updates: Partial<ContactInfo>) => {
    try {
      if (!contactInfo) {
        // Create new contact info if none exists
        const { error } = await supabase
          .from('contact_info')
          .insert(updates as any);

        if (error) throw error;
      } else {
        // Update existing contact info
        const { error } = await supabase
          .from('contact_info')
          .update(updates as any)
          .eq('id', contactInfo.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Informações de contato atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações de contato",
        variant: "destructive",
      });
    }
  };

  const refreshContactInfo = async () => {
    await fetchContactInfo();
  };

  return (
    <ContactInfoContext.Provider value={{
      contactInfo,
      loading,
      updateContactInfo,
      refreshContactInfo,
    }}>
      {children}
    </ContactInfoContext.Provider>
  );
};

export const useSupabaseContactInfo = () => {
  const context = useContext(ContactInfoContext);
  if (!context) {
    throw new Error('useSupabaseContactInfo must be used within a SupabaseContactInfoProvider');
  }
  return context;
};