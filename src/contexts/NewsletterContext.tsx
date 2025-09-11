import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: string;
  source: string; // 'homepage', 'article', 'popup', etc.
  tags: string[];
}

export interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  htmlContent: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  tags: string[];
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  htmlContent: string;
  createdAt: string;
}

export interface NewsletterSettings {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  subscriptionFormEnabled: boolean;
  doubleOptIn: boolean;
  welcomeEmailEnabled: boolean;
  welcomeEmailSubject: string;
  welcomeEmailContent: string;
  unsubscribeFooter: string;
  // Configurações de envio automático
  autoSendEnabled: boolean;
  autoSendSubject: string;
  autoSendTemplate: string;
  autoSendCategories: string[]; // Categorias que devem disparar envio automático
}

interface NewsletterContextType {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  templates: NewsletterTemplate[];
  settings: NewsletterSettings;
  
  // Subscribers
  addSubscriber: (email: string, name?: string, source?: string) => boolean;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => void;
  deleteSubscriber: (id: string) => void;
  unsubscribeByEmail: (email: string) => boolean;
  getActiveSubscribers: () => Subscriber[];
  
  // Campaigns  
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'recipientCount' | 'openCount' | 'clickCount'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  sendCampaign: (id: string) => Promise<boolean>;
  
  // Templates
  saveTemplate: (template: Omit<NewsletterTemplate, 'id' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  
  // Settings
  updateSettings: (newSettings: NewsletterSettings) => void;
  
  // Auto Newsletter
  sendAutoNewsletter: (article: { title: string; excerpt: string; category: string; id: string }) => Promise<boolean>;
  
  // Stats
  getStats: () => {
    totalSubscribers: number;
    activeSubscribers: number;
    totalCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
  };
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

const defaultSettings: NewsletterSettings = {
  senderName: 'Portal de Notícias',
  senderEmail: 'noticias@portal.com',
  replyToEmail: 'contato@portal.com',
  subscriptionFormEnabled: true,
  doubleOptIn: false,
  welcomeEmailEnabled: true,
  welcomeEmailSubject: 'Bem-vindo ao Portal de Notícias!',
  welcomeEmailContent: 'Obrigado por se inscrever em nossa newsletter. Você receberá as melhores notícias em primeira mão!',
  unsubscribeFooter: 'Você está recebendo este email porque se inscreveu em nossa newsletter. Para cancelar, clique aqui.',
  // Configurações padrão para envio automático
  autoSendEnabled: true,
  autoSendSubject: 'Nova matéria publicada: {{title}}',
  autoSendTemplate: 'Uma nova matéria foi publicada no Portal de Notícias!\n\n**{{title}}**\n\n{{excerpt}}\n\nLeia a matéria completa em: {{url}}',
  autoSendCategories: ['Política', 'Policial', 'Entretenimento', 'Internacional', 'Esportes', 'Tecnologia', 'Ciência / Saúde']
};

export const NewsletterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dados de exemplo para demonstração
  const exampleSubscribers: Subscriber[] = [
    {
      id: '1',
      email: 'joao.silva@email.com',
      name: 'João Silva',
      status: 'active',
      subscribedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'homepage',
      tags: ['geral']
    },
    {
      id: '2', 
      email: 'maria.santos@email.com',
      name: 'Maria Santos',
      status: 'active',
      subscribedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'article',
      tags: ['política']
    },
    {
      id: '3',
      email: 'pedro.oliveira@email.com', 
      name: 'Pedro Oliveira',
      status: 'unsubscribed',
      subscribedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'homepage',
      tags: ['esportes']
    }
  ];

  const exampleCampaigns: Campaign[] = [
    {
      id: '1',
      title: 'Newsletter Semanal - Política',
      subject: 'Principais notícias da semana',
      content: 'Confira as principais notícias políticas desta semana...',
      htmlContent: '<p>Confira as principais notícias políticas desta semana...</p>',
      status: 'sent',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      recipientCount: 150,
      openCount: 89,
      clickCount: 23,
      tags: ['política', 'semanal']
    },
    {
      id: '2',
      title: 'Breaking News - Esportes',
      subject: 'Resultado do jogo de hoje!',
      content: 'Veja o resultado completo da partida...',
      htmlContent: '<p>Veja o resultado completo da partida...</p>',
      status: 'draft',
      createdAt: new Date().toISOString(),
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
      tags: ['esportes', 'breaking']
    }
  ];

  const [subscribers, setSubscribers] = useState<Subscriber[]>(exampleSubscribers);
  const [campaigns, setCampaigns] = useState<Campaign[]>(exampleCampaigns);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [settings, setSettings] = useState<NewsletterSettings>({
    ...defaultSettings,
    senderName: 'Portal de Notícias',
    senderEmail: 'admin@portal.com.br'
  });

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedSubscribers = localStorage.getItem('portal_newsletter_subscribers');
      const savedCampaigns = localStorage.getItem('portal_newsletter_campaigns');
      const savedTemplates = localStorage.getItem('portal_newsletter_templates');
      const savedSettings = localStorage.getItem('portal_newsletter_settings');
      
      if (savedSubscribers) {
        setSubscribers(JSON.parse(savedSubscribers));
      }
      
      if (savedCampaigns) {
        setCampaigns(JSON.parse(savedCampaigns));
      }
      
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
      
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading newsletter data from localStorage:', error);
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('portal_newsletter_subscribers', JSON.stringify(subscribers));
  }, [subscribers]);

  useEffect(() => {
    localStorage.setItem('portal_newsletter_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('portal_newsletter_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('portal_newsletter_settings', JSON.stringify(settings));
  }, [settings]);

  const addSubscriber = (email: string, name?: string, source: string = 'manual') => {
    // Verificar se já existe
    if (subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const newSubscriber: Subscriber = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      source,
      tags: []
    };

    setSubscribers(prev => [newSubscriber, ...prev]);
    return true;
  };

  const updateSubscriber = (id: string, updates: Partial<Subscriber>) => {
    setSubscribers(prev => 
      prev.map(sub => sub.id === id ? { ...sub, ...updates } : sub)
    );
  };

  const deleteSubscriber = (id: string) => {
    setSubscribers(prev => prev.filter(sub => sub.id !== id));
  };

  const unsubscribeByEmail = (email: string) => {
    const subscriber = subscribers.find(sub => sub.email.toLowerCase() === email.toLowerCase());
    if (subscriber) {
      updateSubscriber(subscriber.id, { status: 'unsubscribed' });
      return true;
    }
    return false;
  };

  const getActiveSubscribers = () => {
    return subscribers.filter(sub => sub.status === 'active');
  };

  const createCampaign = (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'recipientCount' | 'openCount' | 'clickCount'>) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      recipientCount: 0,
      openCount: 0,
      clickCount: 0
    };

    setCampaigns(prev => [newCampaign, ...prev]);
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => 
      prev.map(campaign => campaign.id === id ? { ...campaign, ...updates } : campaign)
    );
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
  };

  const sendCampaign = async (id: string): Promise<boolean> => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return false;

    const activeSubscribers = getActiveSubscribers();
    
    // Simular envio (em produção, aqui seria a integração com serviço de email)
    try {
      // Atualizar status da campanha
      updateCampaign(id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
        recipientCount: activeSubscribers.length
      });

      console.log(`Campaign "${campaign.title}" sent to ${activeSubscribers.length} subscribers`);
      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      return false;
    }
  };

  const saveTemplate = (templateData: Omit<NewsletterTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: NewsletterTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    setTemplates(prev => [newTemplate, ...prev]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  const updateSettings = (newSettings: NewsletterSettings) => {
    setSettings(newSettings);
  };

  const sendAutoNewsletter = async (article: { title: string; excerpt: string; category: string; id: string }): Promise<boolean> => {
    // Verificar se o envio automático está habilitado
    if (!settings.autoSendEnabled) {
      return false;
    }

    // Verificar se a categoria está configurada para envio automático
    if (!settings.autoSendCategories.includes(article.category)) {
      return false;
    }

    const activeSubscribers = getActiveSubscribers();
    if (activeSubscribers.length === 0) {
      return false;
    }

    try {
      // Criar campanha automática
      const subject = settings.autoSendSubject.replace('{{title}}', article.title);
      const content = settings.autoSendTemplate
        .replace('{{title}}', article.title)
        .replace('{{excerpt}}', article.excerpt)
        .replace('{{url}}', `${window.location.origin}/news/${article.id}`);

      const autoCampaign: Campaign = {
        id: crypto.randomUUID(),
        title: `Auto: ${article.title}`,
        subject,
        content,
        htmlContent: content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        status: 'sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        recipientCount: activeSubscribers.length,
        openCount: 0,
        clickCount: 0,
        tags: ['auto-send', article.category.toLowerCase()]
      };

      // Adicionar à lista de campanhas
      setCampaigns(prev => [autoCampaign, ...prev]);

      console.log(`Auto newsletter sent: "${article.title}" to ${activeSubscribers.length} subscribers`);
      return true;
    } catch (error) {
      console.error('Error sending auto newsletter:', error);
      return false;
    }
  };

  const getStats = () => {
    const activeSubscribers = getActiveSubscribers();
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    
    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      totalCampaigns: campaigns.length,
      averageOpenRate: sentCampaigns.length > 0 
        ? sentCampaigns.reduce((acc, c) => acc + (c.openCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      averageClickRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((acc, c) => acc + (c.clickCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0
    };
  };

  return (
    <NewsletterContext.Provider value={{
      subscribers,
      campaigns,
      templates,
      settings,
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
      getStats
    }}>
      {children}
    </NewsletterContext.Provider>
  );
};

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
};