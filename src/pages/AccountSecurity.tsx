import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock } from "lucide-react";

const AccountSecurity: React.FC = () => {
  const { user, isAuthenticated, loading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateStrength = (pwd: string) => {
    const hasMinLength = pwd.length >= 12;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    return hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }

    if (!validateStrength(newPassword)) {
      toast({
        title: "Senha fraca",
        description: "Use 12+ caracteres com maiúsculas, minúsculas, números e símbolo",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Senha atualizada", description: "Sua senha foi alterada com sucesso." });
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 bg-gradient-card backdrop-blur-sm border-primary/30 text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-hero rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">Segurança da Conta</h1>
          <p className="text-muted-foreground mb-6">Faça login para alterar sua senha.</p>
          <Button asChild className="w-full bg-gradient-hero">
            <Link to="/admin/supabase-login">Ir para Login Seguro</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-hero rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">Alterar Senha</h1>
          <p className="text-muted-foreground mt-2">Mantenha sua conta protegida com uma senha forte.</p>
        </div>

        <Card className="bg-gradient-card backdrop-blur-sm border-primary/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                className="border-primary/30 focus:border-primary"
                required
              />
              <p className="text-xs text-muted-foreground">Mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e símbolo.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="border-primary/30 focus:border-primary"
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-gradient-hero hover:shadow-glow-primary">
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/admin")}>Voltar ao painel</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccountSecurity;
