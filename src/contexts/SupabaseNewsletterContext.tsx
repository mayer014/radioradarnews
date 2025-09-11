import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Subscriber, 
  Campaign, 
  NewsletterTemplate, 
  NewsletterSettings,
  NewsletterStats 
} from '@/types/newsletter';

interface NewsletterContextType {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  templates: NewsletterTemplate[];
  settings: NewsletterSettings | null;
  loading: boolean;
  
  // Subscribers
  addSubscriber: (email: string, name?: string, source?: string) => Promise<boolean>;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
  unsubscribeByEmail: (email: string) => Promise<boolean>;
  getActiveSubscribers: () => Subscriber[];
  
  // Campaigns  
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'recipient_count' | 'delivered_count' | 'open_count' | 'click_count' | 'bounce_count' | 'unsubscribe_count'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  sendCampaign: (id: string) => Promise<boolean>;
  
  // Templates
  saveTemplate: (template: Omit<NewsletterTemplate, 'id' | 'created_at'>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Settings
  updateSettings: (newSettings: Partial<NewsletterSettings>) => Promise<void>;
  
  // Auto Newsletter
  sendAutoNewsletter: (article: { title: string; excerpt: string; category: string; id: string }) => Promise<boolean>;
  
  // Stats
  getStats: () => NewsletterStats;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

const defaultSettings: NewsletterSettings = {
  senderName: 'Radio Radar News',
  senderEmail: 'noticias@radioradar.news',
  replyToEmail: 'contato@radioradar.news',
  subscriptionFormEnabled: true,
  doubleOptIn: false,
  welcomeEmailEnabled: true,
  welcomeEmailSubject: 'Bem-vindo ao Radio Radar News!',
  welcomeEmailContent: 'Obrigado por se inscrever em nossa newsletter. Você receberá as melhores notícias em primeira mão!',
  unsubscribeFooter: 'Você está recebendo este email porque se inscreveu em nossa newsletter. Para cancelar, clique aqui.',
  autoSendEnabled: true,
  autoSendSubject: 'Nova matéria publicada: {{title}}',
  autoSendTemplate: 'Uma nova matéria foi publicada no Radio Radar News!\n\n**{{title}}**\n\n{{excerpt}}\n\nLeia a matéria completa em: {{url}}',
  autoSendCategories: ['Política', 'Policial', 'Entretenimento', 'Internacional', 'Esportes', 'Tecnologia', 'Ciência / Saúde'],
  autoSendDelay: 0
};

export const SupabaseNewsletterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [settings, setSettings] = useState<NewsletterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      // Transform database data to match interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        email: item.email,
        name: item.name,
        status: item.status as 'active' | 'unsubscribed' | 'bounced',
        subscribedAt: item.subscribed_at,
        updatedAt: item.subscribed_at,
        unsubscribedAt: item.unsubscribed_at,
        source: item.source as any,
        tags: item.tags || [],
        metadata: {}
      }));
      setSubscribers(transformedData);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform database data to match interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        content: item.content,
        htmlContent: item.html_content,
        status: item.status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed',
        createdAt: item.created_at,
        updatedAt: item.created_at,
        scheduledAt: item.scheduled_at,
        sentAt: item.sent_at,
        recipientCount: item.recipient_count,
        deliveredCount: item.recipient_count,
        openCount: item.open_count,
        clickCount: item.click_count,
        bounceCount: 0,
        unsubscribeCount: 0,
        tags: item.tags || []
      }));
      setCampaigns(transformedData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Transform database data to match interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: undefined,
        subject: item.subject,
        content: item.content,
        htmlContent: item.html_content,
        createdAt: item.created_at,
        updatedAt: item.created_at,
        isDefault: false
      }));
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'newsletter')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.value && typeof data.value === 'object') {
        setSettings({ ...defaultSettings, ...data.value });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(defaultSettings);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSubscribers(),
      fetchCampaigns(), 
      fetchTemplates(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();

    // Set up real-time subscriptions
    const subscribersChannel = supabase
      .channel('newsletter-subscribers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscribers' }, fetchSubscribers)
      .subscribe();

    const campaignsChannel = supabase
      .channel('newsletter-campaigns-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_campaigns' }, fetchCampaigns)
      .subscribe();

    const templatesChannel = supabase
      .channel('newsletter-templates-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_templates' }, fetchTemplates)
      .subscribe();

    const settingsChannel = supabase
      .channel('newsletter-settings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings',
        filter: 'category=eq.newsletter'
      }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(subscribersChannel);
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const addSubscriber = async (email: string, name?: string, source: string = 'manual'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase(),
          name,
          source,
          status: 'active',
          tags: []
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Email já cadastrado",
            description: "Este email já está inscrito na newsletter",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Email adicionado à newsletter com sucesso",
      });
      return true;
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar email à newsletter",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSubscriber = async (id: string, updates: Partial<Subscriber>) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Assinante atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar assinante",
        variant: "destructive",
      });
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Assinante removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover assinante",
        variant: "destructive",
      });
    }
  };

  const unsubscribeByEmail = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  };

  const getActiveSubscribers = (): Subscriber[] => {
    return subscribers.filter(sub => sub.status === 'active');
  };

  const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'recipient_count' | 'delivered_count' | 'open_count' | 'click_count' | 'bounce_count' | 'unsubscribe_count'>) => {
    try {
      const { error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          title: campaignData.title,
          subject: campaignData.subject,
          content: campaignData.content,
          html_content: campaignData.htmlContent,
          status: campaignData.status as 'draft' | 'scheduled' | 'sent',
          scheduled_at: campaignData.scheduledAt,
          sent_at: campaignData.sentAt,
          tags: campaignData.tags || [],
          recipient_count: 0,
          open_count: 0,
          click_count: 0
        });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso",
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha",
        variant: "destructive",
      });
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('newsletter_campaigns')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Campanha atualizada com sucesso",
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar campanha",
        variant: "destructive",
      });
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Campanha removida com sucesso",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover campanha",
        variant: "destructive",
      });
    }
  };

  const sendCampaign = async (id: string): Promise<boolean> => {
    try {
      const activeSubscribers = getActiveSubscribers();
      
      const { error } = await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: activeSubscribers.length
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Campanha enviada para ${activeSubscribers.length} assinantes`,
      });
      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar campanha",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveTemplate = async (templateData: Omit<NewsletterTemplate, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('newsletter_templates')
        .insert({
          name: templateData.name,
          subject: templateData.subject,
          content: templateData.content,
          html_content: templateData.htmlContent
        });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Template salvo com sucesso",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Template removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover template",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<NewsletterSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          category: 'newsletter',
          key: 'newsletter_settings',
          value: updatedSettings
        }, { 
          onConflict: 'category,key' 
        });

      if (error) throw error;
      
      setSettings(updatedSettings);
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    }
  };

  const sendAutoNewsletter = async (article: { title: string; excerpt: string; category: string; id: string }): Promise<boolean> => {
    if (!settings?.autoSendEnabled || !settings.autoSendCategories.includes(article.category)) {
      return false;
    }

    try {
      const subject = settings.autoSendSubject.replace('{{title}}', article.title);
      const content = settings.autoSendTemplate
        .replace('{{title}}', article.title)
        .replace('{{excerpt}}', article.excerpt)
        .replace('{{url}}', `${window.location.origin}/news/${article.id}`);

      // Create campaign directly in database
      const { error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          title: `Auto: ${article.title}`,
          subject,
          content,
          html_content: content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
          status: 'sent',
          sent_at: new Date().toISOString(),
          tags: ['auto-send', article.category.toLowerCase()],
          recipient_count: getActiveSubscribers().length,
          open_count: 0,
          click_count: 0
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error sending auto newsletter:', error);
      return false;
    }
  };

  const getStats = (): NewsletterStats => {
    const activeSubscribers = getActiveSubscribers();
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    
    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      unsubscribedCount: subscribers.filter(s => s.status === 'unsubscribed').length,
      totalCampaigns: campaigns.length,
      totalEmailsSent: sentCampaigns.reduce((acc, c) => acc + c.recipientCount, 0),
      averageOpenRate: sentCampaigns.length > 0 
        ? sentCampaigns.reduce((acc, c) => acc + (c.openCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      averageClickRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((acc, c) => acc + (c.clickCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      averageBounceRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((acc, c) => acc + (c.bounceCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      recentGrowth: 0, // Calculate based on recent subscribers
      topSources: [],
      topCategories: []
    };
  };

  return (
    <NewsletterContext.Provider value={{
      subscribers,
      campaigns,
      templates,
      settings,
      loading,
      addSubscriber,
      updateSubscriber,
      deleteSubscriber,
      unsubscribeByEmail,
      getActiveSubscribers,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      sendCampaign,
      saveTemplate,
      deleteTemplate,
      updateSettings,
      sendAutoNewsletter,
      getStats,
      refreshData
    }}>
      {children}
    </NewsletterContext.Provider>
  );
};

export const useSupabaseNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useSupabaseNewsletter must be used within a SupabaseNewsletterProvider');
  }
  return context;
};