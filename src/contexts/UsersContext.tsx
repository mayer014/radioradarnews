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
      
      // Check if user is authenticated to determine access level
      const { data: { user } } = await supabase.auth.getUser();
      
      let data, error;
      
      if (user) {
        // Authenticated users (especially admins) get full access
        const result = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      } else {
        // Public users: use Edge Function to fetch active columnists reliably (bypasses RLS safely)
        console.log('UsersContext: Calling columnists-public edge function');
        const ef = await supabase.functions.invoke('columnists-public', { body: {} });
        
        console.log('UsersContext: Edge function result:', { 
          error: ef.error, 
          data: ef.data,
          hasColumnists: ef.data?.columnists?.length 
        });
        
        if (!ef.error && ef.data?.success && Array.isArray(ef.data.columnists)) {
          data = ef.data.columnists;
          error = null as any;
          console.log('UsersContext: Successfully got columnists from edge function:', data.length);
        } else {
          console.log('UsersContext: Edge function failed, using fallback to profiles_public');
          // Fallback to public view if edge function is unavailable
          const result = await supabase
            .from('profiles_public')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });
          data = result.data;
          error = result.error as any;
          console.log('UsersContext: Fallback result:', { data: data?.length, error });
        }
      }

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map(profile => {
        console.log('UsersContext: Mapping profile:', profile.name, profile.is_active);
        return {
          id: profile.id,
          name: profile.name,
          username: profile.username || '', // Only available for authenticated users
          password: 'supabase-managed', // Passwords are managed by Supabase Auth
          role: (profile.role || 'colunista') as UserRole,
          columnistProfile: {
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face`,
            bio: profile.bio || 'Colunista experiente.',
            specialty: profile.specialty || 'Jornalismo',
            allowedCategories: profile.allowed_categories || ['Política'],
            isActive: profile.is_active ?? true,
          }
        };
      });

      console.log('UsersContext: Final mapped users:', mappedUsers.length, 'columnists:', mappedUsers.filter(u => u.role === 'colunista').length);
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
      const profileId = user.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

      const profileData = {
        id: profileId,
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
      await fetchUsers();
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      return { error: error.message || 'Erro ao adicionar usuário' };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      // Buscar o usuário atual para preservar dados existentes
      const currentUser = users.find(u => u.id === id);
      if (!currentUser) {
        throw new Error('Usuário não encontrado');
      }

      const profileUpdates: any = {};

      // Só incluir campos que foram fornecidos nas atualizações
      if (updates.name !== undefined) profileUpdates.name = updates.name;
      if (updates.username !== undefined) profileUpdates.username = updates.username;
      if (updates.role !== undefined) profileUpdates.role = updates.role;

      if (updates.columnistProfile && currentUser.columnistProfile) {
        // Mesclar com dados existentes do perfil do colunista
        const existingProfile = currentUser.columnistProfile;
        const updatedProfile = { ...existingProfile, ...updates.columnistProfile };
        
        profileUpdates.bio = updatedProfile.bio;
        profileUpdates.specialty = updatedProfile.specialty;
        profileUpdates.allowed_categories = updatedProfile.allowedCategories;
        profileUpdates.avatar = updatedProfile.avatar;
        profileUpdates.is_active = updatedProfile.isActive;
      }

      console.log('Atualizando perfil:', id, profileUpdates);

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (error) {
        console.error('Erro do Supabase ao atualizar:', error);
        throw error;
      }

      // Atualizar o estado local imediatamente após sucesso no banco
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === id) {
            const updatedUser = { ...user };
            
            // Aplicar atualizações básicas
            if (updates.name !== undefined) updatedUser.name = updates.name;
            if (updates.username !== undefined) updatedUser.username = updates.username;
            if (updates.role !== undefined) updatedUser.role = updates.role;
            
            // Aplicar atualizações do perfil do colunista
            if (updates.columnistProfile && updatedUser.columnistProfile) {
              updatedUser.columnistProfile = {
                ...updatedUser.columnistProfile,
                ...updates.columnistProfile
              };
            }
            
            return updatedUser;
          }
          return user;
        })
      );

      console.log('Perfil atualizado com sucesso e estado local atualizado');
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

  const columnists = useMemo(() => {
    const filtered = users.filter(u => u.role === 'colunista');
    console.log('UsersContext: Columnists memo update:', filtered.length, 'active:', filtered.filter(c => c.columnistProfile?.isActive).length);
    return filtered;
  }, [users]);

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