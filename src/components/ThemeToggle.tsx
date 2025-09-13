import React from 'react';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="relative overflow-hidden transition-all duration-300"
        aria-label="Carregando tema..."
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-300 hover:bg-primary/10 hover:text-primary"
      aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;