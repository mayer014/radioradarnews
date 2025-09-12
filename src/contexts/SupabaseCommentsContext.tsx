import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  article_id: string;
  name: string;
  email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  ip_address?: string;
  parent_id?: string; // Para respostas
}

export interface CommentSettings {
  moderationRequired: boolean;
  allowReplies: boolean;
  maxLength: number;
  blockedEmails: string[];
  blockedIPs: string[];
  autoApproveKeywords: string[];
  autoRejectKeywords: string[];
}

interface SupabaseCommentsContextType {
  comments: Comment[];
  settings: CommentSettings;
  loading: boolean;
  addComment: (comment: Omit<Comment, 'id' | 'created_at' | 'status'>) => Promise<{ error: string | null }>;
  updateCommentStatus: (id: string, status: Comment['status']) => Promise<{ error: string | null }>;
  deleteComment: (id: string) => Promise<{ error: string | null }>;
  getCommentsByArticle: (articleId: string) => Comment[];
  getApprovedCommentsByArticle: (articleId: string) => Comment[];
  getPendingComments: () => Comment[];
  updateSettings: (newSettings: CommentSettings) => Promise<{ error: string | null }>;
  getCommentStats: () => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  refreshComments: () => Promise<void>;
}

const SupabaseCommentsContext = createContext<SupabaseCommentsContextType | undefined>(undefined);

const defaultSettings: CommentSettings = {
  moderationRequired: true,
  allowReplies: true,
  maxLength: 500,
  blockedEmails: [],
  blockedIPs: [],
  autoApproveKeywords: [],
  autoRejectKeywords: ['spam', 'fake', 'bot']
};

export const SupabaseCommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [settings, setSettings] = useState<CommentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para carregar comentários
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      const mappedComments = (data || []).map(comment => ({
        ...comment,
        ip_address: comment.ip_address as string | undefined
      }));
      setComments(mappedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar configurações
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'comments')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching comment settings:', error);
        return;
      }

      if (data && data.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const v = data.value as Partial<CommentSettings>;
        setSettings({ ...defaultSettings, ...v });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching comment settings:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchComments();
    fetchSettings();
  }, []);

  // Configurar real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('Comment change:', payload);
          fetchComments(); // Recarregar comentários quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addComment = async (commentData: Omit<Comment, 'id' | 'created_at' | 'status'>): Promise<{ error: string | null }> => {
    try {
      const initialStatus = determineInitialStatus(commentData, settings);
      
      const { error } = await supabase
        .from('comments')
        .insert({
          article_id: commentData.article_id,
          name: commentData.name,
          email: commentData.email,
          content: commentData.content,
          status: initialStatus,
          ip_address: commentData.ip_address || null,
          parent_id: commentData.parent_id || null
        });

      if (error) {
        console.error('Error adding comment:', error);
        return { error: 'Erro ao adicionar comentário' };
      }

      toast({
        title: "Comentário enviado",
        description: initialStatus === 'approved' ? "Seu comentário foi publicado!" : "Seu comentário está aguardando moderação.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { error: 'Erro ao adicionar comentário' };
    }
  };

  const updateCommentStatus = async (id: string, status: Comment['status']): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error updating comment status:', error);
        return { error: 'Erro ao atualizar status do comentário' };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating comment status:', error);
      return { error: 'Erro ao atualizar status do comentário' };
    }
  };

  const deleteComment = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting comment:', error);
        return { error: 'Erro ao deletar comentário' };
      }

      toast({
        title: "Comentário deletado",
        description: "O comentário foi removido com sucesso.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { error: 'Erro ao deletar comentário' };
    }
  };

  const getCommentsByArticle = (articleId: string) => {
    return comments.filter(comment => comment.article_id === articleId);
  };

  const getApprovedCommentsByArticle = (articleId: string) => {
    return comments.filter(comment => 
      comment.article_id === articleId && comment.status === 'approved'
    );
  };

  const getPendingComments = () => {
    return comments.filter(comment => comment.status === 'pending');
  };

  const updateSettings = async (newSettings: CommentSettings): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          category: 'comments',
          key: 'comment_settings',
          value: newSettings as any
        });

      if (error) {
        console.error('Error updating comment settings:', error);
        return { error: 'Erro ao atualizar configurações' };
      }

      setSettings(newSettings);
      
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de comentários foram salvas.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating comment settings:', error);
      return { error: 'Erro ao atualizar configurações' };
    }
  };

  const getCommentStats = () => {
    return {
      total: comments.length,
      pending: comments.filter(c => c.status === 'pending').length,
      approved: comments.filter(c => c.status === 'approved').length,
      rejected: comments.filter(c => c.status === 'rejected').length
    };
  };

  const refreshComments = async () => {
    await fetchComments();
  };

  return (
    <SupabaseCommentsContext.Provider value={{
      comments,
      settings,
      loading,
      addComment,
      updateCommentStatus,
      deleteComment,
      getCommentsByArticle,
      getApprovedCommentsByArticle,
      getPendingComments,
      updateSettings,
      getCommentStats,
      refreshComments
    }}>
      {children}
    </SupabaseCommentsContext.Provider>
  );
};

export const useSupabaseComments = () => {
  const context = useContext(SupabaseCommentsContext);
  if (context === undefined) {
    throw new Error('useSupabaseComments must be used within a SupabaseCommentsProvider');
  }
  return context;
};

// Função para determinar status inicial do comentário
function determineInitialStatus(
  comment: Omit<Comment, 'id' | 'created_at' | 'status'>, 
  settings: CommentSettings
): Comment['status'] {
  // Verificar se está na lista de bloqueados
  if (settings.blockedEmails.includes(comment.email.toLowerCase()) ||
      (comment.ip_address && settings.blockedIPs.includes(comment.ip_address))) {
    return 'rejected';
  }

  // Verificar palavras para rejeição automática
  const content = comment.content.toLowerCase();
  if (settings.autoRejectKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
    return 'rejected';
  }

  // Verificar palavras para aprovação automática
  if (!settings.moderationRequired || 
      settings.autoApproveKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
    return 'approved';
  }

  // Por padrão, requer moderação
  return 'pending';
}