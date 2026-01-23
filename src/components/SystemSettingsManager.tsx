import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAIConfig } from '@/contexts/SupabaseAIConfigContext';
import { 
  Settings, 
  Brain, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Save,
  Key,
  Trash2,
  TestTube,
  FileEdit
} from 'lucide-react';
import { ENV } from '@/config/environment';
import { supabase } from '@/integrations/supabase/client';
import AIPromptEditor from '@/components/AIPromptEditor';
import TokenUsageDashboard from '@/components/TokenUsageDashboard';

const SystemSettingsManager = () => {
  const { toast } = useToast();
  const { configurations, addConfiguration, deleteConfiguration } = useSupabaseAIConfig();
  
  // Estados para configuração de IA
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('groq');
  const [aiModel, setAiModel] = useState('llama-3.1-8b-instant');
  const [showAiKey, setShowAiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);

  // Load saved model preference for Groq
  useEffect(() => {
    if (aiProvider === 'groq') {
      loadGroqModelPreference();
    }
  }, [aiProvider]);

  const loadGroqModelPreference = async () => {
    try {
      const { data } = await supabase.functions.invoke('groq-config', {
        body: { action: 'get' }
      });
      
      if (data?.success && data.model) {
        setAiModel(data.model);
      }
    } catch (error) {
      console.warn('Could not load Groq model preference:', error);
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
      // Use nossa edge function para testar a API de forma mais segura
      const { data, error } = await supabase.functions.invoke('ai-config-tester', {
        body: {
          provider: aiProvider,
          apiKey: aiApiKey,
          model: aiModel
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na comunicação com o servidor de teste');
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Teste da API falhou');
      }

      // Se o teste passou
      if (aiProvider === 'groq') {
        // Para Groq, salvamos a chave API E a preferência do modelo
        // Salvar chave na tabela ai_configurations (prioridade sobre env vars)
        const { error: saveError } = await addConfiguration({
          provider_name: 'groq',
          api_key_encrypted: aiApiKey, // Em produção, criptografar
          config_json: {
            model: aiModel,
            tested_at: new Date().toISOString(),
            last_test_success: true,
            available_models: data.availableModels || []
          }
        });

        if (saveError) throw new Error(saveError);

        // Também salvar preferência do modelo
        try {
          await supabase.functions.invoke('groq-config', {
            body: { action: 'set', model: aiModel }
          });
        } catch (configError) {
          console.warn('Could not save model preference:', configError);
        }
        
        toast({
          title: 'Configuração salva! ✅',
          description: `Groq configurado com sucesso usando ${data.modelTested}. A chave foi salva no banco de dados e será usada automaticamente.`,
        });
      } else {
        // Persistimos apenas provedores adicionais (OpenAI/Anthropic) vinculados ao usuário
        const { error: saveError } = await addConfiguration({
          provider_name: aiProvider,
          api_key_encrypted: aiApiKey, // Em produção, criptografar
          config_json: {
            model: aiModel,
            tested_at: new Date().toISOString(),
            last_test_success: true,
            available_models: data.availableModels || []
          }
        });
        
        if (saveError) throw new Error(saveError);
        
        toast({
          title: 'Configuração salva! ✅',
          description: `${aiProvider.toUpperCase()} configurado com sucesso usando ${data.modelTested}`,
        });
      }

      // Clear form
      setAiApiKey('');
      
    } catch (error: any) {
      console.error('Erro no teste de API:', error);
      toast({
        title: "Erro na configuração ❌",
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

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA / Extração
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Prompt de Reescrita
          </TabsTrigger>
        </TabsList>


        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-4">
          {/* Token Usage Dashboard */}
          <TokenUsageDashboard />
          
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
                    onChange={(e) => {
                      setAiProvider(e.target.value);
                      // Reset model when provider changes
                      if (e.target.value === 'groq') setAiModel('llama-3.1-8b-instant');
                      else if (e.target.value === 'openai') setAiModel('gpt-3.5-turbo');
                      else if (e.target.value === 'anthropic') setAiModel('claude-3-sonnet-20240229');
                    }}
                    className="w-full p-2 border border-primary/30 rounded-md bg-background"
                  >
                    <option value="groq">Groq (Llama, Mixtral - Recomendado)</option>
                    <option value="openai">OpenAI (GPT-3.5, GPT-4)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-model">Modelo</Label>
                  <select
                    id="ai-model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full p-2 border border-primary/30 rounded-md bg-background"
                  >
                    {aiProvider === 'groq' && (
                      <>
                        <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Mais Inteligente)</option>
                        <option value="llama-3.1-8b-instant">Llama 3.1 8B (Rápido - Recomendado)</option>
                        <option value="llama-3.2-1b-preview">Llama 3.2 1B (Muito Rápido)</option>
                        <option value="llama-3.2-3b-preview">Llama 3.2 3B (Balanceado)</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B (Contexto Longo)</option>
                        <option value="gemma2-9b-it">Gemma2 9B (Alternativo)</option>
                      </>
                    )}
                    {aiProvider === 'openai' && (
                      <>
                        <option value="gpt-4o-mini">GPT-4o Mini (Rápido e Econômico)</option>
                        <option value="gpt-4o">GPT-4o (Mais Capaz)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Clássico)</option>
                      </>
                    )}
                    {aiProvider === 'anthropic' && (
                      <>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Mais Recente)</option>
                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Estável)</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku (Rápido)</option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {aiProvider === 'groq' && 'Modelos Groq são gratuitos e muito rápidos'}
                    {aiProvider === 'openai' && 'Modelos OpenAI são pagos por uso'}
                    {aiProvider === 'anthropic' && 'Modelos Claude são pagos por uso'}
                  </p>
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
                        placeholder={aiProvider === 'groq' ? 'gsk_...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
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

              <Alert className="border-green-500/30 bg-green-50/10">
                <Key className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs">
                  <strong>✓ Autonomia Total:</strong> As chaves API são salvas diretamente no banco de dados do seu site.
                  <br />
                  <strong>Você não precisa acessar a Lovable</strong> para gerenciar suas configurações de IA.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>

        {/* Prompt Editor Tab */}
        <TabsContent value="prompt" className="space-y-4">
          <AIPromptEditor />
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
  const [runtimeEnv, setRuntimeEnv] = useState<any>({});

  useEffect(() => {
    // Check runtime environment
    setRuntimeEnv(ENV.RUNTIME_CONFIG);

    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('public-config');
        if (error) throw error;
        setActive(Boolean(data?.groqConfigured));
        
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
      <h5 className="text-sm font-medium">Status da IA e Variáveis Runtime</h5>
      <div className="p-3 bg-muted/20 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm">
              {loading ? 'Verificando...' : active ? 'Groq configurado via Supabase Secrets' : 'Groq não configurado no servidor'}
            </p>
          </div>
          {!loading && (
            active ? (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Ativo</div>
            ) : (
              <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">Pendente</div>
            )
          )}
        </div>
        
        {/* Runtime Environment Status */}
        <div className="mt-3 pt-2 border-t border-muted">
          <p className="text-xs font-medium text-muted-foreground mb-1">Variáveis Runtime (env.js):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries({
              'Groq API': runtimeEnv.GROQ_API_KEY,
              'Supabase URL': runtimeEnv.VITE_SUPABASE_URL,
              'App URL': runtimeEnv.VITE_APP_URL
            }).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
                  {value ? '✓' : '—'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Groq Model Status */}
          {active && (
            <div className="mt-2 pt-2 border-t border-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Modelo Groq:</span>
                <GroqModelIndicator />
              </div>
            </div>
          )}
        </div>
      </div>
      {!loading && active === false && (
        <Alert className="border-yellow-500/50 bg-yellow-50/10">
          <Key className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs">
            Configure GROQ_API_KEY no Easypanel (Ambiente) para injeção automática no env.js, ou defina em Supabase Secrets.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Componente para mostrar o modelo Groq atual
const GroqModelIndicator: React.FC = () => {
  const [currentModel, setCurrentModel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentModel();
  }, []);

  const loadCurrentModel = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('groq-config', {
        body: { action: 'get' }
      });
      
      if (data?.success && data.model) {
        setCurrentModel(data.model);
      }
    } catch (error) {
      console.warn('Could not load current Groq model:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-xs text-muted-foreground">Carregando...</span>;
  }

  const modelDisplayName = currentModel.replace(/-/g, ' ').replace(/llama/i, 'Llama').replace(/mixtral/i, 'Mixtral');

  return (
    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
      {modelDisplayName || 'Padrão'}
    </span>
  );
};

export default SystemSettingsManager;