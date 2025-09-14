import React, { useState } from 'react';
import { useSupabaseComments } from '@/contexts/SupabaseCommentsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Filter, 
  Settings,
  MessageSquare,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';

const CommentsManager = () => {
  const { 
    comments, 
    settings, 
    updateCommentStatus, 
    deleteComment, 
    getPendingComments,
    updateSettings,
    getCommentStats 
  } = useSupabaseComments();
  
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [newBlockedEmail, setNewBlockedEmail] = useState('');
  const [newBlockedIP, setNewBlockedIP] = useState('');

  const stats = getCommentStats();
  const pendingComments = getPendingComments();

  const filteredComments = selectedStatus === 'all' 
    ? comments 
    : comments.filter(comment => comment.status === selectedStatus);

  const handleApprove = async (id: string) => {
    const result = await updateCommentStatus(id, 'approved');
    if (!result.error) {
      toast({
        title: "Comentário aprovado",
        description: "O comentário foi aprovado e está visível no site.",
      });
    } else {
      toast({
        title: "Erro ao aprovar",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    const result = await updateCommentStatus(id, 'rejected');
    if (!result.error) {
      toast({
        title: "Comentário rejeitado",
        description: "O comentário foi rejeitado e não aparece no site.",
      });
    } else {
      toast({
        title: "Erro ao rejeitar",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este comentário permanentemente?')) {
      const result = await deleteComment(id);
      if (!result.error) {
        toast({
          title: "Comentário excluído",
          description: "O comentário foi removido permanentemente.",
        });
      } else {
        toast({
          title: "Erro ao excluir",
          description: result.error,
          variant: "destructive"
        });
      }
    }
  };

  const handleAddBlockedEmail = () => {
    if (newBlockedEmail.trim()) {
      const updatedSettings = {
        ...settings,
        blockedEmails: [...settings.blockedEmails, newBlockedEmail.toLowerCase().trim()]
      };
      updateSettings(updatedSettings);
      setNewBlockedEmail('');
      toast({
        title: "Email bloqueado",
        description: "O email foi adicionado à lista de bloqueados.",
      });
    }
  };

  const handleRemoveBlockedEmail = (email: string) => {
    const updatedSettings = {
      ...settings,
      blockedEmails: settings.blockedEmails.filter(e => e !== email)
    };
    updateSettings(updatedSettings);
    toast({
      title: "Email desbloqueado",
      description: "O email foi removido da lista de bloqueados.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments">Gerenciar Comentários</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4" />
                <Label>Filtrar por status:</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('all')}
                  >
                    Todos ({stats.total})
                  </Button>
                  <Button
                    variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('pending')}
                  >
                    Pendentes ({stats.pending})
                  </Button>
                  <Button
                    variant={selectedStatus === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('approved')}
                  >
                    Aprovados ({stats.approved})
                  </Button>
                  <Button
                    variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus('rejected')}
                  >
                    Rejeitados ({stats.rejected})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de comentários */}
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {selectedStatus === 'all' ? 'Nenhum comentário encontrado.' : `Nenhum comentário ${selectedStatus}.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{comment.name}</p>
                        <p className="text-sm text-muted-foreground">{comment.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(comment.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-4 p-3 bg-muted rounded-md">
                      {comment.content}
                    </p>

                    <div className="flex space-x-2">
                      {comment.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(comment.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprovar
                        </Button>
                      )}
                      
                      {comment.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(comment.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações de Comentários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurações gerais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Moderação obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Comentários precisam ser aprovados antes de aparecer
                    </p>
                  </div>
                  <Switch
                    checked={settings.moderationRequired}
                    onCheckedChange={(checked) => 
                      updateSettings({ ...settings, moderationRequired: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir respostas</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários podem responder a outros comentários
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowReplies}
                    onCheckedChange={(checked) => 
                      updateSettings({ ...settings, allowReplies: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamanho máximo do comentário</Label>
                  <Input
                    type="number"
                    value={settings.maxLength}
                    onChange={(e) => 
                      updateSettings({ ...settings, maxLength: parseInt(e.target.value) || 500 })
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Caracteres máximos por comentário
                  </p>
                </div>
              </div>

              {/* Emails bloqueados */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Emails Bloqueados</Label>
                  <p className="text-sm text-muted-foreground">
                    Emails que não podem comentar
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="email@exemplo.com"
                    value={newBlockedEmail}
                    onChange={(e) => setNewBlockedEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedEmail()}
                  />
                  <Button onClick={handleAddBlockedEmail}>
                    Bloquear
                  </Button>
                </div>

                {settings.blockedEmails.length > 0 && (
                  <div className="space-y-2">
                    {settings.blockedEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{email}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRemoveBlockedEmail(email)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Palavras-chave automáticas */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Filtros Automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Palavras que automaticamente rejeitam comentários
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Palavras para rejeição automática</Label>
                  <Textarea
                    placeholder="spam, fake, bot (separar por vírgula)"
                    value={settings.autoRejectKeywords.join(', ')}
                    onChange={(e) => 
                      updateSettings({ 
                        ...settings, 
                        autoRejectKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Palavras para aprovação automática</Label>
                  <Textarea
                    placeholder="obrigado, parabéns, excelente (separar por vírgula)"
                    value={settings.autoApproveKeywords.join(', ')}
                    onChange={(e) => 
                      updateSettings({ 
                        ...settings, 
                        autoApproveKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommentsManager;