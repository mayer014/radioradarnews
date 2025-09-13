import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';

export type UserRole = 'admin' | 'colunista';

export interface ColumnistProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  allowedCategories: string[];
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // For compatibility - managed by Supabase Auth
  role: UserRole;
  columnistProfile?: ColumnistProfile;
}

interface UsersContextType {
  users: User[];
  columnists: User[];
  isLoading: boolean;
  addUser: (user: Omit<User, 'id'> & { id?: string }) => Promise<{ error: string | null }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<{ error: string | null }>;
  deleteUser: (id: string) => Promise<{ error: string | null }>;
  resetPassword: (id: string, newPassword: string) => Promise<{ error: string | null }>;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

const defaultUsers: User[] = [
  {
    id: 'admin',
    name: 'Administrador',
    username: 'admin@radioradar.news',
    password: 'supabase-managed',
    role: 'admin',
  }
];

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useSupabaseAuth();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        password: 'supabase-managed', // Passwords are managed by Supabase Auth
        role: profile.role as UserRole,
        columnistProfile: profile.role === 'colunista' ? {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face`,
          bio: profile.bio || 'Colunista experiente.',
          specialty: profile.specialty || 'Jornalismo',
          allowedCategories: profile.allowed_categories || ['Política'],
          isActive: profile.is_active ?? true,
        } : undefined
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers(defaultUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addUser = async (user: Omit<User, 'id'> & { id?: string }) => {
    try {
      const profileData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        bio: user.columnistProfile?.bio,
        specialty: user.columnistProfile?.specialty,
        allowed_categories: user.columnistProfile?.allowedCategories,
        avatar: user.columnistProfile?.avatar,
        is_active: user.columnistProfile?.isActive ?? true
      };

      const { error } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      return { error: error.message || 'Erro ao adicionar usuário' };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const profileUpdates: any = {
        name: updates.name,
        username: updates.username,
        role: updates.role,
      };

      if (updates.columnistProfile) {
        profileUpdates.bio = updates.columnistProfile.bio;
        profileUpdates.specialty = updates.columnistProfile.specialty;
        profileUpdates.allowed_categories = updates.columnistProfile.allowedCategories;
        profileUpdates.avatar = updates.columnistProfile.avatar;
        profileUpdates.is_active = updates.columnistProfile.isActive;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      return { error: error.message || 'Erro ao atualizar usuário' };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      return { error: error.message || 'Erro ao deletar usuário' };
    }
  };

  const resetPassword = async (id: string, newPassword: string) => {
    try {
      // Note: Password reset should be handled through Supabase Auth
      // This is a placeholder for compatibility
      console.warn('Password reset should be handled through Supabase Auth email reset');
      return { error: 'Use Supabase Auth para redefinir senhas' };
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      return { error: error.message || 'Erro ao redefinir senha' };
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const columnists = useMemo(() => users.filter(u => u.role === 'colunista'), [users]);

  const value: UsersContextType = {
    users,
    columnists,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    resetPassword,
    refreshUsers
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};