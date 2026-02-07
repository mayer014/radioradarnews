import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const PasswordRecovery: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Informe seu e-mail', variant: 'destructive' }); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/utilidade-publica/auth`,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-gradient-card border-primary/20">
          <CardHeader className="text-center">
            <Link to="/utilidade-publica/auth" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
            <CardTitle className="text-2xl bg-gradient-hero bg-clip-text text-transparent">Recuperar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-6">
                <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">E-mail enviado!</h3>
                <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada para redefinir sua senha.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div><Label>E-mail cadastrado</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PasswordRecovery;
