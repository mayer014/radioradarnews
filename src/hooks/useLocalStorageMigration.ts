import { useEffect, useState } from 'react';

interface MigrationStatus {
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to handle localStorage migration to Supabase
 * Since we're removing localStorage dependencies, this provides a clean transition
 */
export const useLocalStorageMigration = () => {
  const [status, setStatus] = useState<MigrationStatus>({
    isComplete: true, // Set to true since we're removing localStorage dependencies
    isLoading: false,
    error: null
  });

  const migrateToSupabase = async () => {
    // Migration is now handled directly in components using Supabase
    console.log('LocalStorage migration is handled by individual components');
  };

  const cleanupLocalStorage = () => {
    try {
      // Clean up old localStorage data except essential keys
      const keysToKeep = ['theme']; // Only keep theme preference
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('LocalStorage cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  };

  useEffect(() => {
    // Cleanup localStorage on first load
    cleanupLocalStorage();
  }, []);

  return {
    ...status,
    migrateToSupabase,
    cleanupLocalStorage
  };
};