import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, ColumnistProfile } from '@/contexts/UsersContext';
import { BASE_NEWS_CATEGORIES } from '@/contexts/NewsContext';

export interface SupabaseProfile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'colunista';
  is_active: boolean;
  bio?: string;
  specialty?: string;
  allowed_categories?: string[];
  avatar?: string;
}

/**
 * Migra usuários do Supabase para o localStorage
 */
export const migrateSupabaseUsersToLocal = async (): Promise<User[]> => {
  try {
    console.log('🔄 Iniciando migração de usuários do Supabase...');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('❌ Erro ao buscar profiles do Supabase:', error);
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado no Supabase');
      return [];
    }

    const migratedUsers: User[] = profiles.map((profile: SupabaseProfile) => {
      const user: User = {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        password: 'migrated123', // Senha temporária para usuários migrados
        role: profile.role as UserRole,
      };

      // Se for colunista, criar o perfil
      if (profile.role === 'colunista') {
        user.columnistProfile = {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face`,
          bio: profile.bio || 'Colunista migrado do sistema anterior.',
          specialty: profile.specialty || 'Colunista',
          allowedCategories: profile.allowed_categories?.length ? profile.allowed_categories : [BASE_NEWS_CATEGORIES[0]],
          isActive: profile.is_active ?? true,
        };
      }

      return user;
    });

    console.log(`✅ ${migratedUsers.length} usuários migrados com sucesso`);
    return migratedUsers;
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return [];
  }
};

/**
 * Valida a estrutura de dados dos usuários
 */
export const validateUsersData = (users: User[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(users)) {
    errors.push('Dados de usuários deve ser um array');
    return { isValid: false, errors };
  }

  users.forEach((user, index) => {
    if (!user.id) errors.push(`Usuário ${index}: ID é obrigatório`);
    if (!user.name) errors.push(`Usuário ${index}: Nome é obrigatório`);
    if (!user.username) errors.push(`Usuário ${index}: Username é obrigatório`);
    if (!user.role || !['admin', 'colunista'].includes(user.role)) {
      errors.push(`Usuário ${index}: Role deve ser 'admin' ou 'colunista'`);
    }

    if (user.role === 'colunista') {
      if (!user.columnistProfile) {
        errors.push(`Usuário ${index}: Colunista deve ter columnistProfile`);
      } else {
        const profile = user.columnistProfile;
        if (!profile.name) errors.push(`Usuário ${index}: ColumnistProfile deve ter nome`);
        if (!profile.allowedCategories || !Array.isArray(profile.allowedCategories)) {
          errors.push(`Usuário ${index}: ColumnistProfile deve ter allowedCategories como array`);
        }
      }
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Cria backup dos dados dos usuários
 */
export const createUsersBackup = (users: User[]): string => {
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    users: users,
    metadata: {
      totalUsers: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      columnists: users.filter(u => u.role === 'colunista').length,
    }
  };

  return JSON.stringify(backup, null, 2);
};

/**
 * Restaura backup dos usuários
 */
export const restoreUsersFromBackup = (backupData: string): User[] => {
  try {
    const backup = JSON.parse(backupData);
    
    if (!backup.users || !Array.isArray(backup.users)) {
      throw new Error('Formato de backup inválido');
    }

    const validation = validateUsersData(backup.users);
    if (!validation.isValid) {
      throw new Error(`Backup inválido: ${validation.errors.join(', ')}`);
    }

    return backup.users;
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    throw new Error('Não foi possível restaurar o backup');
  }
};

/**
 * Exporta usuários para download
 */
export const exportUsersData = (users: User[]): void => {
  const backup = createUsersBackup(users);
  const blob = new Blob([backup], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Mescla usuários locais com migrados, evitando duplicatas
 */
export const mergeUsers = (localUsers: User[], migratedUsers: User[]): User[] => {
  const merged = [...localUsers];
  
  migratedUsers.forEach(migratedUser => {
    const existingIndex = merged.findIndex(u => u.id === migratedUser.id || u.username === migratedUser.username);
    
    if (existingIndex >= 0) {
      // Atualizar usuário existente com dados migrados
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...migratedUser,
        // Manter senha local se existir
        password: merged[existingIndex].password || migratedUser.password,
      };
      console.log(`🔄 Usuário ${migratedUser.name} atualizado com dados migrados`);
    } else {
      // Adicionar novo usuário migrado
      merged.push(migratedUser);
      console.log(`➕ Usuário ${migratedUser.name} adicionado da migração`);
    }
  });

  return merged;
};