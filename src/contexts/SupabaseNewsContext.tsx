import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

// Add missing properties to the interface
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featured_image?: string;
  source_url?: string;
  source_domain?: string;
  views: number;
  comments_count: number;
  featured: boolean;
  status: 'draft' | 'published';
  is_column_copy: boolean;
  original_article_id?: string;
  
  // Autor
  author_id?: string;
  
  // Dados do colunista
  columnist_id?: string;
  columnist_name?: string;
  columnist_avatar?: string;
  columnist_bio?: string;
  columnist_specialty?: string;
  
  // Profile data from JOIN
  profiles?: any;
  _profile_updated_at?: string;
  
  created_at: string;
  updated_at: string;
}

export const BASE_NEWS_CATEGORIES = [
  'Política',
  'Policial',
  'Entretenimento',
  'Internacional',
  'Esportes',
  'Tecnologia / Economia',
  'Ciência / Saúde'
];

interface NewsContextType {
  articles: NewsArticle[];
  loading: boolean;
  addArticle: (article: Omit<NewsArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'comments_count'>) => Promise<{ error?: string }>;
  updateArticle: (id: string, updates: Partial<NewsArticle>) => Promise<{ error?: string }>;
  deleteArticle: (id: string) => Promise<{ error?: string }>;
  getArticleById: (id: string) => NewsArticle | undefined;
  getArticlesByCategory: (category: string) => NewsArticle[];
  getArticlesByColumnist: (columnistId: string) => NewsArticle[];
  incrementViews: (id: string) => Promise<void>;
  toggleFeaturedArticle: (id: string) => Promise<{ error?: string }>;
  refreshArticles: () => Promise<void>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const SupabaseNewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('articles')
        .select(`
          *,
          profiles_public!articles_author_id_fkey(
            id,
            name,
            avatar,
            bio,
            specialty,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      // Se não for admin, mostrar apenas artigos publicados e próprios artigos
      if (profile?.role !== 'admin') {
        if (profile?.id) {
          query = query.or(`status.eq.published,author_id.eq.${profile.id}`);
        } else {
          query = query.eq('status', 'published');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar artigos",
          variant: "destructive",
        });
        return;
      }

      // Collect unique IDs to check roles (both author_id and columnist_id from DB)
      const articleAuthorIds = [...new Set((data || []).map(a => a.author_id).filter(Boolean))];
      const articleColumnistIds = [...new Set((data || []).map(a => a.columnist_id).filter(Boolean))];
      const allUserIds = [...new Set([...articleAuthorIds, ...articleColumnistIds])];
      
      // Fetch roles for these users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', allUserIds);
      
      // Create a Set of columnist IDs
      const columnistIds = new Set(
        (rolesData || [])
          .filter(r => r.role === 'colunista')
          .map(r => r.user_id)
      );

      // Enrich articles with fresh profile data for columnists
      const enrichedArticles = (data || []).map(article => {
        // CRITICAL: If columnist_id exists in DB, it's ALWAYS a columnist article
        // We check role only to enrich data, not to determine if it's a columnist article
        const hasColumnistIdInDb = !!article.columnist_id;
        const authorIsColumnist = article.author_id && columnistIds.has(article.author_id);
        const isColumnistArticle = hasColumnistIdInDb || authorIsColumnist;
        
        if (isColumnistArticle) {
          // Determine which ID to use for fetching profile
          const columnistUserId = article.columnist_id || article.author_id;
          
          // Try to get profile from profiles_public join
          const hasProfile = article.profiles_public;
          
          if (hasProfile) {
            const profile = Array.isArray(article.profiles_public) ? article.profiles_public[0] : article.profiles_public;
            if (profile && profile.is_active !== false) {
              return {
                ...article,
                // Keep columnist_id if it exists, otherwise use author_id
                columnist_id: columnistUserId,
                columnist_name: profile.name,
                columnist_avatar: profile.avatar,
                columnist_bio: profile.bio,
                columnist_specialty: profile.specialty,
                _profile_updated_at: new Date().toISOString()
              };
            }
          }
          
          // If no profile data but columnist_id exists in DB, keep all existing columnist data
          if (article.columnist_id) {
            return article;
          }
          
          // If author_id is columnist but no columnist_id, set it
          if (authorIsColumnist && !article.columnist_id) {
            return {
              ...article,
              columnist_id: article.author_id
            };
          }
        }
        
        // Not a columnist article - clear columnist fields ONLY if columnist_id is not set
        if (!article.columnist_id) {
          return {
            ...article,
            columnist_id: undefined,
            columnist_name: undefined,
            columnist_avatar: undefined,
            columnist_bio: undefined,
            columnist_specialty: undefined
          };
        }
        
        // Has columnist_id, keep the article as is
        return article;
      });

      setArticles(enrichedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.role, profile?.id, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Configurar real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('articles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles'
        },
        (payload) => {
          console.log('Real-time article change:', payload);
          
          // Atualização otimizada baseada no tipo de evento
          if (payload.eventType === 'INSERT') {
            const newArticle = payload.new as NewsArticle;
            
            // Verificar se o usuário tem permissão para ver este artigo
            const shouldShow = profile?.role === 'admin' || 
                              newArticle.status === 'published' || 
                              newArticle.author_id === profile?.id;
            
            if (shouldShow) {
              setArticles(prev => {
                // Evitar duplicatas
                const exists = prev.some(a => a.id === newArticle.id);
                if (exists) return prev;
                
                // Adicionar e ordenar por data
                return [newArticle, ...prev].sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedArticle = payload.new as NewsArticle;
            
            setArticles(prev => prev
              .map(article => {
                if (article.id !== updatedArticle.id) return article;
              // Mesclar campos mantendo os enriquecimentos de perfil quando o payload não os trouxer
              const merged: NewsArticle = { ...article, ...updatedArticle } as NewsArticle;
              if ((updatedArticle as any).profiles_public === undefined && (article as any).profiles_public) {
                (merged as any).profiles_public = (article as any).profiles_public;
              }
              if (updatedArticle.columnist_name === undefined && article.columnist_name) merged.columnist_name = article.columnist_name;
              if (updatedArticle.columnist_avatar === undefined && article.columnist_avatar) merged.columnist_avatar = article.columnist_avatar;
              if (updatedArticle.columnist_bio === undefined && article.columnist_bio) merged.columnist_bio = article.columnist_bio;
              if (updatedArticle.columnist_specialty === undefined && article.columnist_specialty) merged.columnist_specialty = article.columnist_specialty;
              if (updatedArticle._profile_updated_at === undefined && article._profile_updated_at) merged._profile_updated_at = article._profile_updated_at;
                return merged;
              })
              .sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setArticles(prev => prev.filter(a => a.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role, profile?.id]);

  // Refresh periódica para refletir mudanças de avatar/bio dos colunistas em até 1 minuto
  useEffect(() => {
    const interval = setInterval(() => {
      fetchArticles();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  // Função auxiliar para disparar publicação automática em redes sociais
  const triggerSocialMediaPublish = async (article: NewsArticle) => {
    try {
      // Só dispara se o artigo está publicado e tem imagem
      if (article.status !== 'published' || !article.featured_image) {
        console.log('⏭️ Social Media: Artigo não elegível para publicação automática');
        return;
      }

      const isColumnist = !!article.columnist_id;
      const articleUrl = isColumnist 
        ? `https://radioradar.news/colunista/${article.columnist_id}/artigo/${article.id}`
        : `https://radioradar.news/artigo/${article.id}`;

      console.log('📤 Disparando publicação automática em redes sociais...');

      // Fire and forget - não bloqueia o usuário
      supabase.functions.invoke('social-media-publisher', {
        body: {
          article_id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          featured_image: article.featured_image,
          article_url: articleUrl,
          is_columnist: isColumnist,
          columnist: isColumnist ? {
            id: article.columnist_id,
            name: article.columnist_name,
            specialty: article.columnist_specialty,
            bio: article.columnist_bio,
            avatar: article.columnist_avatar
          } : undefined
        }
      }).then(result => {
        if (result.error) {
          console.error('❌ Erro na publicação automática:', result.error);
        } else {
          console.log('✅ Publicação automática iniciada:', result.data);
        }
      }).catch(err => {
        console.error('❌ Erro ao chamar social-media-publisher:', err);
      });
    } catch (error) {
      console.error('❌ Erro no trigger de redes sociais:', error);
    }
  };

  const addArticle = async (articleData: Omit<NewsArticle, 'id' | 'created_at' | 'updated_at' | 'views' | 'comments_count'>) => {
    if (!profile) {
      return { error: 'Usuário não autenticado' };
    }

    try {
      const { data: insertedData, error } = await supabase
        .from('articles')
        .insert([{
          ...articleData,
          // Se author_id já foi fornecido (admin criando para colunista), usar ele
          // Caso contrário, usar o ID do usuário logado
          author_id: (articleData as any).author_id || profile.id,
          views: 0,
          comments_count: 0
        }])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      toast({
        title: "Sucesso",
        description: "Artigo criado com sucesso",
      });

      // Disparar publicação automática em redes sociais se for publicado
      if (insertedData && articleData.status === 'published') {
        triggerSocialMediaPublish(insertedData as NewsArticle);
      }

      return {};
    } catch (error) {
      console.error('Error adding article:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const updateArticle = async (id: string, updates: Partial<NewsArticle>) => {
    try {
      // Buscar o artigo atual para verificar se está mudando para 'published'
      const currentArticle = articles.find(a => a.id === id);
      const wasPublished = currentArticle?.status === 'published';
      const willBePublished = updates.status === 'published';
      const isNewlyPublished = !wasPublished && willBePublished;

      const { data: updatedData, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Atualização otimista do estado local para refletir imediatamente na UI
      setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));

      toast({
        title: "Sucesso",
        description: "Artigo atualizado com sucesso",
      });

      // Disparar publicação automática em redes sociais se for RECÉM publicado
      if (isNewlyPublished && updatedData) {
        // Mesclar com dados do artigo atual (que pode ter dados de colunista)
        const fullArticle = { ...currentArticle, ...updatedData } as NewsArticle;
        triggerSocialMediaPublish(fullArticle);
      }

      return {};
    } catch (error) {
      console.error('Error updating article:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      // Primeiro remover da UI para feedback imediato
      setArticles(prev => prev.filter(a => a.id !== id));

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) {
        // Se houver erro, restaurar o artigo na UI
        fetchArticles();
        toast({
          title: "Erro",
          description: `Erro ao remover artigo: ${error.message}`,
          variant: "destructive",
        });
        return { error: error.message };
      }

      toast({
        title: "Sucesso",
        description: "Artigo removido com sucesso",
      });

      return {};
    } catch (error) {
      console.error('Error deleting article:', error);
      // Restaurar artigos em caso de erro
      fetchArticles();
      toast({
        title: "Erro",
        description: "Erro de conexão ao remover artigo",
        variant: "destructive",
      });
      return { error: 'Erro de conexão' };
    }
  };

  const getArticleById = (id: string) => {
    return articles.find(article => article.id === id);
  };

  const getArticlesByCategory = (category: string) => {
    return articles.filter(article => article.category === category && article.status === 'published');
  };

  const getArticlesByColumnist = (columnistId: string) => {
    return articles.filter(article => {
      // Buscar artigos onde o author_id corresponde ao columnistId
      // ou onde o columnist_id corresponde (para compatibilidade com dados antigos)
      const isAuthor = article.author_id === columnistId;
      const isColumnistId = article.columnist_id === columnistId;
      const isPublished = article.status === 'published';
      
      console.log(`Filtering article ${article.id}: author_id=${article.author_id}, columnist_id=${article.columnist_id}, status=${article.status}, columnistId=${columnistId}`);
      
      return (isAuthor || isColumnistId) && isPublished;
    });
  };

  const incrementViews = async (id: string) => {
    try {
      // Buscar o artigo atual para pegar o número de views
      const { data: currentArticle, error: fetchError } = await supabase
        .from('articles')
        .select('views')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current views:', fetchError);
        return;
      }

      // Incrementar views
      const { error } = await supabase
        .from('articles')
        .update({ views: (currentArticle.views || 0) + 1 })
        .eq('id', id);
      
      if (error) {
        console.error('Error incrementing views:', error);
        return;
      }

      // Atualizar estado local
      setArticles(prev => 
        prev.map(article => 
          article.id === id 
            ? { ...article, views: article.views + 1 }
            : article
        )
      );
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const toggleFeaturedArticle = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return { error: 'Artigo não encontrado' };

    const targetStatus = !article.featured;

    try {
      // Atualizar o artigo alvo - o trigger do banco garantirá exclusividade
      const { error } = await supabase
        .from('articles')
        .update({ featured: targetStatus })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      // Atualização otimista: se definindo como destaque, remover destaque dos outros na mesma categoria
      if (targetStatus) {
        setArticles(prev => prev.map(a => 
          a.category === article.category 
            ? { ...a, featured: a.id === id } 
            : a
        ));
      } else {
        // Se removendo destaque, apenas atualizar o artigo específico
        setArticles(prev => prev.map(a => 
          a.id === id ? { ...a, featured: false } : a
        ));
      }

      toast({
        title: 'Sucesso',
        description: targetStatus ? 'Artigo marcado como destaque' : 'Destaque removido',
      });

      return {};
    } catch (e) {
      console.error('Error toggling featured:', e);
      return { error: 'Erro de conexão' };
    }
  };

  const refreshArticles = async () => {
    await fetchArticles();
  };

  const value: NewsContextType = {
    articles,
    loading,
    addArticle,
    updateArticle,
    deleteArticle,
    getArticleById,
    getArticlesByCategory,
    getArticlesByColumnist,
    incrementViews,
    toggleFeaturedArticle,
    refreshArticles
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};

export const useSupabaseNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useSupabaseNews must be used within a SupabaseNewsProvider');
  }
  return context;
};