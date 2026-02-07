import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useJobListings, JOB_TYPES, type JobListing } from '@/hooks/useJobListings';
import { Save, X } from 'lucide-react';

interface JobListingFormProps {
  userId: string;
  existing?: JobListing | null;
  onSaved: () => void;
  onCancel: () => void;
}

const JobListingForm: React.FC<JobListingFormProps> = ({ userId, existing, onSaved, onCancel }) => {
  const { createJob, updateJob } = useJobListings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', company: '', description: '', job_type: 'clt',
    city: '', neighborhood: '', salary: '', requirements: '', whatsapp: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, company: existing.company, description: existing.description,
        job_type: existing.job_type, city: existing.city, neighborhood: existing.neighborhood || '',
        salary: existing.salary || '', requirements: existing.requirements || '', whatsapp: existing.whatsapp,
      });
    }
  }, [existing]);

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, whatsapp: formatWhatsApp(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.description || !form.city || !form.whatsapp) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const whatsDigits = form.whatsapp.replace(/\D/g, '');
    if (whatsDigits.length < 10 || whatsDigits.length > 11) {
      toast({ title: 'WhatsApp inválido', description: 'Digite o DDD + número (10 ou 11 dígitos)', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      user_id: userId,
      title: form.title,
      company: form.company,
      description: form.description,
      job_type: form.job_type,
      city: form.city,
      neighborhood: form.neighborhood || null,
      salary: form.salary || null,
      requirements: form.requirements || null,
      whatsapp: form.whatsapp,
      is_active: true,
    };

    const { error } = existing
      ? await updateJob(existing.id, payload)
      : await createJob(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: existing ? 'Vaga atualizada!' : 'Vaga publicada!' });
      onSaved();
    }
  };

  return (
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader><CardTitle>{existing ? 'Editar Vaga' : 'Nova Vaga'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Título da Vaga *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Vendedor(a)" /></div>
            <div><Label>Empresa *</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
          </div>

          <div><Label>Descrição da Função *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Vaga *</Label>
              <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cidade *</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div><Label>Bairro</Label><Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Salário (opcional)</Label><Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="Ex: R$ 2.000 - R$ 3.000" /></div>
            <div><Label>WhatsApp * <span className="text-xs text-muted-foreground font-normal">(DDD + número)</span></Label><Input value={form.whatsapp} onChange={handleWhatsAppChange} placeholder="(67) 99999-9999" inputMode="tel" /></div>
          </div>

          <div><Label>Requisitos</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2} /></div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-hero"><Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobListingForm;
