import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KeyRound, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PasswordResetRequestDialog: React.FC = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('submit_contact_message', {
        p_name: form.name.trim(),
        p_email: form.email.trim(),
        p_phone: form.whatsapp.trim(),
        p_subject: '[REDEFINIÇÃO DE SENHA] Solicitação de redefinição',
        p_message: `Olá, solicito a redefinição da minha senha de acesso ao sistema de Utilidade Pública.\n\nNome: ${form.name.trim()}\nE-mail cadastrado: ${form.email.trim()}\nWhatsApp: ${form.whatsapp.trim()}\n\nPor favor, redefina minha senha e me avise pelo WhatsApp informado.`,
        p_ip_address: '0.0.0.0' as any,
      });

      if (error) throw error;

      const result = data as any;
      if (result && result.success === false) {
        throw new Error(result.error || 'Erro ao enviar solicitação');
      }

      toast({
        title: '✅ Solicitação enviada!',
        description: 'O administrador receberá sua solicitação e entrará em contato pelo WhatsApp.',
      });
      setForm({ name: '', email: '', whatsapp: '' });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar',
        description: err.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
          <KeyRound className="h-4 w-4" /> Esqueci minha senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Solicitar Redefinição de Senha
          </DialogTitle>
          <DialogDescription>
            Preencha seus dados abaixo. O administrador redefinirá sua senha e avisará pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="reset-name">Seu nome completo</Label>
            <Input
              id="reset-name"
              placeholder="Ex: João da Silva"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-email">E-mail cadastrado</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-whatsapp">WhatsApp para contato</Label>
            <Input
              id="reset-whatsapp"
              placeholder="(99) 99999-9999"
              value={form.whatsapp}
              onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              maxLength={20}
              required
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetRequestDialog;
