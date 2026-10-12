import PageHeader from '@/components/layout/PageHeader';
import { UserRound } from 'lucide-react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';


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
    <div className="min-h-screen">
      <main id="main-content" tabIndex={-1} className="auth-page px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-card border-primary/20">
          <CardHeader className="auth-header"><PageHeader icon={UserRound} eyebrow="Sua conta na Rádio Radar" title="Recuperar senha" description="Informe seu e-mail para receber o link de recuperação." backTo="/utilidade-publica/auth" backLabel="Voltar ao login" /></CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-6">
                <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">E-mail enviado!</h3>
                <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada para redefinir sua senha.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div><Label htmlFor="recovery-email">E-mail cadastrado</Label><Input id="recovery-email" autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PasswordRecovery;
