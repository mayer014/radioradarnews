import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/contexts/UsersContext';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const CURRENT_USER_KEY = 'current_user';
const USERS_KEY = 'users_store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    // Restore session if exists and sync with latest user data
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        
        // Get the most up-to-date user data from users store
        const usersRaw = localStorage.getItem(USERS_KEY);
        if (usersRaw) {
          const users: User[] = JSON.parse(usersRaw);
          const updatedUser = users.find((u) => u.id === parsed.id);
          if (updatedUser) {
            setCurrentUser(updatedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
            return;
          }
        }
        
        setCurrentUser(parsed);
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem(CURRENT_USER_KEY);
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
            setCurrentUser(updatedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error syncing current user:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // TODO: Substituir por chamada real de API quando conectar ao PostgreSQL
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });
      // 
      // if (response.ok) {
      //   const { user, token } = await response.json();
      //   localStorage.setItem('auth_token', token);
      //   setCurrentUser(user);
      //   return true;
      // }
      
      // CÓDIGO TEMPORÁRIO - manter até migração do DB
      const raw = localStorage.getItem(USERS_KEY);
      const users: User[] = raw ? JSON.parse(raw) : [];
      const found = users.find((u) => u.username === username && u.password === password);
      if (found) {
        // Check if user is active (for columnists)
        if (found.role === 'colunista' && found.columnistProfile && !found.columnistProfile.isActive) {
          return false; // Inactive columnists cannot login
        }
        
        // Get the most up-to-date user data
        const updatedUsersData = localStorage.getItem(USERS_KEY);
        if (updatedUsersData) {
          const updatedUsers: User[] = JSON.parse(updatedUsersData);
          const updatedUser = updatedUsers.find((u) => u.id === found.id);
          if (updatedUser) {
            setCurrentUser(updatedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
          }
        }
        
        // Keep compatibility with existing PrivateRoute check
        localStorage.setItem('admin_authenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
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
