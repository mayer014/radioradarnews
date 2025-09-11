import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProgramming, type Program } from '@/contexts/ProgrammingContext';
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
  const { programs, radioStreamUrl, setRadioStreamUrl, addProgram, updateProgram, deleteProgram, toggleProgramStatus } = useProgramming();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [streamUrl, setStreamUrl] = useState(radioStreamUrl);
  
  const [formData, setFormData] = useState<Omit<Program, 'id'>>({
    title: '',
    host: '',
    startTime: '',
    endTime: '',
    description: '',
    status: 'upcoming',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      host: '',
      startTime: '',
      endTime: '',
      description: '',
      status: 'upcoming',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (program: Program) => {
    setFormData(program);
    setEditingId(program.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.host || !formData.startTime || !formData.endTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (editingId) {
      updateProgram(editingId, formData);
      toast({
        title: "Programa atualizado",
        description: "O programa foi atualizado com sucesso."
      });
    } else {
      addProgram(formData);
      toast({
        title: "Programa criado",
        description: "O novo programa foi adicionado à grade."
      });
    }

    resetForm();
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      deleteProgram(id);
      toast({
        title: "Programa excluído",
        description: "O programa foi removido da grade."
      });
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleProgramStatus(id);
    toast({
      title: "Status alterado",
      description: "O status do programa foi atualizado."
    });
  };

  const handleSaveStreamUrl = () => {
    setRadioStreamUrl(streamUrl);
    toast({
      title: "Stream configurado",
      description: "URL do streaming da rádio foi salva com sucesso."
    });
  };

  const getStatusColor = (status: Program['status']) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'upcoming': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Program['status']) => {
    switch (status) {
      case 'live': return 'AO VIVO';
      case 'upcoming': return 'EM BREVE';
      case 'ended': return 'ENCERRADO';
      default: return 'DESCONHECIDO';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programação da Rádio</h2>
          <p className="text-muted-foreground">Gerencie a grade de programação da rádio</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-hero hover:shadow-glow-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Programa
        </Button>
      </div>

      {/* Configuração do Stream da Rádio */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Radio className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Configuração do Stream</h3>
            <p className="text-sm text-muted-foreground">Configure a URL do streaming da rádio</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="flex-1">
            <Input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="Ex: https://streaming.streammaximum.com/..."
              className="bg-background/50"
            />
          </div>
          <Button 
            onClick={handleSaveStreamUrl}
            className="bg-gradient-hero hover:shadow-glow-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
        
        {radioStreamUrl && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">
              ✓ Stream configurado: {radioStreamUrl}
            </p>
          </div>
        )}
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Editar Programa' : 'Novo Programa'}
            </h3>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Programa *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Portal News Manhã"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host">Apresentador *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                placeholder="Ex: Carlos Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Início *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Término *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Program['status']) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Em Breve</SelectItem>
                  <SelectItem value="live">Ao Vivo</SelectItem>
                  <SelectItem value="ended">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive">Programa ativo</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o programa..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSave} className="bg-gradient-hero hover:shadow-glow-primary">
              <Save className="w-4 h-4 mr-2" />
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Programs List */}
      <div className="grid gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="bg-gradient-card border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <Radio className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{program.title}</h3>
                  <Badge 
                    className={`text-white ${getStatusColor(program.status)}`}
                  >
                    {getStatusLabel(program.status)}
                  </Badge>
                  {!program.isActive && (
                    <Badge variant="outline" className="border-gray-500 text-gray-500">
                      INATIVO
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{program.host}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{program.startTime} - {program.endTime}</span>
                  </div>
                </div>

                {program.description && (
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(program.id)}
                  className="hover:bg-primary/10"
                >
                  {program.status === 'live' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(program)}
                  className="hover:bg-primary/10"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(program.id, program.title)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {programs.length === 0 && (
          <Card className="bg-muted/20 border-dashed border-2 border-muted p-8 text-center">
            <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum programa cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione o primeiro programa à sua grade de programação
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Programa
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProgrammingEditor;