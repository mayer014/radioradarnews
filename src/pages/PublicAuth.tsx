import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

const PublicAuth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, signIn, isAuthenticated } = usePublicAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) navigate('/utilidade-publica/painel');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Preencha e-mail e senha', variant: 'destructive' });
      return;
    }

    setLoading(true);
    if (mode === 'signup') {
      if (!fullName) {
        toast({ title: 'Informe seu nome completo', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error } = await signUp({ email, password, full_name: fullName, phone, city });
      if (error) {
        const msg = error.message?.includes('already') ? 'Este e-mail já está cadastrado.' : error.message;
        toast({ title: 'Erro no cadastro', description: msg, variant: 'destructive' });
      } else {
        toast({ title: 'Cadastro realizado!', description: 'Verifique seu e-mail para confirmar a conta.' });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Erro no login', description: 'E-mail ou senha incorretos.', variant: 'destructive' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-gradient-card border-primary/20">
          <CardHeader className="text-center">
            <Link to="/utilidade-publica" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <CardTitle className="text-2xl bg-gradient-hero bg-clip-text text-transparent">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? 'Acesse seu painel de serviços e vagas' : 'Cadastre-se gratuitamente'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div><Label>Nome Completo *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 9..." /></div>
                    <div><Label>Cidade</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
                  </div>
                </>
              )}
              <div><Label>E-mail *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
              <div className="relative">
                <Label>Senha *</Label>
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-8 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === 'login' && (
                <button type="button" onClick={() => navigate('/utilidade-publica/recuperar-senha')} className="text-sm text-primary hover:underline">
                  Esqueci minha senha
                </button>
              )}

              <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-medium">
                  {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PublicAuth;
