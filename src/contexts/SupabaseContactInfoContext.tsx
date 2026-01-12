import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Public contact info (safe for unauthenticated access)
export interface PublicContactInfo {
  phone1: string;
  email1: string;
  city: string;
  state: string;
  weekdays_hours: string;
  saturday_hours: string;
  sunday_hours: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
}

// Full contact info (requires authentication)
export interface ContactInfo extends PublicContactInfo {
  id: string;
  phone2?: string;
  email2?: string;
  address: string;
  zip_code?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
}

interface ContactInfoContextType {
  contactInfo: ContactInfo | null;
  publicContactInfo: PublicContactInfo | null;
  loading: boolean;
  updateContactInfo: (updates: Partial<ContactInfo>) => Promise<void>;
  refreshContactInfo: () => Promise<void>;
}

const ContactInfoContext = createContext<ContactInfoContextType | undefined>(undefined);

export const SupabaseContactInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [publicContactInfo, setPublicContactInfo] = useState<PublicContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPublicContactInfo = async () => {
    try {
      // Use the secure public function for public access
      const { data, error } = await supabase.rpc('get_public_contact_info');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPublicContactInfo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching public contact info:', error);
    }
  };

  const fetchFullContactInfo = async () => {
    try {
      // Only try to fetch full info if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContactInfo({
          id: data.id,
          phone1: data.phone1,
          phone2: data.phone2,
          email1: data.email1,
          email2: data.email2,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          weekdays_hours: data.weekdays_hours,
          saturday_hours: data.saturday_hours,
          sunday_hours: data.sunday_hours,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          twitter_url: data.twitter_url,
          youtube_url: data.youtube_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error fetching full contact info:', error);
    }
  };

  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      // Always fetch public info
      await fetchPublicContactInfo();
      // Try to fetch full info if authenticated
      await fetchFullContactInfo();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchFullContactInfo();
      } else if (event === 'SIGNED_OUT') {
        setContactInfo(null);
      }
    });

    // Set up real-time subscription for authenticated users
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
      subscription.unsubscribe();
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

      await fetchContactInfo();
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

  const value: ContactInfoContextType = {
    contactInfo,
    publicContactInfo,
    loading,
    updateContactInfo,
    refreshContactInfo,
  };

  return (
    <ContactInfoContext.Provider value={value}>
      {children}
    </ContactInfoContext.Provider>
  );
};

export const useSupabaseContactInfo = () => {
  const context = useContext(ContactInfoContext);
  if (context === undefined) {
    throw new Error('useSupabaseContactInfo must be used within a SupabaseContactInfoProvider');
  }
  return context;
};