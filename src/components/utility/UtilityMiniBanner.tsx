import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';

const PHRASES = ['para toda a região!', 'para milhares de pessoas!', 'e receba clientes!', 'pelo WhatsApp!'];

const UtilityMiniBanner: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = PHRASES[index];
    const speed = deleting ? 30 : 60;
    if (!deleting && charIndex === current.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && charIndex === 0) {
      setDeleting(false);
      setIndex((index + 1) % PHRASES.length);
      return;
    }
    const t = setTimeout(() => setCharIndex(prev => prev + (deleting ? -1 : 1)), speed);
    return () => clearTimeout(t);
  }, [charIndex, deleting, index]);

  return (
    <Link to="/utilidade-publica" className="block">
      <div className="relative overflow-hidden rounded-xl group cursor-pointer transition-all duration-500 hover:scale-[1.01]">
        {/* Gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 bg-[length:300%_300%] animate-[gradient-x_8s_ease_infinite]" />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Glow */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-fuchsia-400/15 rounded-full blur-2xl animate-[pulse_3s_ease-in-out_infinite_1s]" />

        <div className="relative px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left text */}
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              100% Gratuito
              <Zap className="h-3 w-3 text-yellow-300" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white leading-tight drop-shadow-md">
              Divulgue seus serviços{' '}
              <span className="text-yellow-300">
                {PHRASES[index].substring(0, charIndex)}
                <span className="animate-pulse">|</span>
              </span>
            </h3>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-sm shrink-0 group-hover:bg-white/30 transition-all duration-300">
            Cadastre-se Grátis
            <ArrowRight className="h-4 w-4 animate-[bounce-x_1.5s_ease-in-out_infinite]" />
          </div>
        </div>

        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    </Link>
  );
};

export default UtilityMiniBanner;
