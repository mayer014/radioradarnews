import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>('dark'); // Sempre iniciar em dark mode
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Função para carregar tema do usuário logado
  const loadUserTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Usuário logado - buscar preferência do banco
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao carregar tema do usuário:', error);
          // Em caso de erro, manter dark mode como padrão
        } else if (profile?.theme_preference) {
          setTheme(profile.theme_preference as Theme);
        }
      } else {
        // Usuário não logado - verificar cookie/localStorage como fallback
        const cookieTheme = document.cookie
          .split('; ')
          .find(row => row.startsWith('theme='))
          ?.split('=')[1] as Theme;
          
        if (cookieTheme && (cookieTheme === 'light' || cookieTheme === 'dark')) {
          setTheme(cookieTheme);
        } else {
          // Se não há cookie, usar localStorage como último recurso
          const storedTheme = localStorage.getItem('theme') as Theme;
          if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
            setTheme(storedTheme);
          }
          // Se nada foi encontrado, mantém dark mode (já definido no useState)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
      // Em caso de erro, manter dark mode como padrão
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar tema
  useEffect(() => {
    loadUserTheme();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUserTheme();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Aplicar tema ao DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Salvar em cookie para usuários não logados (expira em 1 ano)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    document.cookie = `theme=${theme}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
    
    // Manter localStorage como backup
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Usuário logado - salvar no banco
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);

        if (error) {
          console.error('Erro ao salvar tema:', error);
          toast({
            title: "Aviso",
            description: "Não foi possível salvar sua preferência de tema. Ela será mantida apenas nesta sessão.",
            variant: "destructive"
          });
        }
      }
      // Para usuários não logados, o cookie já é salvo automaticamente no useEffect acima
    } catch (error) {
      console.error('Erro ao alternar tema:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};