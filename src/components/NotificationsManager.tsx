import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { NEWS_CATEGORIES } from '@/contexts/NewsContext';
import { 
  Bell, 
  Send, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  BarChart3,
  Zap,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const NotificationsManager = () => {
  const { 
    rules,
    sentNotifications,
    settings, 
    isSupported,
    isSubscribed,
    createRule,
    updateRule,
    deleteRule,
    sendManualNotification,
    updateSettings,
    requestPermission,
    subscribe,
    unsubscribe,
    getStats 
  } = useNotifications();
  
  const { toast } = useToast();
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  
  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: 'manual' as 'new_article' | 'featured_article' | 'manual' | 'scheduled',
    category: '',
    title: '',
    message: '',
    url: '',
    enabled: true
  });

  const [manualForm, setManualForm] = useState({
    title: '',
    message: '',
    url: ''
  });

  const stats = getStats();

  const handleCreateRule = () => {
    if (ruleForm.name && ruleForm.title && ruleForm.message) {
      if (editingRule) {
        updateRule(editingRule, ruleForm);
        setEditingRule(null);
        toast({
          title: "Regra atualizada",
          description: "A regra de notificação foi atualizada.",
        });
      } else {
        createRule(ruleForm);
        toast({
          title: "Regra criada",
          description: "A regra de notificação foi criada.",
        });
      }
      
      setRuleForm({
        name: '',
        trigger: 'manual',
        category: '',
        title: '',
        message: '',
        url: '',
        enabled: true
      });
      setShowRuleDialog(false);
    }
  };

  const handleEditRule = (rule: any) => {
    setRuleForm({
      name: rule.name,
      trigger: rule.trigger,
      category: rule.category || '',
      title: rule.title,
      message: rule.message,
      url: rule.url || '',
      enabled: rule.enabled
    });
    setEditingRule(rule.id);
    setShowRuleDialog(true);
  };

  const handleSendManual = async () => {
    if (manualForm.title && manualForm.message) {
      const success = await sendManualNotification(
        manualForm.title, 
        manualForm.message, 
        manualForm.url || undefined
      );
      
      if (success) {
        toast({
          title: "Notificação enviada",
          description: "A notificação foi enviada com sucesso.",
        });
        setManualForm({ title: '', message: '', url: '' });
        setShowManualDialog(false);
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar a notificação. Verifique as permissões.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Permissão concedida",
        description: "Agora você pode receber notificações.",
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "As notificações não funcionarão sem permissão.",
        variant: "destructive"
      });
    }
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: "Inscrito em notificações",
        description: "Você receberá notificações push.",
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast({
        title: "Desinscrito",
        description: "Você não receberá mais notificações push.",
      });
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'new_article': return 'Novo Artigo';
      case 'featured_article': return 'Artigo em Destaque';
      case 'manual': return 'Manual';
      case 'scheduled': return 'Agendada';
      default: return trigger;
    }
  };

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case 'new_article':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Novo Artigo</Badge>;
      case 'featured_article':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Destaque</Badge>;
      case 'manual':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Manual</Badge>;
      case 'scheduled':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Agendada</Badge>;
      default:
        return <Badge variant="secondary">{trigger}</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Notificações não suportadas</h3>
            <p className="text-muted-foreground">
              Este navegador não suporta notificações push ou service workers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status das notificações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSubscribed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  Status: {isSubscribed ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed 
                    ? 'As notificações estão funcionando' 
                    : 'Clique para ativar notificações'
                  }
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isSubscribed ? (
                <>
                  <Button onClick={handleRequestPermission} variant="outline">
                    Pedir Permissão
                  </Button>
                  <Button onClick={handleSubscribe}>
                    Ativar Notificações
                  </Button>
                </>
              ) : (
                <Button onClick={handleUnsubscribe} variant="outline">
                  Desativar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Regras</p>
                <p className="text-2xl font-bold">{stats.totalRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regras Ativas</p>
                <p className="text-2xl font-bold">{stats.activeRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Clique</p>
                <p className="text-2xl font-bold">{stats.averageClickRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual">Envio Manual</TabsTrigger>
          <TabsTrigger value="rules">Regras Automáticas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Enviar Notificação Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={manualForm.title}
                  onChange={(e) => setManualForm({...manualForm, title: e.target.value})}
                  placeholder="Título da notificação"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={manualForm.message}
                  onChange={(e) => setManualForm({...manualForm, message: e.target.value})}
                  placeholder="Conteúdo da notificação..."
                  rows={3}
                />
              </div>
              <div>
                <Label>URL (opcional)</Label>
                <Input
                  value={manualForm.url}
                  onChange={(e) => setManualForm({...manualForm, url: e.target.value})}
                  placeholder="https://exemplo.com/artigo"
                />
              </div>
              <Button 
                onClick={handleSendManual} 
                disabled={!manualForm.title || !manualForm.message}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Notificação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {/* Criar regra */}
          <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Editar Regra' : 'Nova Regra'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Regra</Label>
                  <Input
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                    placeholder="Nome interno da regra"
                  />
                </div>
                
                <div>
                  <Label>Gatilho</Label>
                  <Select 
                    value={ruleForm.trigger} 
                    onValueChange={(value: any) => setRuleForm({...ruleForm, trigger: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_article">Novo Artigo</SelectItem>
                      <SelectItem value="featured_article">Artigo em Destaque</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(ruleForm.trigger === 'new_article' || ruleForm.trigger === 'featured_article') && (
                  <div>
                    <Label>Categoria (opcional)</Label>
                    <Select 
                      value={ruleForm.category} 
                      onValueChange={(value) => setRuleForm({...ruleForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as categorias</SelectItem>
                        {NEWS_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Título da Notificação</Label>
                  <Input
                    value={ruleForm.title}
                    onChange={(e) => setRuleForm({...ruleForm, title: e.target.value})}
                    placeholder="Título que aparecerá na notificação"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{title}'} para incluir o título do artigo
                  </p>
                </div>
                
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={ruleForm.message}
                    onChange={(e) => setRuleForm({...ruleForm, message: e.target.value})}
                    placeholder="Conteúdo da notificação..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{title}'}, {'{category}'}, {'{author}'} para variáveis dinâmicas
                  </p>
                </div>
                
                <div>
                  <Label>URL (opcional)</Label>
                  <Input
                    value={ruleForm.url}
                    onChange={(e) => setRuleForm({...ruleForm, url: e.target.value})}
                    placeholder="URL para redirecionar ao clicar"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Regra ativa</Label>
                  <Switch
                    checked={ruleForm.enabled}
                    onCheckedChange={(checked) => setRuleForm({...ruleForm, enabled: checked})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowRuleDialog(false);
                    setEditingRule(null);
                    setRuleForm({
                      name: '',
                      trigger: 'manual',
                      category: '',
                      title: '',
                      message: '',
                      url: '',
                      enabled: true
                    });
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRule}>
                    {editingRule ? 'Atualizar' : 'Criar'} Regra
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de regras */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma regra automática criada.</p>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{rule.name}</p>
                          {getTriggerBadge(rule.trigger)}
                          {rule.enabled ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Ativa</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">Inativa</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.title} • {rule.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Criada em {new Date(rule.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                      >
                        {rule.enabled ? 'Desativar' : 'Ativar'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta regra?')) {
                            deleteRule(rule.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {sentNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação enviada ainda.</p>
                </CardContent>
              </Card>
            ) : (
              sentNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviada em {new Date(notification.sentAt).toLocaleString('pt-BR')} • 
                          {notification.recipientCount} destinatários • 
                          {notification.clickCount} cliques • 
                          Tipo: {notification.type === 'manual' ? 'Manual' : 'Automática'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações habilitadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar/desativar sistema de notificações
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({...settings, enabled: checked})
                  }
                />
              </div>

              <div>
                <Label>Ícone padrão</Label>
                <Input
                  value={settings.defaultIcon}
                  onChange={(e) => updateSettings({...settings, defaultIcon: e.target.value})}
                  placeholder="/icon-192.png"
                />
              </div>

              <div>
                <Label>URL padrão</Label>
                <Input
                  value={settings.defaultUrl}
                  onChange={(e) => updateSettings({...settings, defaultUrl: e.target.value})}
                  placeholder="/"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Prompt de inscrição</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar prompt para pedir permissões automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.subscriptionPromptEnabled}
                  onCheckedChange={(checked) => 
                    updateSettings({...settings, subscriptionPromptEnabled: checked})
                  }
                />
              </div>

              {settings.subscriptionPromptEnabled && (
                <div>
                  <Label>Atraso do prompt (segundos)</Label>
                  <Input
                    type="number"
                    value={settings.subscriptionPromptDelay}
                    onChange={(e) => 
                      updateSettings({
                        ...settings, 
                        subscriptionPromptDelay: parseInt(e.target.value) || 30
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsManager;