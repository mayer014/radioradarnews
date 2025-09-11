import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { newsletterService } from '@/services/NewsletterService';
import { Campaign, CampaignStatus } from '@/types/newsletter';
import { 
  Plus, 
  Send, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  Mail,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const CampaignManager = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(newsletterService.getCampaigns());
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [sendingCampaigns, setSendingCampaigns] = useState<Set<string>>(new Set());
  
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    content: '',
    htmlContent: '',
    tags: ''
  });

  const refreshCampaigns = () => {
    setCampaigns(newsletterService.getCampaigns());
  };

  const resetForm = () => {
    setCampaignForm({
      title: '',
      subject: '',
      content: '',
      htmlContent: '',
      tags: ''
    });
    setEditingCampaign(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCampaignDialog(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      htmlContent: campaign.htmlContent,
      tags: campaign.tags.join(', ')
    });
    setShowCampaignDialog(true);
  };

  const handleSaveCampaign = () => {
    if (!campaignForm.title.trim() || !campaignForm.subject.trim() || !campaignForm.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, assunto e conteúdo.",
        variant: "destructive"
      });
      return;
    }

    try {
      const tags = campaignForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      if (editingCampaign) {
        // Atualizar campanha existente
        const success = newsletterService.updateCampaign(editingCampaign.id, {
          title: campaignForm.title.trim(),
          subject: campaignForm.subject.trim(),
          content: campaignForm.content.trim(),
          htmlContent: campaignForm.htmlContent.trim() || campaignForm.content.trim(),
          tags
        });

        if (success) {
          toast({
            title: "Campanha atualizada",
            description: "A campanha foi atualizada com sucesso.",
          });
        }
      } else {
        // Criar nova campanha
        newsletterService.createCampaign({
          title: campaignForm.title.trim(),
          subject: campaignForm.subject.trim(),
          content: campaignForm.content.trim(),
          htmlContent: campaignForm.htmlContent.trim() || campaignForm.content.trim(),
          status: 'draft',
          tags
        });

        toast({
          title: "Campanha criada",
          description: "A campanha foi salva como rascunho.",
        });
      }

      refreshCampaigns();
      setShowCampaignDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar campanha.",
        variant: "destructive"
      });
    }
  };

  const handleSendCampaign = async (id: string, title: string) => {
    const activeSubscribers = newsletterService.getActiveSubscribers();
    
    if (activeSubscribers.length === 0) {
      toast({
        title: "Nenhum inscrito ativo",
        description: "Não há inscritos ativos para receber a campanha.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja enviar a campanha "${title}" para ${activeSubscribers.length} inscritos?`)) {
      return;
    }

    setSendingCampaigns(prev => new Set(prev).add(id));

    try {
      const success = await newsletterService.sendCampaign(id);
      
      if (success) {
        toast({
          title: "Campanha enviada!",
          description: `A campanha foi enviada para ${activeSubscribers.length} inscritos.`,
        });
        refreshCampaigns();
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao enviar a campanha.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao enviar campanha.",
        variant: "destructive"
      });
    } finally {
      setSendingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteCampaign = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir a campanha "${title}"?`)) {
      const success = newsletterService.deleteCampaign(id);
      if (success) {
        toast({
          title: "Campanha excluída",
          description: "A campanha foi removida.",
        });
        refreshCampaigns();
      }
    }
  };

  const getCampaignStatusBadge = (status: CampaignStatus) => {
    const config = {
      draft: { label: 'Rascunho', icon: Edit, className: 'bg-gray-100 text-gray-800 border-gray-200' },
      scheduled: { label: 'Agendada', icon: Clock, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      sending: { label: 'Enviando', icon: Loader2, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      sent: { label: 'Enviada', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-200' },
      failed: { label: 'Falhou', icon: AlertCircle, className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const { label, icon: Icon, className } = config[status];
    
    return (
      <Badge className={className}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'sending' ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCampaignStats = (campaign: Campaign) => {
    if (campaign.status !== 'sent' || campaign.recipientCount === 0) return null;

    const openRate = (campaign.openCount / campaign.recipientCount) * 100;
    const clickRate = (campaign.clickCount / campaign.recipientCount) * 100;
    const bounceRate = (campaign.bounceCount / campaign.recipientCount) * 100;

    return { openRate, clickRate, bounceRate };
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas de Email</h2>
          <p className="text-muted-foreground">
            Crie, gerencie e envie campanhas de newsletter
          </p>
        </div>
        
        <Button onClick={openCreateDialog} className="bg-gradient-hero hover:shadow-glow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'draft').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.recipientCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma campanha criada ainda.</p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira campanha
                </Button>
              </div>
            ) : (
              campaigns.map((campaign) => {
                const stats = getCampaignStats(campaign);
                const isSending = sendingCampaigns.has(campaign.id);
                
                return (
                  <Card key={campaign.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{campaign.title}</h3>
                              <p className="text-muted-foreground">{campaign.subject}</p>
                              {campaign.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {campaign.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {getCampaignStatusBadge(campaign.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Criada: {formatDate(campaign.createdAt)}</span>
                            </div>
                            {campaign.sentAt && (
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                <span>Enviada: {formatDate(campaign.sentAt)}</span>
                              </div>
                            )}
                            {campaign.recipientCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{campaign.recipientCount} destinatários</span>
                              </div>
                            )}
                            {stats && (
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span>{stats.openRate.toFixed(1)}% abertura</span>
                              </div>
                            )}
                          </div>

                          {/* Estatísticas detalhadas para campanhas enviadas */}
                          {stats && (
                            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Entregues:</span>
                                  <span className="ml-2 font-medium">{campaign.deliveredCount}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Aberturas:</span>
                                  <span className="ml-2 font-medium">{campaign.openCount} ({stats.openRate.toFixed(1)}%)</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cliques:</span>
                                  <span className="ml-2 font-medium">{campaign.clickCount} ({stats.clickRate.toFixed(1)}%)</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Bounces:</span>
                                  <span className="ml-2 font-medium">{campaign.bounceCount} ({stats.bounceRate.toFixed(1)}%)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {campaign.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(campaign)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id, campaign.title)}
                                disabled={isSending}
                                className="bg-gradient-hero hover:shadow-glow-primary"
                              >
                                {isSending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                {isSending ? 'Enviando...' : 'Enviar'}
                              </Button>
                            </>
                          )}
                          
                          {campaign.status === 'sent' && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Relatório
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para criar/editar campanha */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título da Campanha *</Label>
                <Input
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                  placeholder="Nome interno da campanha"
                />
              </div>
              
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={campaignForm.tags}
                  onChange={(e) => setCampaignForm({...campaignForm, tags: e.target.value})}
                  placeholder="promoção, novidades, semanal"
                />
              </div>
            </div>
            
            <div>
              <Label>Assunto do Email *</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                placeholder="Assunto que aparecerá no email"
              />
            </div>
            
            <div>
              <Label>Conteúdo do Email *</Label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                placeholder="Conteúdo do email em texto simples..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use **texto** para negrito e links serão automaticamente convertidos
              </p>
            </div>
            
            <div>
              <Label>HTML (opcional)</Label>
              <Textarea
                value={campaignForm.htmlContent}
                onChange={(e) => setCampaignForm({...campaignForm, htmlContent: e.target.value})}
                placeholder="Versão HTML do email (opcional - será gerada automaticamente se não preenchida)"
                rows={6}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCampaignDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveCampaign}>
                {editingCampaign ? 'Atualizar' : 'Criar'} Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignManager;