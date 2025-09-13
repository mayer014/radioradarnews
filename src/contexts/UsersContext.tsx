import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BASE_NEWS_CATEGORIES } from '@/contexts/NewsContext';
import { migrateSupabaseUsersToLocal, validateUsersData, mergeUsers, createUsersBackup, exportUsersData } from '@/utils/userMigration';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'colunista';

export interface ColumnistProfile {
  id: string; // used to link with articles.columnist.id and routes /colunista/:id
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  allowedCategories: string[]; // categories they are allowed to publish in
  isActive: boolean; // controls if columnist can login and their articles are visible
}

export interface User {
  id: string; // same as columnist profile id for colunistas (for simplicity)
  name: string;
  username: string; // login field (can be email or simple username)
  password: string; // plain for local dev only
  role: UserRole;
  columnistProfile?: ColumnistProfile;
}

interface UsersContextType {
  users: User[];
  columnists: User[];
  addUser: (user: Omit<User, 'id'> & { id?: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string, newPassword: string) => void;
  migrateFromSupabase: () => Promise<void>;
  exportUsers: () => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'users_store';

const defaultUsers: User[] = [
  {
    id: 'admin',
    name: 'Administrador',
    username: 'admin',
    password: '25896589Ba@23479612',
    role: 'admin',
  },
  {
    id: 'ana-costa',
    name: 'Ana Costa',
    username: 'ana',
    password: 'colunista123',
    role: 'colunista',
    columnistProfile: {
      id: 'ana-costa',
      name: 'Ana Costa',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      bio: 'Economista e analista financeira com expertise em mercados e políticas econômicas. Formada em Economia pela FGV. Escreve exclusivamente para sua coluna sobre análises econômicas e mercados financeiros.',
      specialty: 'Economia e Finanças',
      allowedCategories: ['Coluna Ana Costa'],
      isActive: true,
    },
  },
  {
    id: 'joao-santos',
    name: 'João Santos',
    username: 'joao',
    password: 'colunista123',
    role: 'colunista',
    columnistProfile: {
      id: 'joao-santos',
      name: 'João Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      bio: 'Especialista em segurança pública com vasta experiência em investigação criminal. Ex-policial civil que agora escreve exclusivamente para sua coluna sobre segurança e análises policiais.',
      specialty: 'Segurança Pública',
      allowedCategories: ['Coluna João Santos'],
      isActive: true,
    },
  },
];

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Inicializar usuários após o componente montar
  useEffect(() => {
    const initializeUsers = async () => {
      setIsLoading(true);
      
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let localUsers = defaultUsers;
        
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as User[];
            const validation = validateUsersData(parsed);
            
            if (validation.isValid && Array.isArray(parsed) && parsed.length > 0) {
              localUsers = parsed;
              console.log('✅ Dados locais válidos carregados');
            } else {
              console.warn('⚠️ Dados locais inválidos, usando defaults:', validation.errors);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
            }
          } catch (error) {
            console.error('❌ Erro ao parsear dados locais:', error);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
          }
        } else {
          // Primeiro acesso - tentar migração do Supabase
          console.log('🔄 Primeira inicialização - tentando migração do Supabase...');
          try {
            const migratedUsers = await migrateSupabaseUsersToLocal();
            if (migratedUsers.length > 0) {
              localUsers = mergeUsers(defaultUsers, migratedUsers);
              console.log(`✅ ${migratedUsers.length} usuários migrados do Supabase`);
              
              toast({
                title: "Migração Concluída",
                description: `${migratedUsers.length} usuários foram migrados do sistema anterior.`,
              });
            }
          } catch (error) {
            console.error('❌ Erro na migração automática:', error);
          }
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localUsers));
        }
        
        setUsers(localUsers);
      } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        setUsers(defaultUsers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
      } finally {
        setIsLoading(false);
      }
    };

    initializeUsers();
  }, [toast]);

  // Persistir mudanças no localStorage com validação
  useEffect(() => {
    if (users.length > 0) {
      const validation = validateUsersData(users);
      if (validation.isValid) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        console.log('💾 Dados salvos no localStorage');
      } else {
        console.error('❌ Dados inválidos não foram salvos:', validation.errors);
      }
    }
  }, [users]);

  const addUser: UsersContextType['addUser'] = (user) => {
    const id = user.id || (user.role === 'colunista' && user.columnistProfile?.id) || `user-${Date.now()}`;
    const newUser: User = {
      ...user,
      id,
      columnistProfile:
        user.role === 'colunista'
          ? {
              id,
              name: user.name,
              avatar:
                user.columnistProfile?.avatar ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
              bio: user.columnistProfile?.bio || 'Colunista do portal.',
              specialty: user.columnistProfile?.specialty || 'Colunista',
              allowedCategories:
                user.columnistProfile?.allowedCategories?.length 
                  ? user.columnistProfile.allowedCategories
                  : [BASE_NEWS_CATEGORIES[0]],
              isActive: user.columnistProfile?.isActive ?? true,
            }
          : undefined,
    } as User;
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser: UsersContextType['updateUser'] = (id, updates) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === id) {
        const updatedUser = { ...u, ...updates };
        
        // Optimize avatar image if it's base64 and too large
        if (updates.columnistProfile?.avatar && 
            updates.columnistProfile.avatar.startsWith('data:image/') &&
            updates.columnistProfile.avatar.length > 100000) { // If larger than ~75KB
          console.warn('Large avatar detected for user:', u.name, 'Size:', Math.round(updates.columnistProfile.avatar.length * 0.75 / 1024), 'KB');
        }
        
        return updatedUser;
      }
      return u;
    }));
  };

  const deleteUser: UsersContextType['deleteUser'] = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const resetPassword: UsersContextType['resetPassword'] = (id, newPassword) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password: newPassword } : u)));
  };

  const migrateFromSupabase: UsersContextType['migrateFromSupabase'] = async () => {
    setIsLoading(true);
    try {
      const migratedUsers = await migrateSupabaseUsersToLocal();
      if (migratedUsers.length > 0) {
        const mergedUsers = mergeUsers(users, migratedUsers);
        setUsers(mergedUsers);
        
        toast({
          title: "Migração Concluída",
          description: `${migratedUsers.length} usuários foram migrados do Supabase.`,
        });
      } else {
        toast({
          title: "Nenhum Usuário Encontrado",
          description: "Não foram encontrados usuários para migrar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: "Erro na Migração",
        description: "Não foi possível migrar os usuários do Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportUsers: UsersContextType['exportUsers'] = () => {
    try {
      exportUsersData(users);
      toast({
        title: "Backup Exportado",
        description: "Os dados dos usuários foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no Export",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const columnists = useMemo(() => users.filter((u) => u.role === 'colunista'), [users]);

  return (
    <UsersContext.Provider value={{ 
      users, 
      columnists, 
      addUser, 
      updateUser, 
      deleteUser, 
      resetPassword, 
      migrateFromSupabase, 
      exportUsers, 
      isLoading 
    }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within UsersProvider');
  return ctx;
};
