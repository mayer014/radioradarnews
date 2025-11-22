import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Shield, Mail, Loader2 } from 'lucide-react';
import OTPVerification from '@/components/OTPVerification';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const { signIn, verifyOTP, resendOTP, isAuthenticated, profile, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Timeout de segurança: se passar 10 segundos carregando perfil, mostra erro
    let timeoutId: NodeJS.Timeout;
    
    if (isAuthenticated && !profile && !authLoading) {
      setLoadingProfile(true);
      
      timeoutId = setTimeout(() => {
        if (!profile) {
          console.error('⚠️ Timeout ao carregar perfil');
          setLoadingProfile(false);
          toast({
            title: "Erro ao carregar perfil",
            description: "Não foi possível carregar suas informações. Tente novamente.",
            variant: "destructive",
          });
        }
      }, 10000); // 10 segundos
    }
    
    // Só redireciona quando terminar de carregar E tiver perfil
    if (isAuthenticated && profile && !authLoading) {
      setLoadingProfile(false);
      console.log('✅ Redirecionando usuário:', profile);
      
      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'colunista' && profile.is_active) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, profile, authLoading, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Erro de autenticação",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.requiresOTP) {
      setRequiresOTP(true);
      toast({
        title: "Código enviado",
        description: "Verifique seu email para o código de verificação",
      });
    } else {
      setLoadingProfile(true);
      toast({
        title: "Login realizado com sucesso!",
        description: "Carregando seu perfil...",
      });
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (otpAttempts >= 3) {
      toast({
        title: "Bloqueado",
        description: "Muitas tentativas incorretas. Tente novamente mais tarde.",
        variant: "destructive",
      });
      setRequiresOTP(false);
      setEmail('');
      setPassword('');
      setOtpAttempts(0);
      return;
    }

    setLoading(true);
    const result = await verifyOTP(email, code);
    setLoading(false);

    if (result.error) {
      setOtpAttempts(prev => prev + 1);
      toast({
        title: "Código inválido",
        description: `Tentativa ${otpAttempts + 1} de 3`,
        variant: "destructive",
      });
    } else {
      setOtpAttempts(0);
      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await resendOTP(email);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Código reenviado",
        description: "Verifique seu email",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-hero rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            RadioRadar.news
          </h1>
          <p className="text-muted-foreground mt-2">
            Painel Administrativo
          </p>
        </div>

        <Card className="bg-gradient-card backdrop-blur-sm border-primary/30 p-8">
          <div className="space-y-6">
            {!requiresOTP ? (
              <>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Acesso Administrativo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Faça login para acessar o sistema
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu email"
                        className="pl-10 border-primary/30 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="pl-10 border-primary/30 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || loadingProfile}
                    className="w-full bg-gradient-hero hover:shadow-glow-primary transition-all duration-300"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Autenticando...
                      </span>
                    ) : loadingProfile ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando perfil...
                      </span>
                    ) : (
                      'Entrar no Sistema'
                    )}
                  </Button>
                </form>
                
                {loadingProfile && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Carregando suas informações de perfil...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <OTPVerification
                email={email}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={loading}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth;