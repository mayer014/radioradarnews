import { useCallback, useEffect, useRef } from 'react';

const SESSION_STORAGE_KEY = 'viewed_articles';

/**
 * Hook para gerenciar visualizações únicas por sessão.
 * Evita contagem duplicada quando o mesmo usuário acessa o artigo várias vezes.
 * Usa sessionStorage para manter o registro apenas durante a sessão atual.
 */
export const useUniqueViews = () => {
  const viewedArticlesRef = useRef<Set<string>>(new Set());

  // Carregar artigos visualizados do sessionStorage no início
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        viewedArticlesRef.current = new Set(parsed);
      }
    } catch (error) {
      console.error('Error loading viewed articles from session:', error);
    }
  }, []);

  // Salvar no sessionStorage
  const saveToSession = useCallback((articleIds: string[]) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(articleIds));
    } catch (error) {
      console.error('Error saving viewed articles to session:', error);
    }
  }, []);

  /**
   * Verifica se o artigo já foi visualizado nesta sessão
   */
  const hasBeenViewed = useCallback((articleId: string): boolean => {
    return viewedArticlesRef.current.has(articleId);
  }, []);

  /**
   * Marca o artigo como visualizado e retorna true se é a primeira visualização
   * Retorna false se já foi visualizado antes (não deve incrementar contador)
   */
  const markAsViewed = useCallback((articleId: string): boolean => {
    if (viewedArticlesRef.current.has(articleId)) {
      // Já foi visualizado, não deve incrementar
      return false;
    }

    // Primeira visualização nesta sessão
    viewedArticlesRef.current.add(articleId);
    saveToSession(Array.from(viewedArticlesRef.current));
    return true;
  }, [saveToSession]);

  /**
   * Função combinada: marca como visualizado e retorna se deve incrementar
   */
  const shouldIncrementViews = useCallback((articleId: string): boolean => {
    return markAsViewed(articleId);
  }, [markAsViewed]);

  return {
    hasBeenViewed,
    markAsViewed,
    shouldIncrementViews
  };
};

export default useUniqueViews;
