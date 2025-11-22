import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'colunista'; // Fetched from user_roles table
  avatar?: string;
  bio?: string;
  specialty?: string;
  allowed_categories?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; requiresOTP?: boolean }>;
  signUp: (email: string, password: string, username: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  verifyOTP: (email: string, token: string) => Promise<{ error?: string }>;
  resendOTP: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, 'Session:', !!session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Usar setTimeout para evitar deadlock
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 0);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        // Mesmo com erro, desabilita loading para não travar
        setLoading(false);
        return;
      }

      console.log('✅ Profile data fetched:', profileData);

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('❌ Error fetching user role:', roleError);
        // Mesmo com erro, desabilita loading para não travar
        setLoading(false);
        return;
      }

      console.log('✅ Role data fetched:', roleData);

      // Combine profile and role data
      const completeProfile = {
        ...profileData,
        role: roleData.role as 'admin' | 'colunista'
      };
      
      console.log('✅ Complete profile set:', completeProfile);
      setProfile(completeProfile);
      
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error);
      // Garante que loading seja desabilitado mesmo com erro
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Primeiro valida a senha
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return { error: authError.message };
      }

      // Verifica se é admin
      if (authData.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        // Se é admin, requer OTP
        if (roleData?.role === 'admin') {
          // Faz logout temporário
          await supabase.auth.signOut();
          
          // Envia OTP
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false
            }
          });

          if (otpError) {
            return { error: otpError.message };
          }

          return { requiresOTP: true };
        }
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const signUp = async (email: string, password: string, username: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            name
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Erro",
          description: "Erro ao fazer logout",
          variant: "destructive",
        });
      } else {
        setProfile(null);
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Atualizar estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return {};
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: 'Erro de conexão' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    updateProfile,
    verifyOTP,
    resendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};