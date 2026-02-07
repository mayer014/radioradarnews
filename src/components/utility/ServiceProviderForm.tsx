import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useServiceProviders, type ServiceProvider, type ServiceCategory } from '@/hooks/useServiceProviders';
import { DAY_LABELS } from './AvailabilityBadge';
import { Save, X } from 'lucide-react';

const ALL_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

interface ServiceProviderFormProps {
  userId: string;
  existing?: ServiceProvider | null;
  onSaved: () => void;
  onCancel: () => void;
}

const ServiceProviderForm: React.FC<ServiceProviderFormProps> = ({ userId, existing, onSaved, onCancel }) => {
  const { categories, createProvider, updateProvider } = useServiceProviders();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', category_id: '', description: '', city: '', neighborhood: '',
    whatsapp: '', charges_estimate: false, charges_displacement: false, notes: '',
    available_days: [] as string[], start_time: '08:00', end_time: '18:00',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name, category_id: existing.category_id || '',
        description: existing.description, city: existing.city,
        neighborhood: existing.neighborhood || '', whatsapp: existing.whatsapp,
        charges_estimate: existing.charges_estimate, charges_displacement: existing.charges_displacement,
        notes: existing.notes || '', available_days: existing.available_days || [],
        start_time: existing.start_time?.slice(0, 5) || '08:00',
        end_time: existing.end_time?.slice(0, 5) || '18:00',
      });
    }
  }, [existing]);

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.city || !form.whatsapp) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      user_id: userId,
      name: form.name,
      category_id: form.category_id || null,
      description: form.description,
      city: form.city,
      neighborhood: form.neighborhood || null,
      whatsapp: form.whatsapp,
      charges_estimate: form.charges_estimate,
      charges_displacement: form.charges_displacement,
      notes: form.notes || null,
      available_days: form.available_days,
      start_time: form.start_time,
      end_time: form.end_time,
      is_active: true,
    };

    const { error } = existing
      ? await updateProvider(existing.id, payload)
      : await createProvider(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: existing ? 'Serviço atualizado!' : 'Serviço cadastrado!' });
      onSaved();
    }
  };

  return (
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardTitle>{existing ? 'Editar Serviço' : 'Novo Serviço'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome / Nome Fantasia *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: João Eletricista" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva seus serviços..." rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cidade *</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.charges_estimate} onCheckedChange={c => setForm(f => ({ ...f, charges_estimate: !!c }))} />
              Cobra orçamento?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.charges_displacement} onCheckedChange={c => setForm(f => ({ ...f, charges_displacement: !!c }))} />
              Cobra deslocamento?
            </label>
          </div>

          <div>
            <Label>Dias de Atendimento</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {ALL_DAYS.map(day => (
                <Button key={day} type="button" size="sm" variant={form.available_days.includes(day) ? 'default' : 'outline'}
                  className={form.available_days.includes(day) ? 'bg-primary' : 'border-primary/30'}
                  onClick={() => toggleDay(day)}>
                  {DAY_LABELS[day]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <Label>Término</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-hero"><Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceProviderForm;
