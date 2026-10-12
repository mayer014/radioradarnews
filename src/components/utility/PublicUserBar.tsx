import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import PasswordResetRequestDialog from './PasswordResetRequestDialog';

export default function PublicUserBar() {
  const { isAuthenticated, profile, loading, signOut } = usePublicAuth();
  if (loading) return null;
  return <aside className="page-surface community-account">
    <div><span className="page-eyebrow">{isAuthenticated ? 'Sua conta' : 'Faça parte'}</span><h2>{isAuthenticated ? `Olá, ${profile?.full_name || 'Usuário'}` : 'Seu trabalho também pode estar aqui'}</h2><p>{isAuthenticated ? profile?.email : 'Cadastre serviços e vagas gratuitamente e gerencie suas publicações.'}</p></div>
    <div className="flex flex-wrap items-center gap-3">
      {isAuthenticated ? <><Button asChild><Link to="/utilidade-publica/painel"><LayoutDashboard size={16} />Meu painel</Link></Button><Button variant="outline" onClick={() => signOut()}><LogOut size={16} />Sair</Button></>
      : <><Button asChild><Link to="/utilidade-publica/auth"><UserPlus size={16} />Cadastrar ou entrar</Link></Button><PasswordResetRequestDialog /></>}
    </div>
  </aside>;
}
