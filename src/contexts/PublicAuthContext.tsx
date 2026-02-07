import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface PublicUserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicAuthContextType {
  user: User | null;
  session: Session | null;
  profile: PublicUserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (data: { email: string; password: string; full_name: string; phone?: string; city?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const PublicAuthContext = createContext<PublicAuthContextType>({} as PublicAuthContextType);

export const usePublicAuth = () => useContext(PublicAuthContext);

export const PublicAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('public_user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as PublicUserProfile);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser && currentUser.user_metadata?.is_public_user) {
        setTimeout(() => fetchProfile(currentUser.id), 0);
      } else {
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser && currentUser.user_metadata?.is_public_user) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (data: { email: string; password: string; full_name: string; phone?: string; city?: string }) => {
    const redirectUrl = `${window.location.origin}/utilidade-publica`;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          is_public_user: true,
          full_name: data.full_name,
          phone: data.phone || null,
          city: data.city || null,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const isAuthenticated = !!user && !!profile;

  return (
    <PublicAuthContext.Provider value={{ user, session, profile, loading, isAuthenticated, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </PublicAuthContext.Provider>
  );
};
