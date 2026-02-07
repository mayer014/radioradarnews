import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { LogIn, LayoutDashboard, LogOut, UserPlus } from 'lucide-react';
import PasswordResetRequestDialog from '@/components/utility/PasswordResetRequestDialog';

const PublicUserBar: React.FC = () => {
  const { isAuthenticated, profile, loading, signOut } = usePublicAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">Quer divulgar seus serviços ou vagas?</p>
            <p className="text-sm text-muted-foreground">Cadastre-se gratuitamente e apareça para toda a região.</p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Link to="/utilidade-publica/auth" className="flex-1 sm:flex-initial">
              <Button className="bg-gradient-hero w-full text-sm sm:text-base px-5 py-2.5">
                <UserPlus className="h-4 w-4 mr-2" /> Cadastrar / Entrar
              </Button>
            </Link>
            <PasswordResetRequestDialog />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-5 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Logado como <span className="text-primary">{profile?.full_name || 'Usuário'}</span>
            </p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            className="bg-gradient-hero flex-1 sm:flex-initial"
            onClick={() => navigate('/utilidade-publica/painel')}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" /> Meu Painel
          </Button>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={async () => { await signOut(); }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicUserBar;
