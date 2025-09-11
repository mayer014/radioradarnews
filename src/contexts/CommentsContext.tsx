import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  ip?: string;
  parentId?: string; // Para respostas
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

interface CommentsContextType {
  comments: Comment[];
  settings: CommentSettings;
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'status'>) => void;
  updateCommentStatus: (id: string, status: Comment['status']) => void;
  deleteComment: (id: string) => void;
  getCommentsByArticle: (articleId: string) => Comment[];
  getApprovedCommentsByArticle: (articleId: string) => Comment[];
  getPendingComments: () => Comment[];
  updateSettings: (newSettings: CommentSettings) => void;
  getCommentStats: () => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

const defaultSettings: CommentSettings = {
  moderationRequired: true,
  allowReplies: true,
  maxLength: 500,
  blockedEmails: [],
  blockedIPs: [],
  autoApproveKeywords: [],
  autoRejectKeywords: ['spam', 'fake', 'bot']
};

export const CommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [settings, setSettings] = useState<CommentSettings>(defaultSettings);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    try {
      const savedComments = localStorage.getItem('portal_comments');
      const savedSettings = localStorage.getItem('portal_comment_settings');
      
      if (savedComments) {
        setComments(JSON.parse(savedComments));
      }
      
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
    }
  }, []);

  // Salvar comentários no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('portal_comments', JSON.stringify(comments));
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
    }
  }, [comments]);

  // Salvar configurações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('portal_comment_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving comment settings to localStorage:', error);
    }
  }, [settings]);

  const addComment = (commentData: Omit<Comment, 'id' | 'createdAt' | 'status'>) => {
    const newComment: Comment = {
      ...commentData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: determineInitialStatus(commentData, settings)
    };

    setComments(prev => [newComment, ...prev]);
  };

  const updateCommentStatus = (id: string, status: Comment['status']) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === id ? { ...comment, status } : comment
      )
    );
  };

  const deleteComment = (id: string) => {
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  const getCommentsByArticle = (articleId: string) => {
    return comments.filter(comment => comment.articleId === articleId);
  };

  const getApprovedCommentsByArticle = (articleId: string) => {
    return comments.filter(comment => 
      comment.articleId === articleId && comment.status === 'approved'
    );
  };

  const getPendingComments = () => {
    return comments.filter(comment => comment.status === 'pending');
  };

  const updateSettings = (newSettings: CommentSettings) => {
    setSettings(newSettings);
  };

  const getCommentStats = () => {
    return {
      total: comments.length,
      pending: comments.filter(c => c.status === 'pending').length,
      approved: comments.filter(c => c.status === 'approved').length,
      rejected: comments.filter(c => c.status === 'rejected').length
    };
  };

  return (
    <CommentsContext.Provider value={{
      comments,
      settings,
      addComment,
      updateCommentStatus,
      deleteComment,
      getCommentsByArticle,
      getApprovedCommentsByArticle,
      getPendingComments,
      updateSettings,
      getCommentStats
    }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};

// Função para determinar status inicial do comentário
function determineInitialStatus(
  comment: Omit<Comment, 'id' | 'createdAt' | 'status'>, 
  settings: CommentSettings
): Comment['status'] {
  // Verificar se está na lista de bloqueados
  if (settings.blockedEmails.includes(comment.email.toLowerCase()) ||
      (comment.ip && settings.blockedIPs.includes(comment.ip))) {
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