import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProgramming, type Program } from '@/contexts/SupabaseProgrammingContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  Radio,
  Clock,
  User,
  Play,
  Pause
} from 'lucide-react';

const ProgrammingEditor = () => {
  const { programs, radioStreamUrl, setRadioStreamUrl, addProgram, updateProgram, deleteProgram, toggleProgramStatus } = useSupabaseProgramming();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [streamUrl, setStreamUrl] = useState(radioStreamUrl);
  
  // Garantir que o campo sempre reflita o que está salvo no banco ao entrar na aba
  useEffect(() => {
    setStreamUrl(radioStreamUrl);
  }, [radioStreamUrl]);
  const [formData, setFormData] = useState<Omit<Program, 'id' | 'created_at' | 'updated_at'>>({
    title: '',
    host: '',
    start_time: '',
    end_time: '',
    description: '',
    status: 'upcoming',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      host: '',
      start_time: '',
      end_time: '',
      description: '',
      status: 'upcoming',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (program: Program) => {
    setFormData({
      title: program.title,
      host: program.host,
      start_time: program.start_time,
      end_time: program.end_time,
      description: program.description || '',
      status: program.status,
      is_active: program.is_active,
    });
    setEditingId(program.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.host || !formData.start_time || !formData.end_time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId) {
        const result = await updateProgram(editingId, formData);
        if (result.error) {
          toast({
            title: "Erro",
            description: result.error,
            variant: "destructive"
          });
          return;
        }
      } else {
        const result = await addProgram(formData);
        if (result.error) {
          toast({
            title: "Erro", 
            description: result.error,
            variant: "destructive"
          });
          return;
        }
      }
      
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este programa?')) {
      const result = await deleteProgram(id);
      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleProgramStatus(id);
    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleStreamUrlSave = async () => {
    const result = await setRadioStreamUrl(streamUrl);
    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Programação</h2>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-hero">
          <Plus className="w-4 h-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      {/* Configuração URL da Rádio - Movida para Configurações */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <Radio className="w-5 h-5 mr-2" />
          URL do Stream da Rádio
        </h3>
        <p className="text-sm text-muted-foreground">
          A configuração da URL do stream foi movida para <strong>Configurações → Rádio</strong>.
          A reprodução usa automaticamente a URL definida lá.
        </p>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Editar Programa' : 'Novo Programa'}
            </h3>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do programa"
                />
              </div>

              <div>
                <Label htmlFor="host">Apresentador *</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="Nome do apresentador"
                />
              </div>

              <div>
                <Label htmlFor="start_time">Hora de Início *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_time">Hora de Fim *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do programa"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Ao Vivo</SelectItem>
                    <SelectItem value="upcoming">Programado</SelectItem>
                    <SelectItem value="ended">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Programa Ativo</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-gradient-hero">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Atualizar' : 'Criar'} Programa
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de Programas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Programas Cadastrados</h3>
        
        <div className="space-y-4">
          {programs.map((program) => (
            <div 
              key={program.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{program.title}</h4>
                  <Badge variant={program.status === 'live' ? 'default' : 'secondary'}>
                    {program.status === 'live' ? 'AO VIVO' : 
                     program.status === 'upcoming' ? 'PROGRAMADO' : 'FINALIZADO'}
                  </Badge>
                  {!program.is_active && (
                    <Badge variant="outline">INATIVO</Badge>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {program.host}
                  </p>
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {program.start_time} - {program.end_time}
                  </p>
                  {program.description && (
                    <p className="text-xs">{program.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(program.id)}
                  title={program.status === 'live' ? 'Marcar como Programado' : 'Marcar como Ao Vivo'}
                >
                  {program.status === 'live' ? 
                    <Pause className="w-4 h-4" /> : 
                    <Play className="w-4 h-4" />
                  }
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(program)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(program.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum programa cadastrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProgrammingEditor;