// Tipos robustos para o sistema de newsletter
// Preparados para migração futura para banco de dados

export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced' | 'pending';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type SubscriptionSource = 'homepage' | 'article' | 'footer' | 'manual' | 'import' | 'popup';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: SubscriberStatus;
  subscribedAt: string;
  updatedAt?: string;
  unsubscribedAt?: string;
  source: SubscriptionSource;
  tags: string[];
  metadata?: Record<string, any>; // Para dados extras futuros
  // Campos para migração futura
  ipAddress?: string;
  userAgent?: string;
  confirmationToken?: string;
  lastEmailSent?: string;
}

export interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  htmlContent: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  tags: string[];
  // Campos para migração futura
  templateId?: string;
  segmentFilters?: any[];
  abTestVariant?: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  content: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  // Campos para migração futura
  category?: string;
  previewText?: string;
}

export interface NewsletterSettings {
  // Configurações básicas
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  
  // Configurações de formulário
  subscriptionFormEnabled: boolean;
  doubleOptIn: boolean;
  
  // Configurações de email de boas-vindas
  welcomeEmailEnabled: boolean;
  welcomeEmailSubject: string;
  welcomeEmailContent: string;
  
  // Configurações de rodapé
  unsubscribeFooter: string;
  companyAddress?: string;
  
  // Configurações de envio automático
  autoSendEnabled: boolean;
  autoSendSubject: string;
  autoSendTemplate: string;
  autoSendCategories: string[];
  autoSendDelay?: number; // minutos para aguardar antes do envio
  
  // Configurações para migração futura
  smtpSettings?: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    // password será armazenado como secret no Supabase
  };
  
  // Configurações de domínio personalizado
  customDomain?: string;
  trackingEnabled?: boolean;
  
  // Limites e throttling
  dailySendLimit?: number;
  rateLimitPerHour?: number;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageBounceRate: number;
  recentGrowth: number; // % de crescimento nos últimos 30 dias
  topSources: Array<{ source: SubscriptionSource; count: number }>;
  topCategories: Array<{ category: string; openRate: number }>;
}

// Interface para exportação/importação
export interface NewsletterExport {
  version: string;
  exportedAt: string;
  data: {
    subscribers: Subscriber[];
    campaigns: Campaign[];
    templates: NewsletterTemplate[];
    settings: NewsletterSettings;
  };
}

// Interfaces para eventos de webhook (futura integração)
export interface WebhookEvent {
  id: string;
  type: 'subscribe' | 'unsubscribe' | 'bounce' | 'open' | 'click';
  subscriberId: string;
  campaignId?: string;
  timestamp: string;
  data?: Record<string, any>;
}

// Interface para filtros de segmentação
export interface SubscriberFilter {
  field: keyof Subscriber;
  operator: 'equals' | 'contains' | 'startsWith' | 'in' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface SubscriberSegment {
  id: string;
  name: string;
  description?: string;
  filters: SubscriberFilter[];
  createdAt: string;
  subscriberCount?: number;
}