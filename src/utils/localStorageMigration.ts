import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to migrate localStorage data to Supabase tables
 */

export interface LocalStorageBackup {
  key: string;
  value: any;
  timestamp: string;
}

export const backupLocalStorageToSupabase = async () => {
  try {
    const backupEntries: LocalStorageBackup[] = [];
    
    // Backup all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            backupEntries.push({
              key,
              value: JSON.parse(value),
              timestamp: new Date().toISOString()
            });
          } catch {
            // If not JSON, store as string
            backupEntries.push({
              key,
              value,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    if (backupEntries.length > 0) {
      const { error } = await supabase
        .from('local_storage_backup')
        .insert(backupEntries.map(entry => ({
          storage_key: entry.key,
          storage_value: entry.value,
          migrated_at: entry.timestamp
        })));

      if (error) throw error;
      console.log(`✅ ${backupEntries.length} localStorage items backed up to Supabase`);
    }

    return { success: true, count: backupEntries.length };
  } catch (error) {
    console.error('❌ Erro no backup do localStorage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

export const clearLocalStorageAfterMigration = (keysToKeep: string[] = []) => {
  try {
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    console.log(`🧹 localStorage limpo. Mantidos: ${keysToKeep.join(', ')}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao limpar localStorage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

export const getLocalStorageUsage = () => {
  try {
    let totalSize = 0;
    const items: { key: string; size: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({ key, size });
      }
    }

    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      itemCount: items.length,
      items: items.sort((a, b) => b.size - a.size)
    };
  } catch (error) {
    console.error('❌ Erro ao calcular uso do localStorage:', error);
    return null;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};