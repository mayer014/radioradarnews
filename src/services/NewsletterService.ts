// Serviço centralizado para newsletter
// Facilita migração futura para backend/Supabase

import { 
  Subscriber, 
  Campaign, 
  NewsletterTemplate, 
  NewsletterSettings,
  NewsletterStats,
  NewsletterExport,
  SubscriberStatus,
  CampaignStatus,
  SubscriptionSource 
} from '@/types/newsletter';

class NewsletterService {
  private readonly STORAGE_KEYS = {
    subscribers: 'portal_newsletter_subscribers',
    campaigns: 'portal_newsletter_campaigns', 
    templates: 'portal_newsletter_templates',
    settings: 'portal_newsletter_settings'
  };

  // =============================================
  // SUBSCRIBERS
  // =============================================
  
  getSubscribers(): Subscriber[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.subscribers);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading subscribers:', error);
      return [];
    }
  }

  saveSubscribers(subscribers: Subscriber[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.subscribers, JSON.stringify(subscribers));
    } catch (error) {
      console.error('Error saving subscribers:', error);
      throw new Error('Falha ao salvar inscritos');
    }
  }

  addSubscriber(email: string, name?: string, source: SubscriptionSource = 'manual'): boolean {
    const subscribers = this.getSubscribers();
    
    // Verificar se já existe
    if (subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }

    const newSubscriber: Subscriber = {
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      name: name?.trim(),
      status: 'active',
      subscribedAt: new Date().toISOString(),
      source,
      tags: [],
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: Date.now()
      }
    };

    subscribers.unshift(newSubscriber);
    this.saveSubscribers(subscribers);
    return true;
  }

  updateSubscriber(id: string, updates: Partial<Subscriber>): boolean {
    const subscribers = this.getSubscribers();
    const index = subscribers.findIndex(sub => sub.id === id);
    
    if (index === -1) return false;

    subscribers[index] = { 
      ...subscribers[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveSubscribers(subscribers);
    return true;
  }

  deleteSubscriber(id: string): boolean {
    const subscribers = this.getSubscribers();
    const filtered = subscribers.filter(sub => sub.id !== id);
    
    if (filtered.length === subscribers.length) return false;
    
    this.saveSubscribers(filtered);
    return true;
  }

  unsubscribeByEmail(email: string): boolean {
    const subscribers = this.getSubscribers();
    const subscriber = subscribers.find(sub => sub.email.toLowerCase() === email.toLowerCase());
    
    if (!subscriber) return false;
    
    return this.updateSubscriber(subscriber.id, { 
      status: 'unsubscribed',
      unsubscribedAt: new Date().toISOString()
    });
  }

  getActiveSubscribers(): Subscriber[] {
    return this.getSubscribers().filter(sub => sub.status === 'active');
  }

  // =============================================
  // CAMPAIGNS
  // =============================================
  
  getCampaigns(): Campaign[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.campaigns);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return [];
    }
  }

  saveCampaigns(campaigns: Campaign[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.campaigns, JSON.stringify(campaigns));
    } catch (error) {
      console.error('Error saving campaigns:', error);
      throw new Error('Falha ao salvar campanhas');
    }
  }

  createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'recipientCount' | 'deliveredCount' | 'openCount' | 'clickCount' | 'bounceCount' | 'unsubscribeCount'>): string {
    const campaigns = this.getCampaigns();
    
    const newCampaign: Campaign = {
      ...campaignData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recipientCount: 0,
      deliveredCount: 0,
      openCount: 0,
      clickCount: 0,
      bounceCount: 0,
      unsubscribeCount: 0
    };

    campaigns.unshift(newCampaign);
    this.saveCampaigns(campaigns);
    return newCampaign.id;
  }

  updateCampaign(id: string, updates: Partial<Campaign>): boolean {
    const campaigns = this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    
    if (index === -1) return false;

    campaigns[index] = { 
      ...campaigns[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveCampaigns(campaigns);
    return true;
  }

  deleteCampaign(id: string): boolean {
    const campaigns = this.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    
    if (filtered.length === campaigns.length) return false;
    
    this.saveCampaigns(filtered);
    return true;
  }

  async sendCampaign(id: string): Promise<boolean> {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === id);
    
    if (!campaign) return false;

    const activeSubscribers = this.getActiveSubscribers();
    
    try {
      // Simular envio - em produção seria integração com serviço de email
      const success = await this.simulateEmailSend(campaign, activeSubscribers);
      
      if (success) {
        this.updateCampaign(id, {
          status: 'sent',
          sentAt: new Date().toISOString(),
          recipientCount: activeSubscribers.length,
          deliveredCount: activeSubscribers.length
        });
        
        console.log(`Campaign "${campaign.title}" sent to ${activeSubscribers.length} subscribers`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending campaign:', error);
      this.updateCampaign(id, { status: 'failed' });
      return false;
    }
  }

  private async simulateEmailSend(campaign: Campaign, subscribers: Subscriber[]): Promise<boolean> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular taxa de sucesso (95%)
    return Math.random() > 0.05;
  }

  // =============================================
  // TEMPLATES
  // =============================================
  
  getTemplates(): NewsletterTemplate[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.templates);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  saveTemplates(templates: NewsletterTemplate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.templates, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates:', error);
      throw new Error('Falha ao salvar templates');
    }
  }

  createTemplate(templateData: Omit<NewsletterTemplate, 'id' | 'createdAt' | 'updatedAt'>): string {
    const templates = this.getTemplates();
    
    const newTemplate: NewsletterTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.unshift(newTemplate);
    this.saveTemplates(templates);
    return newTemplate.id;
  }

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) return false;
    
    this.saveTemplates(filtered);
    return true;
  }

  // =============================================
  // SETTINGS
  // =============================================
  
  getSettings(): NewsletterSettings {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.settings);
      const defaultSettings = this.getDefaultSettings();
      
      if (!data) return defaultSettings;
      
      const saved = JSON.parse(data);
      return { ...defaultSettings, ...saved };
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  saveSettings(settings: NewsletterSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Falha ao salvar configurações');
    }
  }

  private getDefaultSettings(): NewsletterSettings {
    return {
      senderName: 'Portal de Notícias',
      senderEmail: 'noticias@portal.com',
      replyToEmail: 'contato@portal.com',
      subscriptionFormEnabled: true,
      doubleOptIn: false,
      welcomeEmailEnabled: true,
      welcomeEmailSubject: 'Bem-vindo ao Portal de Notícias!',
      welcomeEmailContent: 'Obrigado por se inscrever em nossa newsletter. Você receberá as melhores notícias em primeira mão!',
      unsubscribeFooter: 'Você está recebendo este email porque se inscreveu em nossa newsletter. Para cancelar, clique aqui.',
      autoSendEnabled: true,
      autoSendSubject: 'Nova matéria publicada: {{title}}',
      autoSendTemplate: 'Uma nova matéria foi publicada no Portal de Notícias!\n\n**{{title}}**\n\n{{excerpt}}\n\nLeia a matéria completa em: {{url}}',
      autoSendCategories: ['Política', 'Policial', 'Entretenimento', 'Internacional', 'Esportes', 'Tecnologia', 'Ciência / Saúde'],
      dailySendLimit: 1000,
      rateLimitPerHour: 100
    };
  }

  // =============================================
  // STATISTICS
  // =============================================
  
  getStats(): NewsletterStats {
    const subscribers = this.getSubscribers();
    const campaigns = this.getCampaigns();
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');

    // Calcular crescimento dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubscribers = subscribers.filter(s => 
      new Date(s.subscribedAt) >= thirtyDaysAgo && s.status === 'active'
    );

    // Top sources
    const sourceCount: Record<string, number> = {};
    subscribers.forEach(s => {
      sourceCount[s.source] = (sourceCount[s.source] || 0) + 1;
    });

    const topSources = Object.entries(sourceCount)
      .map(([source, count]) => ({ source: source as SubscriptionSource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      unsubscribedCount: subscribers.filter(s => s.status === 'unsubscribed').length,
      totalCampaigns: campaigns.length,
      totalEmailsSent: sentCampaigns.reduce((sum, c) => sum + c.recipientCount, 0),
      averageOpenRate: sentCampaigns.length > 0 
        ? sentCampaigns.reduce((acc, c) => acc + (c.openCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      averageClickRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((acc, c) => acc + (c.clickCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      averageBounceRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((acc, c) => acc + (c.bounceCount / Math.max(c.recipientCount, 1)), 0) / sentCampaigns.length * 100
        : 0,
      recentGrowth: activeSubscribers.length > 0 
        ? (recentSubscribers.length / activeSubscribers.length) * 100 
        : 0,
      topSources,
      topCategories: [] // Implementar se necessário
    };
  }

  // =============================================
  // IMPORT/EXPORT
  // =============================================
  
  exportData(): NewsletterExport {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        subscribers: this.getSubscribers(),
        campaigns: this.getCampaigns(),
        templates: this.getTemplates(),
        settings: this.getSettings()
      }
    };
  }

  importData(exportData: NewsletterExport): boolean {
    try {
      // Validar estrutura dos dados
      if (!exportData.data || !Array.isArray(exportData.data.subscribers)) {
        throw new Error('Dados de importação inválidos');
      }

      // Fazer backup atual
      const backup = this.exportData();
      localStorage.setItem('portal_newsletter_backup', JSON.stringify(backup));

      // Importar dados
      this.saveSubscribers(exportData.data.subscribers);
      this.saveCampaigns(exportData.data.campaigns || []);
      this.saveTemplates(exportData.data.templates || []);
      this.saveSettings(exportData.data.settings || this.getDefaultSettings());

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // =============================================
  // AUTO NEWSLETTER
  // =============================================
  
  async sendAutoNewsletter(article: { title: string; excerpt: string; category: string; id: string }): Promise<boolean> {
    const settings = this.getSettings();
    
    if (!settings.autoSendEnabled) return false;
    if (!settings.autoSendCategories.includes(article.category)) return false;

    const activeSubscribers = this.getActiveSubscribers();
    if (activeSubscribers.length === 0) return false;

    try {
      const subject = settings.autoSendSubject.replace('{{title}}', article.title);
      const content = settings.autoSendTemplate
        .replace('{{title}}', article.title)
        .replace('{{excerpt}}', article.excerpt)
        .replace('{{url}}', `${window.location.origin}/news/${article.id}`);

      const campaignId = this.createCampaign({
        title: `Auto: ${article.title}`,
        subject,
        content,
        htmlContent: content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        status: 'draft',
        tags: ['auto-send', article.category.toLowerCase()]
      });

      // Enviar campanha
      const success = await this.sendCampaign(campaignId);
      
      if (success) {
        console.log(`Auto newsletter sent: "${article.title}" to ${activeSubscribers.length} subscribers`);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending auto newsletter:', error);
      return false;
    }
  }

  // =============================================
  // MIGRATION HELPERS
  // =============================================
  
  // Preparar dados para migração futura para Supabase
  prepareForMigration() {
    return {
      subscribers: this.getSubscribers(),
      campaigns: this.getCampaigns(),
      templates: this.getTemplates(),
      settings: this.getSettings(),
      stats: this.getStats(),
      metadata: {
        migratedAt: new Date().toISOString(),
        totalRecords: this.getSubscribers().length + this.getCampaigns().length + this.getTemplates().length,
        version: '1.0.0'
      }
    };
  }
}

// Singleton instance
export const newsletterService = new NewsletterService();
export default newsletterService;