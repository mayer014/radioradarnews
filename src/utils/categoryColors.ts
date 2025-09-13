import { useTheme } from '@/contexts/ThemeContext';

export const getCategoryColors = (categoryName: string, theme: 'light' | 'dark') => {
  const lightColors = {
    'Todas': {
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-100',
      borderClass: 'border-slate-200'
    },
    'Política': {
      colorClass: 'text-slate-700',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200'
    },
    'Policial': {
      colorClass: 'text-stone-700',
      bgClass: 'bg-stone-50',
      borderClass: 'border-stone-200'
    },
    'Entretenimento': {
      colorClass: 'text-zinc-700',
      bgClass: 'bg-zinc-50',
      borderClass: 'border-zinc-200'
    },
    'Internacional': {
      colorClass: 'text-gray-700',
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200'
    },
    'Esportes': {
      colorClass: 'text-neutral-700',
      bgClass: 'bg-neutral-50',
      borderClass: 'border-neutral-200'
    },
    'Tecnologia / Economia': {
      colorClass: 'text-slate-700',
      bgClass: 'bg-slate-100',
      borderClass: 'border-slate-300'
    },
    'Ciência / Saúde': {
      colorClass: 'text-stone-700',
      bgClass: 'bg-stone-100',
      borderClass: 'border-stone-300'
    }
  };

  const darkColors = {
    'Todas': {
      colorClass: 'text-primary',
      bgClass: 'bg-primary/20',
      borderClass: 'border-primary/30'
    },
    'Política': {
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-400/20',
      borderClass: 'border-blue-400/30'
    },
    'Policial': {
      colorClass: 'text-red-400',
      bgClass: 'bg-red-400/20',
      borderClass: 'border-red-400/30'
    },
    'Entretenimento': {
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-400/20',
      borderClass: 'border-purple-400/30'
    },
    'Internacional': {
      colorClass: 'text-green-400',
      bgClass: 'bg-green-400/20',
      borderClass: 'border-green-400/30'
    },
    'Esportes': {
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-400/20',
      borderClass: 'border-orange-400/30'
    },
    'Tecnologia / Economia': {
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-400/20',
      borderClass: 'border-cyan-400/30'
    },
    'Ciência / Saúde': {
      colorClass: 'text-violet-400',
      bgClass: 'bg-violet-400/20',
      borderClass: 'border-violet-400/30'
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;
  return colors[categoryName as keyof typeof colors] || colors['Todas'];
};

export const useCategoryColors = () => {
  const { theme } = useTheme();
  
  return (categoryName: string) => getCategoryColors(categoryName, theme);
};