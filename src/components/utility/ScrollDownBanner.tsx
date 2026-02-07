import React from 'react';

interface ScrollDownBannerProps {
  text: string;
  emoji?: string;
  colorScheme?: 'green' | 'blue';
}

const ScrollDownBanner: React.FC<ScrollDownBannerProps> = ({ text, emoji, colorScheme = 'green' }) => {
  const isGreen = colorScheme === 'green';

  return (
    <div className={`relative overflow-hidden rounded-2xl mb-8 ${
      isGreen 
        ? 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900' 
        : 'bg-gradient-to-br from-indigo-900 via-blue-800 to-slate-900'
    }`}>
      {/* Animated gradient overlay */}
      <div className={`absolute inset-0 opacity-40 bg-[length:400%_400%] animate-gradient-flow ${
        isGreen
          ? 'bg-gradient-to-r from-emerald-400/20 via-transparent to-teal-400/20'
          : 'bg-gradient-to-r from-blue-400/20 via-transparent to-purple-400/20'
      }`} />

      {/* Horizontal light streak */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/2 -translate-y-1/2 h-px w-full ${
          isGreen ? 'bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-blue-400/50 to-transparent'
        } animate-[pulse_3s_ease-in-out_infinite]`} />
      </div>

      <div className="relative px-6 py-8 sm:py-10 flex flex-col items-center gap-5">
        {/* Main text */}
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white text-center tracking-tight leading-tight animate-fade-in">
          {emoji && <span className="mr-2">{emoji}</span>}
          {text}
          {emoji && <span className="ml-2">{emoji}</span>}
        </h3>

        {/* Elegant fade-in staggered arrows */}
        <div className="flex flex-col items-center -space-y-3">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              viewBox="0 0 40 12"
              className="w-10 sm:w-14"
              style={{
                animation: `scrollArrowFade 2s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              <path
                d="M4 2 L20 10 L36 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isGreen ? 'text-emerald-300' : 'text-blue-300'}
              />
            </svg>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scrollArrowFade {
          0%, 100% { opacity: 0; transform: translateY(-6px); }
          40%, 60% { opacity: 1; transform: translateY(0); }
          80% { opacity: 0; transform: translateY(6px); }
        }
      `}</style>
    </div>
  );
};

export default ScrollDownBanner;
