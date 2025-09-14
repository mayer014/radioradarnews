import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProgramming } from '@/contexts/SupabaseProgrammingContext';
import { useSupabaseAIConfig } from '@/contexts/SupabaseAIConfigContext';
import { 
  Settings, 
  Radio, 
  Brain, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Save,
  Key,
  Trash2,
  TestTube
} from 'lucide-react';

const SystemSettingsManager = () => {
  const { toast } = useToast();
  const { radioStreamUrl, setRadioStreamUrl } = useSupabaseProgramming();
  const { configurations, addConfiguration, deleteConfiguration } = useSupabaseAIConfig();
  
  // Estados para configuração da rádio
  const [radioUrl, setRadioUrl] = useState('');
  const [savingRadio, setSavingRadio] = useState(false);
  
  // Estados para configuração de IA
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [showAiKey, setShowAiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    setRadioUrl(radioStreamUrl);
  }, [radioStreamUrl]);

  const handleSaveRadioUrl = async () => {
    if (!radioUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Digite uma URL válida para o stream da rádio.",
        variant: "destructive"
      });
      return;
    }

    setSavingRadio(true);
    try {
      const { error } = await setRadioStreamUrl(radioUrl);
      if (error) {
        throw new Error(error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar URL da rádio",
        variant: "destructive"
      });
    } finally {
      setSavingRadio(false);
    }
  };

  const handleTestAndSaveAI = async () => {
    if (!aiApiKey.trim()) {
      toast({
        title: "Chave obrigatória",
        description: "Digite uma chave API válida.",
        variant: "destructive"
      });
      return;
    }

    setTestingAi(true);
    try {
      // Test the API first
      let testEndpoint = '';
      let testHeaders: Record<string, string> = {};
      let testBody: any = {};

      if (aiProvider === 'openai') {
        testEndpoint = 'https://api.openai.com/v1/chat/completions';
        testHeaders = {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json'
        };
        testBody = {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        };
      } else if (aiProvider === 'anthropic') {
        testEndpoint = 'https://api.anthropic.com/v1/messages';
        testHeaders = {
          'x-api-key': aiApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        };
        testBody = {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Test' }]
        };
      }

      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify(testBody)
      });

      if (!response.ok) {
        throw new Error(`API Test Failed: ${response.status} ${response.statusText}`);
      }

      // If test passes, save to Supabase
      const { error } = await addConfiguration({
        provider_name: aiProvider,
        api_key_encrypted: aiApiKey, // In production, this should be encrypted
        config_json: {
          model: aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet-20240229',
          tested_at: new Date().toISOString()
        }
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Configuração salva",
        description: `API ${aiProvider} testada e configurada com sucesso.`,
      });

      // Clear form
      setAiApiKey('');
    } catch (error: any) {
      toast({
        title: "Erro na configuração",
        description: error.message || "Erro ao testar/salvar configuração de IA",
        variant: "destructive"
      });
    } finally {
      setTestingAi(false);
    }
  };

  const handleDeleteAIConfig = async (configId: string, providerName: string) => {
    try {
      const { error } = await deleteConfiguration(configId);
      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Configuração removida",
        description: `Configuração ${providerName} foi removida.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover configuração",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-hero rounded-lg">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as configurações principais do site. Variáveis agora usam ambiente do servidor (runtime) com fallback seguro.
          </p>
        </div>
      </div>

      <Tabs defaultValue="radio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="radio" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Rádio
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA / Extração
          </TabsTrigger>
        </TabsList>

        {/* Radio Configuration */}
        <TabsContent value="radio" className="space-y-4">
          <Card className="bg-gradient-card border-primary/30 p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Radio className="h-5 w-5 text-primary" />
                <h4 className="text-md font-semibold">Stream da Rádio</h4>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="radio-url">URL do Stream</Label>
                <div className="flex space-x-2">
                  <Input
                    id="radio-url"
                    type="url"
                    value={radioUrl}
                    onChange={(e) => setRadioUrl(e.target.value)}
                    placeholder="https://seu-stream.com/radio"
                    className="flex-1 border-primary/30 focus:border-primary"
                  />
                  <Button
                    onClick={handleSaveRadioUrl}
                    disabled={savingRadio || !radioUrl.trim()}
                    className="bg-gradient-hero hover:shadow-glow-primary"
                  >
                    {savingRadio ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {radioStreamUrl && (
                <Alert className="border-green-500/50 bg-green-50/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>Stream configurado:</strong> {radioStreamUrl}
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="border-primary/30 bg-primary/5">
                <Radio className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Formato:</strong> Insira a URL completa do stream de rádio. 
                  Exemplo: https://streaming.provedor.com:8000/radio
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="bg-gradient-card border-primary/30 p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h4 className="text-md font-semibold">APIs de Inteligência Artificial</h4>
                </div>

               {/* Configured AIs */}
               <GroqStatus />
               <div className="space-y-3">
                 <h5 className="text-sm font-medium">APIs Configuradas</h5>
                 <div className="space-y-2">
                   {/* Show other configured providers */}
                   {configurations.map((config) => (
                     <div key={config.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                       <div className="flex items-center space-x-3">
                         <CheckCircle className="h-4 w-4 text-green-500" />
                         <div>
                           <p className="text-sm font-medium capitalize">{config.provider_name}</p>
                           <p className="text-xs text-muted-foreground">
                             Modelo: {config.config_json?.model || 'Padrão'}
                           </p>
                         </div>
                       </div>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleDeleteAIConfig(config.id, config.provider_name)}
                         className="border-red-500/50 hover:bg-red-500/10"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>

              {/* Add New AI */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Adicionar Nova API</h5>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">Provider</Label>
                  <select
                    id="ai-provider"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full p-2 border border-primary/30 rounded-md bg-background"
                  >
                    <option value="openai">OpenAI (GPT-3.5, GPT-4)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-key">Chave da API</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ai-key"
                        type={showAiKey ? 'text' : 'password'}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                        className="pl-10 border-primary/30 focus:border-primary"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="border-primary/50"
                    >
                      {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleTestAndSaveAI}
                  disabled={testingAi || !aiApiKey.trim()}
                  className="w-full bg-gradient-hero hover:shadow-glow-primary"
                >
                  {testingAi ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-pulse" />
                      Testando e Salvando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar e Salvar
                    </>
                  )}
                </Button>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <Key className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>IA Principal (Groq):</strong> Configurada automaticamente via Supabase Secrets para máxima segurança.
                  <br />
                  <strong>APIs Adicionais:</strong> Podem ser configuradas aqui como fallback secundário.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component to show secure Groq status from Edge Function
const GroqStatus: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<boolean | null>(null);
  const [radioEnv, setRadioEnv] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('public-config');
        if (error) throw error;
        setActive(Boolean(data?.groqConfigured));
        setRadioEnv(data?.radioStreamUrl || '');
      } catch (e: any) {
        setActive(null);
        toast({ title: 'Aviso', description: 'Não foi possível verificar o status da IA Groq.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium">Status da IA Principal (Groq)</h5>
      <div className="p-3 bg-muted/20 rounded-lg border flex items-center justify-between">
        <div>
          <p className="text-sm">
            {loading ? 'Verificando...' : active ? 'Groq configurado via servidor (Supabase Secrets)' : 'Groq não configurado no servidor'}
          </p>
          {radioEnv && (
            <p className="text-xs text-muted-foreground">Rádio (runtime): {radioEnv}</p>
          )}
        </div>
        {!loading && (
          active ? (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Ativo</div>
          ) : (
            <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">Pendente</div>
          )
        )}
      </div>
      {!loading && active === false && (
        <Alert className="border-yellow-500/50 bg-yellow-50/10">
          <Key className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs">
            Defina a variável segura GROQ_API_KEY em Supabase Secrets para habilitar a IA. Por segurança, a chave não é salva no navegador.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SystemSettingsManager;