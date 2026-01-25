import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Facebook, 
  Instagram, 
  Settings, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SocialMediaConfig {
  id: string;
  platform: 'facebook' | 'instagram';
  page_id: string;
  instagram_user_id?: string;
  access_token: string;
  token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SocialMediaPost {
  id: string;
  article_id: string;
  platform: string;
  post_id?: string;
  image_url?: string;
  caption?: string;
  status: string;
  error_message?: string;
  is_columnist_article: boolean;
  created_at: string;
}

const SocialMediaConfigPanel: React.FC = () => {
  const [configs, setConfigs] = useState<SocialMediaConfig[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  // Form state - simplificado sem campos de auto-publish
  const [formData, setFormData] = useState({
    facebook_page_id: '',
    instagram_user_id: '',
    access_token: '',
    token_expires_at: '',
  });

  useEffect(() => {
    fetchConfigs();
    fetchPosts();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_config')
        .select('*')
        .order('platform');

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        platform: item.platform as 'facebook' | 'instagram'
      }));
      setConfigs(typedData);

      // Populate form with existing data
      const fbConfig = data?.find(c => c.platform === 'facebook');
      const igConfig = data?.find(c => c.platform === 'instagram');

      if (fbConfig || igConfig) {
        setFormData(prev => ({
          ...prev,
          facebook_page_id: fbConfig?.page_id || '',
          instagram_user_id: igConfig?.instagram_user_id || '',
          access_token: fbConfig?.access_token || igConfig?.access_token || '',
          token_expires_at: fbConfig?.token_expires_at || igConfig?.token_expires_at || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Calcular data de expiração automática (60 dias a partir de hoje)
  const calculateExpirationDate = (): string => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 60);
    return expirationDate.toISOString();
  };

  // Calcular dias restantes até expiração
  const getDaysUntilExpiration = (): number | null => {
    if (!formData.token_expires_at) return null;
    const expirationDate = new Date(formData.token_expires_at);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Obter cor do indicador baseado nos dias restantes
  const getExpirationIndicatorColor = (): string => {
    const days = getDaysUntilExpiration();
    if (days === null) return 'text-muted-foreground';
    if (days <= 0) return 'text-destructive';
    if (days <= 5) return 'text-red-500';
    if (days <= 10) return 'text-orange-500';
    return 'text-green-500';
  };

  const saveConfigs = async () => {
    setSaving(true);

    try {
      // Se o token mudou, calcular nova data de expiração automaticamente
      const existingToken = configs.find(c => c.platform === 'facebook')?.access_token || 
                           configs.find(c => c.platform === 'instagram')?.access_token;
      
      const tokenChanged = formData.access_token && formData.access_token !== existingToken;
      
      // Usar data de expiração automática se o token foi alterado, senão manter a existente
      const expirationDate = tokenChanged 
        ? calculateExpirationDate() 
        : (formData.token_expires_at || null);

      // Limpar sessão de "lembrar depois" quando token for atualizado
      if (tokenChanged) {
        sessionStorage.removeItem('token_expiration_dismissed');
      }

      // Facebook config
      if (formData.facebook_page_id) {
        const fbData = {
          platform: 'facebook' as const,
          page_id: formData.facebook_page_id,
          access_token: formData.access_token,
          token_expires_at: expirationDate,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('social_media_config')
          .upsert(fbData, { onConflict: 'platform' });

        if (error) throw error;
      }

      // Instagram config
      if (formData.instagram_user_id) {
        const igData = {
          platform: 'instagram' as const,
          page_id: formData.facebook_page_id || 'instagram_only',
          instagram_user_id: formData.instagram_user_id,
          access_token: formData.access_token,
          token_expires_at: expirationDate,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('social_media_config')
          .upsert(igData, { onConflict: 'platform' });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: tokenChanged 
          ? 'Token atualizado! A data de expiração foi definida para 60 dias a partir de hoje.' 
          : 'Configurações salvas com sucesso',
      });

      fetchConfigs();
    } catch (error) {
      console.error('Error saving configs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.access_token) {
      toast({
        title: 'Erro',
        description: 'Token de acesso é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Test Facebook connection
      if (formData.facebook_page_id) {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${formData.facebook_page_id}?access_token=${formData.access_token}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        toast({
          title: 'Facebook conectado',
          description: `Página: ${data.name || formData.facebook_page_id}`,
        });
      }

      // Test Instagram connection
      if (formData.instagram_user_id) {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${formData.instagram_user_id}?fields=username&access_token=${formData.access_token}`
        );
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        toast({
          title: 'Instagram conectado',
          description: `Usuário: @${data.username || formData.instagram_user_id}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na conexão',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Publicado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case 'pending':
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysUntilExpiration();
  const isTokenExpiringSoon = daysRemaining !== null && daysRemaining <= 10;
  const isTokenExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <Facebook className="w-5 h-5 text-blue-600" />
            <Instagram className="w-5 h-5 text-pink-600" />
            Integração com Redes Sociais
          </CardTitle>
          <CardDescription>
            Configure sua conexão com Facebook e Instagram para publicar matérias diretamente nas redes sociais.
            As publicações são feitas manualmente através do botão de compartilhamento ao salvar uma matéria.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Token Expiration Alert */}
      {isTokenExpiringSoon && (
        <Card className={isTokenExpired ? 'border-destructive bg-destructive/5' : 'border-orange-500 bg-orange-500/5'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${isTokenExpired ? 'text-destructive' : 'text-orange-500'}`} />
              <div>
                <p className={`font-medium ${isTokenExpired ? 'text-destructive' : 'text-orange-600'}`}>
                  {isTokenExpired 
                    ? '⚠️ Token do Meta expirado!' 
                    : `⚠️ Token expira em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}`
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTokenExpired 
                    ? 'Renove o token abaixo para continuar publicando nas redes sociais.'
                    : 'Renove o token em breve para evitar interrupções nas publicações.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configuração
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Facebook className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Facebook</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.facebook_page_id ? `Page ID: ${formData.facebook_page_id}` : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                  {formData.facebook_page_id ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-8 h-8 text-pink-600" />
                    <div>
                      <p className="font-medium">Instagram</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.instagram_user_id ? `User ID: ${formData.instagram_user_id}` : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                  {formData.instagram_user_id ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuração do Meta</CardTitle>
              <CardDescription>
                Insira os IDs da sua página do Facebook e conta do Instagram Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook_page_id">Facebook Page ID</Label>
                  <Input
                    id="facebook_page_id"
                    placeholder="Ex: 123456789012345"
                    value={formData.facebook_page_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebook_page_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_user_id">Instagram Business Account ID</Label>
                  <Input
                    id="instagram_user_id"
                    placeholder="Ex: 17841234567890123"
                    value={formData.instagram_user_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_user_id: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token (Long-lived)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="access_token"
                      type={showToken ? 'text' : 'password'}
                      placeholder="Cole seu Access Token aqui"
                      value={formData.access_token}
                      onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token_expires_at">Data de Expiração do Token</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="token_expires_at"
                    type="date"
                    value={formData.token_expires_at ? formData.token_expires_at.split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      token_expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' 
                    }))}
                    className="flex-1"
                  />
                  {formData.token_expires_at && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${getExpirationIndicatorColor()}`}>
                      <AlertCircle className="w-4 h-4" />
                      {(() => {
                        const days = getDaysUntilExpiration();
                        if (days === null) return '';
                        if (days <= 0) return 'Expirado!';
                        return `${days} dias restantes`;
                      })()}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao salvar um novo token, a data de expiração será calculada automaticamente para 60 dias.
                  Você receberá um aviso quando faltarem 10 dias para expirar.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={testConnection}>
                  Testar Conexão
                </Button>
                <Button asChild variant="ghost">
                  <a 
                    href="https://developers.facebook.com/tools/explorer/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Graph API Explorer
                  </a>
                </Button>
              </div>

              <Button onClick={saveConfigs} disabled={saving} className="w-full">
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Como Configurar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-2">
                <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.facebook.com</a> e crie um App</li>
                <li>Adicione os produtos: <strong>Facebook Login</strong> e <strong>Instagram Graph API</strong></li>
                <li>Vincule sua página do Facebook à conta do Instagram Business</li>
                <li>No Graph API Explorer, gere um token com as permissões:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>pages_manage_posts</li>
                    <li>pages_read_engagement</li>
                    <li>instagram_basic</li>
                    <li>instagram_content_publish</li>
                  </ul>
                </li>
                <li>Converta para um Long-lived Token (válido por ~60 dias)</li>
                <li>Copie os IDs e o token para os campos acima</li>
              </ol>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground mb-1">💡 Como publicar nas redes sociais?</p>
                <p>Ao salvar uma matéria como "Publicado", um modal aparecerá automaticamente permitindo que você publique no Facebook e Instagram com a arte customizada gerada pelo sistema.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Publicações</CardTitle>
              <CardDescription>
                Últimas 50 publicações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma publicação realizada ainda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(post.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(post.platform)}
                              <span className="capitalize">{post.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {post.is_columnist_article ? 'Colunista' : 'Matéria'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>
                            {post.error_message ? (
                              <span className="text-sm text-destructive">{post.error_message}</span>
                            ) : post.post_id ? (
                              <span className="text-sm text-muted-foreground">ID: {post.post_id.substring(0, 15)}...</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaConfigPanel;
