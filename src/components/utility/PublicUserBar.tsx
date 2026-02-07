import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { LogIn, LayoutDashboard, LogOut, UserPlus, Sparkles, KeyRound } from 'lucide-react';
import PasswordResetRequestDialog from '@/components/utility/PasswordResetRequestDialog';

const PublicUserBar: React.FC = () => {
  const { isAuthenticated, profile, loading, signOut } = usePublicAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-blue-600 animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_200%]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-2 left-6 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-2 right-12 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Cadastro Gratuito
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2">
                Divulgue seus serviços<br className="hidden sm:block" /> para toda a região!
              </h2>
              <p className="text-white/80 text-sm sm:text-base max-w-md">
                Cadastre-se gratuitamente e apareça para milhares de pessoas.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-3 w-full sm:w-auto items-center sm:items-stretch">
              <Link to="/utilidade-publica/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold text-base sm:text-lg px-8 py-6 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Cadastrar / Entrar
                </Button>
              </Link>
              <PasswordResetRequestDialog />
            </div>
          </div>
        </div>

        {/* CSS for animated gradient */}
        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
      <div className="relative px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-white">
                Olá, <span className="text-yellow-200">{profile?.full_name || 'Usuário'}</span>!
              </p>
              <p className="text-sm text-white/70">{profile?.email}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-white/90 font-bold flex-1 sm:flex-initial rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
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
    </div>
  );
};

export default PublicUserBar;
