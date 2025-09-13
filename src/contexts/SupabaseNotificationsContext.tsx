import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface NotificationRule {
  id: string;
  rule_name: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseNotificationsContextType {
  notifications: Notification[];
  rules: NotificationRule[];
  loading: boolean;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<{ error: string | null }>;
  markAsRead: (id: string) => Promise<{ error: string | null }>;
  markAllAsRead: () => Promise<{ error: string | null }>;
  deleteNotification: (id: string) => Promise<{ error: string | null }>;
  addRule: (rule: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateRule: (id: string, updates: Partial<NotificationRule>) => Promise<{ error: string | null }>;
  deleteRule: (id: string) => Promise<{ error: string | null }>;
  refreshNotifications: () => Promise<void>;
  refreshRules: () => Promise<void>;
}

const SupabaseNotificationsContext = createContext<SupabaseNotificationsContextType | undefined>(undefined);

export const SupabaseNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []).map(item => ({
        ...item,
        type: item.type as 'info' | 'success' | 'warning' | 'error'
      })));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []).map(item => ({
        ...item,
        conditions: item.conditions as Record<string, any>,
        actions: item.actions as Record<string, any>
      })));
    } catch (error) {
      console.error('Erro ao buscar regras de notificação:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotifications(), fetchRules()]);
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    const rulesChannel = supabase
      .channel('notification_rules_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notification_rules'
      }, () => {
        fetchRules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(rulesChannel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao adicionar notificação:', error);
      return { error: error.message || 'Erro ao adicionar notificação' };
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error);
      return { error: error.message || 'Erro ao marcar como lida' };
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao marcar todas como lidas:', error);
      return { error: error.message || 'Erro ao marcar todas como lidas' };
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error);
      return { error: error.message || 'Erro ao deletar notificação' };
    }
  };

  const addRule = async (rule: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .insert([rule]);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao adicionar regra:', error);
      return { error: error.message || 'Erro ao adicionar regra' };
    }
  };

  const updateRule = async (id: string, updates: Partial<NotificationRule>) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar regra:', error);
      return { error: error.message || 'Erro ao atualizar regra' };
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao deletar regra:', error);
      return { error: error.message || 'Erro ao deletar regra' };
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const refreshRules = async () => {
    await fetchRules();
  };

  const value: SupabaseNotificationsContextType = {
    notifications,
    rules,
    loading,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addRule,
    updateRule,
    deleteRule,
    refreshNotifications,
    refreshRules
  };

  return (
    <SupabaseNotificationsContext.Provider value={value}>
      {children}
    </SupabaseNotificationsContext.Provider>
  );
};

export const useSupabaseNotifications = () => {
  const context = useContext(SupabaseNotificationsContext);
  if (context === undefined) {
    throw new Error('useSupabaseNotifications must be used within a SupabaseNotificationsProvider');
  }
  return context;
};