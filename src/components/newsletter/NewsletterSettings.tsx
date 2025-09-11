import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { newsletterService } from '@/services/NewsletterService';
import { NewsletterSettings as SettingsType } from '@/types/newsletter';
import { 
  Settings, 
  Save, 
  Mail, 
  Shield, 
  Zap, 
  Globe, 
  Database,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

const NewsletterSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsType>(newsletterService.getSettings());
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      newsletterService.saveSettings(settings);
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
      const defaultSettings = newsletterService.getSettings();
      setSettings(defaultSettings);
      toast({
        title: "Configurações restauradas",
        description: "As configurações padrão foram restauradas.",
      });
    }
  };

  const handleExportSettings = () => {
    const exportData = newsletterService.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup exportado",
      description: "Dados exportados com sucesso.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (confirm('Tem certeza que deseja importar estes dados? Isso substituirá todos os dados atuais.')) {
          const success = newsletterService.importData(importData);
          
          if (success) {
            setSettings(newsletterService.getSettings());
            toast({
              title: "Dados importados",
              description: "Os dados foram importados com sucesso.",
            });
          } else {
            throw new Error('Falha na importação');
          }
        }
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Arquivo inválido ou corrompido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const toggleAutoSendCategory = (category: string) => {
    const newCategories = settings.autoSendCategories.includes(category)
      ? settings.autoSendCategories.filter(c => c !== category)
      : [...settings.autoSendCategories, category];
    
    setSettings({
      ...settings,
      autoSendCategories: newCategories
    });
  };

  const newsCategories = [
    'Política', 'Policial', 'Entretenimento', 'Internacional', 
    'Esportes', 'Tecnologia', 'Ciência / Saúde'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações da Newsletter
          </h2>
          <p className="text-muted-foreground">
            Configure como sua newsletter funciona
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </div>
          
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Configurações de remetente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Remetente *</Label>
              <Input
                value={settings.senderName}
                onChange={(e) => setSettings({...settings, senderName: e.target.value})}
                placeholder="Portal de Notícias"
              />
            </div>
            
            <div>
              <Label>Email do Remetente *</Label>
              <Input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({...settings, senderEmail: e.target.value})}
                placeholder="noticias@portal.com"
              />
            </div>
          </div>
          
          <div>
            <Label>Email para Resposta</Label>
            <Input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => setSettings({...settings, replyToEmail: e.target.value})}
              placeholder="contato@portal.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email que receberá as respostas dos assinantes
            </p>
          </div>

          <div>
            <Label>Endereço da Empresa (opcional)</Label>
            <Input
              value={settings.companyAddress || ''}
              onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
              placeholder="Rua Exemplo, 123 - São Paulo, SP"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Endereço físico exigido por alguns provedores de email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de inscrição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Inscrição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Formulário de Inscrição Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Permite que visitantes se inscrevam na newsletter
              </p>
            </div>
            <Switch
              checked={settings.subscriptionFormEnabled}
              onCheckedChange={(checked) => setSettings({...settings, subscriptionFormEnabled: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Double Opt-in</Label>
              <p className="text-sm text-muted-foreground">
                Requer confirmação por email após inscrição
              </p>
            </div>
            <Switch
              checked={settings.doubleOptIn}
              onCheckedChange={(checked) => setSettings({...settings, doubleOptIn: checked})}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Email de Boas-vindas</Label>
              <p className="text-sm text-muted-foreground">
                Envia email automático após inscrição
              </p>
            </div>
            <Switch
              checked={settings.welcomeEmailEnabled}
              onCheckedChange={(checked) => setSettings({...settings, welcomeEmailEnabled: checked})}
            />
          </div>

          {settings.welcomeEmailEnabled && (
            <div className="space-y-3 ml-4 pl-4 border-l-2 border-primary/20">
              <div>
                <Label>Assunto do Email de Boas-vindas</Label>
                <Input
                  value={settings.welcomeEmailSubject}
                  onChange={(e) => setSettings({...settings, welcomeEmailSubject: e.target.value})}
                  placeholder="Bem-vindo ao Portal de Notícias!"
                />
              </div>
              
              <div>
                <Label>Conteúdo do Email de Boas-vindas</Label>
                <Textarea
                  value={settings.welcomeEmailContent}
                  onChange={(e) => setSettings({...settings, welcomeEmailContent: e.target.value})}
                  placeholder="Obrigado por se inscrever..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Newsletter Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Envio Automático</Label>
              <p className="text-sm text-muted-foreground">
                Envia newsletter automaticamente quando novas matérias são publicadas
              </p>
            </div>
            <Switch
              checked={settings.autoSendEnabled}
              onCheckedChange={(checked) => setSettings({...settings, autoSendEnabled: checked})}
            />
          </div>

          {settings.autoSendEnabled && (
            <div className="space-y-4 ml-4 pl-4 border-l-2 border-primary/20">
              <div>
                <Label>Assunto do Email</Label>
                <Input
                  value={settings.autoSendSubject}
                  onChange={(e) => setSettings({...settings, autoSendSubject: e.target.value})}
                  placeholder="Nova matéria publicada: {{title}}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{{title}}'} para incluir o título da matéria
                </p>
              </div>
              
              <div>
                <Label>Template do Email</Label>
                <Textarea
                  value={settings.autoSendTemplate}
                  onChange={(e) => setSettings({...settings, autoSendTemplate: e.target.value})}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{{title}}'}, {'{{excerpt}}'} e {'{{url}}'} como variáveis
                </p>
              </div>
              
              <div>
                <Label>Categorias que Disparam Envio</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newsCategories.map(category => (
                    <Badge
                      key={category}
                      variant={settings.autoSendCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => toggleAutoSendCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Clique nas categorias para ativar/desativar o envio automático
                </p>
              </div>

              <div>
                <Label>Delay de Envio (minutos)</Label>
                <Input
                  type="number"
                  value={settings.autoSendDelay || 0}
                  onChange={(e) => setSettings({...settings, autoSendDelay: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  max="1440"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo para aguardar antes de enviar (0 = imediato)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rodapé de Cancelamento</Label>
            <Textarea
              value={settings.unsubscribeFooter}
              onChange={(e) => setSettings({...settings, unsubscribeFooter: e.target.value})}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Texto que aparece no final de todos os emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Limite Diário de Envios</Label>
              <Input
                type="number"
                value={settings.dailySendLimit || 1000}
                onChange={(e) => setSettings({...settings, dailySendLimit: parseInt(e.target.value) || 1000})}
                min="1"
                max="10000"
              />
            </div>
            
            <div>
              <Label>Limite por Hora</Label>
              <Input
                type="number"
                value={settings.rateLimitPerHour || 100}
                onChange={(e) => setSettings({...settings, rateLimitPerHour: parseInt(e.target.value) || 100})}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div>
            <Label>Domínio Personalizado (futuro)</Label>
            <Input
              value={settings.customDomain || ''}
              onChange={(e) => setSettings({...settings, customDomain: e.target.value})}
              placeholder="newsletter.seusite.com"
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Funcionalidade disponível após migração para Supabase
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Migração futura */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Database className="h-5 w-5" />
            Preparado para Migração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            Este sistema está preparado para migração futura para Supabase, que permitirá:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4">
            <li>• Envio real de emails via SendGrid, Resend ou SMTP personalizado</li>
            <li>• Links únicos de cancelamento automático</li>
            <li>• Banco de dados em nuvem com backup automático</li>
            <li>• Análises detalhadas de abertura e cliques</li>
            <li>• Segmentação avançada de assinantes</li>
            <li>• Templates de email profissionais</li>
            <li>• Compliance com LGPD e GDPR</li>
          </ul>
          
          <div className="mt-4">
            <Button variant="outline" onClick={handleResetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterSettings;