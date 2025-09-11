import { useEffect, useCallback } from 'react';
import { useSupabaseBanner } from '@/contexts/SupabaseBannerContext';
import { useUsers } from '@/contexts/UsersContext';

// Hook para sincronizar banners de colunistas com o status ativo dos usuários
export const useBannerSync = () => {
  const { users } = useUsers();
  const { syncColumnistBannersWithUsers } = useSupabaseBanner();

  const syncBanners = useCallback(() => {
    if (users && users.length > 0) {
      syncColumnistBannersWithUsers(users);
    }
  }, [users, syncColumnistBannersWithUsers]);

  useEffect(() => {
    // Executar sincronização sempre que a lista de usuários mudar
    syncBanners();
  }, [syncBanners]);

  useEffect(() => {
    // Executar sincronização inicial com delay para garantir que contextos estejam carregados
    const timer = setTimeout(syncBanners, 100);
    return () => clearTimeout(timer);
  }, []);
};