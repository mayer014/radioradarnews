import React, { createContext, useContext, useState, useEffect } from 'react';

export interface NotificationRule {
  id: string;
  name: string;
  trigger: 'new_article' | 'featured_article' | 'manual' | 'scheduled';
  category?: string;
  title: string;
  message: string;
  icon?: string;
  url?: string;
  enabled: boolean;
  createdAt: string;
}

export interface SentNotification {
  id: string;
  ruleId?: string;
  title: string;
  message: string;
  sentAt: string;
  recipientCount: number;
  clickCount: number;
  type: 'manual' | 'automatic';
}

export interface NotificationSettings {
  enabled: boolean;
  oneSignalAppId?: string;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  defaultIcon: string;
  defaultUrl: string;
  subscriptionPromptEnabled: boolean;
  subscriptionPromptDelay: number; // em segundos
}

interface NotificationsContextType {
  rules: NotificationRule[];
  sentNotifications: SentNotification[];
  settings: NotificationSettings;
  isSupported: boolean;
  isSubscribed: boolean;
  
  // Rules
  createRule: (rule: Omit<NotificationRule, 'id' | 'createdAt'>) => void;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  deleteRule: (id: string) => void;
  
  // Notifications
  sendManualNotification: (title: string, message: string, url?: string) => Promise<boolean>;
  triggerAutomaticNotification: (trigger: NotificationRule['trigger'], data?: any) => Promise<void>;
  
  // Settings
  updateSettings: (newSettings: NotificationSettings) => void;
  
  // Subscription
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  
  // Stats
  getStats: () => {
    totalRules: number;
    activeRules: number;
    totalSent: number;
    averageClickRate: number;
  };
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const defaultSettings: NotificationSettings = {
  enabled: true,
  defaultIcon: '/icon-192.png',
  defaultUrl: '/',
  subscriptionPromptEnabled: true,
  subscriptionPromptDelay: 30
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Verificar suporte a notificações
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  // Verificar status da subscrição
  useEffect(() => {
    if (isSupported) {
      checkSubscriptionStatus();
    }
  }, [isSupported]);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem('portal_notification_rules');
      const savedNotifications = localStorage.getItem('portal_sent_notifications');
      const savedSettings = localStorage.getItem('portal_notification_settings');
      
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      }
      
      if (savedNotifications) {
        setSentNotifications(JSON.parse(savedNotifications));
      }
      
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading notification data from localStorage:', error);
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('portal_notification_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('portal_sent_notifications', JSON.stringify(sentNotifications));
  }, [sentNotifications]);

  useEffect(() => {
    localStorage.setItem('portal_notification_settings', JSON.stringify(settings));
  }, [settings]);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;

      const registration = await navigator.serviceWorker.ready;
      
      // Para usar push notifications reais, seria necessário configurar VAPID keys
      // Por enquanto, apenas marcamos como subscrito
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      return false;
    }
  };

  const createRule = (ruleData: Omit<NotificationRule, 'id' | 'createdAt'>) => {
    const newRule: NotificationRule = {
      ...ruleData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    setRules(prev => [newRule, ...prev]);
  };

  const updateRule = (id: string, updates: Partial<NotificationRule>) => {
    setRules(prev => 
      prev.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
    );
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  const sendManualNotification = async (title: string, message: string, url?: string): Promise<boolean> => {
    if (!isSupported || !settings.enabled) return false;

    try {
      // Para desenvolvimento, usar notification local
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: settings.defaultIcon,
          tag: 'manual-notification',
          requireInteraction: false
        });

        notification.onclick = () => {
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notification.close();
        };

        // Registrar notificação enviada
        const sentNotification: SentNotification = {
          id: crypto.randomUUID(),
          title,
          message,
          sentAt: new Date().toISOString(),
          recipientCount: 1, // Simulado
          clickCount: 0,
          type: 'manual'
        };

        setSentNotifications(prev => [sentNotification, ...prev]);
        return true;
      }
    } catch (error) {
      console.error('Error sending manual notification:', error);
    }

    return false;
  };

  const triggerAutomaticNotification = async (trigger: NotificationRule['trigger'], data?: any) => {
    if (!settings.enabled) return;

    const activeRules = rules.filter(rule => rule.enabled && rule.trigger === trigger);

    for (const rule of activeRules) {
      try {
        let title = rule.title;
        let message = rule.message;
        
        // Substituir variáveis na mensagem se houver dados
        if (data) {
          title = title.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
          message = message.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
        }

        await sendManualNotification(title, message, rule.url);

        // Registrar como automática
        const sentNotification: SentNotification = {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          title,
          message,
          sentAt: new Date().toISOString(),
          recipientCount: 1, // Simulado
          clickCount: 0,
          type: 'automatic'
        };

        setSentNotifications(prev => [sentNotification, ...prev]);
      } catch (error) {
        console.error(`Error triggering automatic notification for rule ${rule.id}:`, error);
      }
    }
  };

  const updateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
  };

  const getStats = () => {
    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.enabled).length,
      totalSent: sentNotifications.length,
      averageClickRate: sentNotifications.length > 0
        ? sentNotifications.reduce((acc, n) => acc + (n.clickCount / Math.max(n.recipientCount, 1)), 0) / sentNotifications.length * 100
        : 0
    };
  };

  return (
    <NotificationsContext.Provider value={{
      rules,
      sentNotifications,
      settings,
      isSupported,
      isSubscribed,
      createRule,
      updateRule,
      deleteRule,
      sendManualNotification,
      triggerAutomaticNotification,
      updateSettings,
      requestPermission,
      subscribe,
      unsubscribe,
      getStats
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};