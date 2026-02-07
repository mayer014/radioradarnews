import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { LayoutDashboard, LogOut, UserPlus, Sparkles, Rocket, Zap } from 'lucide-react';
import PasswordResetRequestDialog from '@/components/utility/PasswordResetRequestDialog';

/* ── Animated typing text ── */
const TypingText: React.FC<{ texts: string[]; className?: string }> = ({ texts, className }) => {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    const speed = deleting ? 30 : 60;

    if (!deleting && charIndex === current.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && charIndex === 0) {
      setDeleting(false);
      setIndex((index + 1) % texts.length);
      return;
    }

    const t = setTimeout(() => {
      setCharIndex(prev => prev + (deleting ? -1 : 1));
    }, speed);
    return () => clearTimeout(t);
  }, [charIndex, deleting, index, texts]);

  return (
    <span className={className}>
      {texts[index].substring(0, charIndex)}
      <span className="animate-pulse">|</span>
    </span>
  );
};

/* ── Floating particle ── */
const Particle: React.FC<{ delay: number; size: number; x: number; duration: number }> = ({ delay, size, x, duration }) => (
  <div
    className="absolute rounded-full bg-white/20 animate-[float-up_linear_infinite]"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      bottom: '-10px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
);

const PublicUserBar: React.FC = () => {
  const { isAuthenticated, profile, loading, signOut } = usePublicAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: Math.random() * 5,
    size: 3 + Math.random() * 6,
    x: Math.random() * 100,
    duration: 4 + Math.random() * 6,
  }));

  if (!isAuthenticated) {
    return (
      <div className="relative overflow-hidden rounded-2xl mb-8 group">
        {/* Deep animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-orange-500 bg-[length:300%_300%] animate-[gradient-x_8s_ease_infinite]" />
        
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        
        {/* Floating particles */}
        {particles.map((p, i) => <Particle key={i} {...p} />)}

        {/* Glow orbs */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-fuchsia-400/20 rounded-full blur-3xl animate-[pulse_3s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left: Animated text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-4 animate-fade-in">
                <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                100% Gratuito
                <Zap className="h-3.5 w-3.5 text-yellow-300" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-3 drop-shadow-lg">
                Divulgue seus serviços<br />
                <TypingText
                  texts={['para toda a região!', 'para milhares de pessoas!', 'e receba clientes!', 'pelo WhatsApp!']}
                  className="text-yellow-300"
                />
              </h2>
              <p className="text-white/80 text-base sm:text-lg max-w-lg animate-fade-in">
                Cadastre-se e apareça para quem precisa dos seus serviços. 
                <span className="text-yellow-200 font-semibold"> Rápido e fácil!</span>
              </p>
            </div>

            {/* Right: CTA */}
            <div className="flex flex-col gap-3 w-full sm:w-auto items-center sm:items-stretch">
              <Link to="/utilidade-publica/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-violet-700 hover:bg-yellow-300 hover:text-violet-800 font-black text-lg sm:text-xl px-10 py-7 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  <Rocket className="h-6 w-6 mr-2 animate-bounce" />
                  Cadastrar Grátis
                </Button>
              </Link>
              <PasswordResetRequestDialog />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 0.6; }
            50% { opacity: 1; }
            100% { transform: translateY(-400px) scale(0); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-400 bg-[length:200%_200%] animate-[gradient-x_6s_ease_infinite]" />
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl animate-pulse" />
      <div className="relative px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
              🎉
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-white">
                Olá, <span className="text-yellow-200">{profile?.full_name || 'Usuário'}</span>!
              </p>
              <p className="text-sm text-white/70">{profile?.email}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-yellow-300 font-bold flex-1 sm:flex-initial rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/utilidade-publica/painel')}
            >
              <LayoutDashboard className="h-5 w-5 mr-2" /> Meu Painel
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl"
              onClick={async () => { await signOut(); }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default PublicUserBar;
