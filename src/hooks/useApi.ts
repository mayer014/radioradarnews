// Hook para padronizar uso de APIs
// TODO: Implementar quando conectar ao PostgreSQL

import { useState, useCallback } from 'react';
import ApiService, { type ApiResponse } from '@/services/ApiService';
import { useToast } from '@/hooks/use-toast';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const { toast } = useToast();
  const { showErrorToast = true, showSuccessToast = false, successMessage } = options;

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<ApiResponse<R>>
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (response.success && response.data) {
        setState({
          data: response.data as unknown as T,
          loading: false,
          error: null
        });

        if (showSuccessToast) {
          toast({
            title: "Sucesso",
            description: successMessage || "Operação realizada com sucesso",
          });
        }

        return response.data as R;
      } else {
        const errorMsg = response.error || 'Erro desconhecido';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg
        }));

        if (showErrorToast) {
          toast({
            title: "Erro",
            description: errorMsg,
            variant: "destructive",
          });
        }

        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro de conexão';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg
      }));

      if (showErrorToast) {
        toast({
          title: "Erro de Conexão",
          description: errorMsg,
          variant: "destructive",
        });
      }

      return null;
    }
  }, [toast, showErrorToast, showSuccessToast, successMessage]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Hooks específicos para cada entidade
export function useArticlesApi() {
  return {
    getArticles: useApi(),
    createArticle: useApi({ showSuccessToast: true, successMessage: "Artigo criado com sucesso" }),
    updateArticle: useApi({ showSuccessToast: true, successMessage: "Artigo atualizado com sucesso" }),
    deleteArticle: useApi({ showSuccessToast: true, successMessage: "Artigo removido com sucesso" })
  };
}

export function useUsersApi() {
  return {
    getUsers: useApi(),
    createUser: useApi({ showSuccessToast: true, successMessage: "Usuário criado com sucesso" }),
    updateUser: useApi({ showSuccessToast: true, successMessage: "Usuário atualizado com sucesso" }),
    deleteUser: useApi({ showSuccessToast: true, successMessage: "Usuário removido com sucesso" })
  };
}

export function useContactApi() {
  return {
    getMessages: useApi(),
    createMessage: useApi({ showSuccessToast: true, successMessage: "Mensagem enviada com sucesso" }),
    markAsRead: useApi({ showSuccessToast: true, successMessage: "Mensagem marcada como lida" }),
    deleteMessage: useApi({ showSuccessToast: true, successMessage: "Mensagem removida com sucesso" })
  };
}

export function useProgramsApi() {
  return {
    getPrograms: useApi(),
    createProgram: useApi({ showSuccessToast: true, successMessage: "Programa criado com sucesso" }),
    updateProgram: useApi({ showSuccessToast: true, successMessage: "Programa atualizado com sucesso" }),
    deleteProgram: useApi({ showSuccessToast: true, successMessage: "Programa removido com sucesso" })
  };
}

export function useAuthApi() {
  return {
    login: useApi({ showErrorToast: true }),
    logout: useApi({ showSuccessToast: true, successMessage: "Logout realizado com sucesso" })
  };
}