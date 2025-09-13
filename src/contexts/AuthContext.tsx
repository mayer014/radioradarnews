import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/contexts/UsersContext';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const SESSION_KEY = 'current_user';
const USERS_KEY = 'users_store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    // Restore session if exists and sync with latest user data
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        
        // Get the most up-to-date user data from users store
        const usersRaw = localStorage.getItem(USERS_KEY);
        if (usersRaw) {
          const users: User[] = JSON.parse(usersRaw);
          const updatedUser = users.find((u) => u.id === parsed.id);
          if (updatedUser) {
            console.log('🔄 Sessão restaurada:', updatedUser.name);
            setCurrentUser(updatedUser);
            localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
            return;
          }
        }
        
        console.log('⚠️ Usuário da sessão não encontrado no contexto');
        setCurrentUser(parsed);
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Listen for changes in users store to update current user
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USERS_KEY && currentUser) {
        try {
          const users: User[] = e.newValue ? JSON.parse(e.newValue) : [];
          const updatedUser = users.find((u) => u.id === currentUser.id);
          if (updatedUser) {
            console.log('🔄 Dados do usuário atualizados via storage:', updatedUser.name);
            setCurrentUser(updatedUser);
            localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('❌ Erro ao sincronizar usuário atual:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Tentativa de login:', username);
      
      // Buscar usuário no localStorage consolidado
      const raw = localStorage.getItem(USERS_KEY);
      const users: User[] = raw ? JSON.parse(raw) : [];
      const user = users.find((u) => u.username === username && u.password === password);
      
      if (!user) {
        console.log('❌ Usuário/senha inválidos');
        return false;
      }

      // Verificar se colunista está ativo
      if (user.role === 'colunista' && user.columnistProfile && !user.columnistProfile.isActive) {
        console.log('❌ Colunista inativo:', user.name);
        return false;
      }

      console.log('✅ Login bem-sucedido:', user.name);
      
      // Salvar sessão
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem('admin_authenticated', 'true'); // Compatibility
      
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  };

  const logout = (): void => {
    console.log('🚪 Logout realizado');
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('admin_authenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
