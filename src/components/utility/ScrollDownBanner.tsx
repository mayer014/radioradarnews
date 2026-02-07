import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface ScrollDownBannerProps {
  text: string;
  emoji?: string;
  colorScheme?: 'green' | 'blue';
}

const ScrollDownBanner: React.FC<ScrollDownBannerProps> = ({ text, emoji = '👇', colorScheme = 'green' }) => {
  const colors = colorScheme === 'green'
    ? { gradient: 'from-green-600 via-emerald-500 to-teal-500', glow: 'shadow-green-500/30', text: 'text-green-100', arrow: 'text-yellow-300' }
    : { gradient: 'from-blue-600 via-indigo-500 to-purple-500', glow: 'shadow-blue-500/30', text: 'text-blue-100', arrow: 'text-yellow-300' };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${colors.gradient} shadow-lg ${colors.glow} mb-8`}>
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Glow orbs */}
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-[pulse_3s_ease-in-out_infinite_1s]" />

      <div className="relative px-6 py-5 sm:py-6 flex flex-col items-center gap-3">
        {/* Sparkle + text */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Sparkles className={`h-5 w-5 ${colors.arrow} animate-spin`} style={{ animationDuration: '3s' }} />
          <span className={`text-base sm:text-lg font-black ${colors.text} text-center`}>
            {emoji} {text} {emoji}
          </span>
          <Sparkles className={`h-5 w-5 ${colors.arrow} animate-spin`} style={{ animationDuration: '3s' }} />
        </div>

        {/* Animated bouncing arrows */}
        <div className="flex items-center gap-1">
          <ChevronDown className={`h-6 w-6 ${colors.arrow} animate-bounce`} style={{ animationDelay: '0ms' }} />
          <ChevronDown className={`h-7 w-7 ${colors.arrow} animate-bounce`} style={{ animationDelay: '150ms' }} />
          <ChevronDown className={`h-6 w-6 ${colors.arrow} animate-bounce`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default ScrollDownBanner;
