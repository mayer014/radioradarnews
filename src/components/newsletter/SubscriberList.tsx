import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { newsletterService } from '@/services/NewsletterService';
import { Subscriber, SubscriberStatus, SubscriptionSource } from '@/types/newsletter';
import { 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Trash2, 
  Eye,
  Mail,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const SubscriberList = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>(newsletterService.getSubscribers());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SubscriptionSource | 'all'>('all');
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [newSubscriberName, setNewSubscriberName] = useState('');

  // Filtros e busca
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(subscriber => {
      const matchesSearch = searchTerm === '' || 
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscriber.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter;
      
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [subscribers, searchTerm, statusFilter, sourceFilter]);

  const refreshSubscribers = () => {
    setSubscribers(newsletterService.getSubscribers());
  };

  const handleAddSubscriber = () => {
    if (!newSubscriberEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite um email válido.",
        variant: "destructive"
      });
      return;
    }

    const success = newsletterService.addSubscriber(
      newSubscriberEmail.trim(), 
      newSubscriberName.trim() || undefined, 
      'manual'
    );

    if (success) {
      toast({
        title: "Inscrito adicionado",
        description: "O email foi adicionado à newsletter.",
      });
      setNewSubscriberEmail('');
      setNewSubscriberName('');
      refreshSubscribers();
    } else {
      toast({
        title: "Email já existe",
        description: "Este email já está na lista de inscritos.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubscriber = (id: string, email: string) => {
    if (confirm(`Tem certeza que deseja remover ${email} da newsletter?`)) {
      const success = newsletterService.deleteSubscriber(id);
      if (success) {
        toast({
          title: "Inscrito removido",
          description: "O email foi removido da newsletter.",
        });
        refreshSubscribers();
      }
    }
  };

  const handleUpdateStatus = (id: string, newStatus: SubscriberStatus) => {
    const success = newsletterService.updateSubscriber(id, { status: newStatus });
    if (success) {
      toast({
        title: "Status atualizado",
        description: "O status do inscrito foi alterado.",
      });
      refreshSubscribers();
    }
  };

  const exportSubscribers = () => {
    const data = filteredSubscribers;
    const csvContent = [
      ['Email', 'Nome', 'Status', 'Data de Inscrição', 'Origem', 'Tags'],
      ...data.map(sub => [
        sub.email,
        sub.name || '',
        sub.status,
        new Date(sub.subscribedAt).toLocaleDateString('pt-BR'),
        sub.source,
        sub.tags.join(';')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Lista exportada",
      description: `${data.length} inscritos exportados em CSV.`,
    });
  };

  const getStatusBadge = (status: SubscriberStatus) => {
    const config = {
      active: { label: 'Ativo', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-200' },
      unsubscribed: { label: 'Descadastrado', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
      bounced: { label: 'Bounce', icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      pending: { label: 'Pendente', icon: Eye, className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const { label, icon: Icon, className } = config[status];
    
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getSourceLabel = (source: SubscriptionSource) => {
    const labels = {
      homepage: 'Página Inicial',
      article: 'Artigo',
      footer: 'Rodapé',
      manual: 'Manual',
      import: 'Importação',
      popup: 'Popup'
    };
    return labels[source] || source;
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descadastrados</p>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.status === 'unsubscribed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{subscribers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar novo inscrito */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Inscrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newSubscriberEmail}
                onChange={(e) => setNewSubscriberEmail(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Nome (opcional)</Label>
              <Input
                placeholder="Nome do inscrito"
                value={newSubscriberName}
                onChange={(e) => setNewSubscriberName(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAddSubscriber}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: SubscriberStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="unsubscribed">Descadastrado</SelectItem>
                  <SelectItem value="bounced">Bounce</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Origem</Label>
              <Select value={sourceFilter} onValueChange={(value: SubscriptionSource | 'all') => setSourceFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="homepage">Página Inicial</SelectItem>
                  <SelectItem value="article">Artigo</SelectItem>
                  <SelectItem value="footer">Rodapé</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="popup">Popup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={exportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Exportar ({filteredSubscribers.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de inscritos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Inscritos ({filteredSubscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {subscribers.length === 0 
                    ? 'Nenhum inscrito encontrado.' 
                    : 'Nenhum inscrito corresponde aos filtros selecionados.'
                  }
                </p>
              </div>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <Card key={subscriber.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <p className="font-semibold">{subscriber.email}</p>
                            {subscriber.name && (
                              <p className="text-sm text-muted-foreground">{subscriber.name}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Inscrito em {new Date(subscriber.subscribedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            <span>via {getSourceLabel(subscriber.source)}</span>
                          </div>
                          {subscriber.tags.length > 0 && (
                            <div className="flex gap-1">
                              {subscriber.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {subscriber.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subscriber.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(subscriber.status)}
                        
                        <Select 
                          value={subscriber.status} 
                          onValueChange={(value: SubscriberStatus) => handleUpdateStatus(subscriber.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="unsubscribed">Descadastrar</SelectItem>
                            <SelectItem value="bounced">Bounce</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.email)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberList;