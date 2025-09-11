import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Key,
  Trash2,
  TestTube
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  testEndpoint: string;
  models: string[];
  keyPlaceholder: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, e outros modelos da OpenAI',
    testEndpoint: 'https://api.openai.com/v1/models',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    keyPlaceholder: 'sk-...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, e outros',
    testEndpoint: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    keyPlaceholder: 'sk-ant-...'
  },
  {
    id: 'glm',
    name: 'GLM-4.5',
    description: 'GLM-4.5 da Zhipu AI (API chinesa)',
    testEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-0520', 'glm-4', 'glm-4-air', 'glm-4-airx', 'glm-4-flash'],
    keyPlaceholder: 'Sua chave da Zhipu AI'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Llama, Mixtral e outros modelos rápidos',
    testEndpoint: 'https://api.groq.com/openai/v1/models',
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    keyPlaceholder: 'gsk_...'
  }
];

interface AIConfigPanelProps {
  onConfigChange?: (isConfigured: boolean) => void;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ onConfigChange }) => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, { model: string; status: 'success' | 'error' }>>({});

  useEffect(() => {
    // Load saved configurations
    const savedConfig = localStorage.getItem('ai_providers_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setConfiguredProviders(config);
        onConfigChange?.(Object.keys(config).length > 0);
      } catch (error) {
        console.error('Error loading AI config:', error);
      }
    }
  }, [onConfigChange]);

  const saveConfiguration = (providerId: string, model: string, key: string, status: 'success' | 'error') => {
    const newConfig = {
      ...configuredProviders,
      [providerId]: { model, status }
    };
    
    setConfiguredProviders(newConfig);
    localStorage.setItem('ai_providers_config', JSON.stringify(newConfig));
    localStorage.setItem(`ai_key_${providerId}`, key);
    
    onConfigChange?.(Object.keys(newConfig).length > 0);
  };

  const removeConfiguration = (providerId: string) => {
    const newConfig = { ...configuredProviders };
    delete newConfig[providerId];
    
    setConfiguredProviders(newConfig);
    localStorage.setItem('ai_providers_config', JSON.stringify(newConfig));
    localStorage.removeItem(`ai_key_${providerId}`);
    
    onConfigChange?.(Object.keys(newConfig).length > 0);
    
    toast({
      title: "Configuração removida",
      description: `Provider ${AI_PROVIDERS.find(p => p.id === providerId)?.name} foi removido.`,
    });
  };

  const testConnection = async () => {
    if (!selectedProvider || !apiKey || !selectedModel) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um provider, insira a chave API e escolha um modelo.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    const provider = AI_PROVIDERS.find(p => p.id === selectedProvider);
    if (!provider) return;

    try {
      let response;
      
      if (selectedProvider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          })
        });
      } else if (selectedProvider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Test' }]
          })
        });
      } else if (selectedProvider === 'glm') {
        response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          })
        });
      } else if (selectedProvider === 'groq') {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          })
        });
      }

      if (response && response.ok) {
        setConnectionStatus('success');
        saveConfiguration(selectedProvider, selectedModel, apiKey, 'success');
        
        toast({
          title: "Conexão bem-sucedida!",
          description: `${provider.name} configurado com sucesso.`,
        });
        
        // Clear form
        setSelectedProvider('');
        setApiKey('');
        setSelectedModel('');
      } else {
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
      }
      
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Falha na conexão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const selectedProviderData = AI_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <Card className="bg-gradient-card border-primary/30 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-hero rounded-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Configuração de IA</h3>
            <p className="text-sm text-muted-foreground">
              Configure APIs externas para reescrita inteligente de conteúdo
            </p>
          </div>
        </div>

        {/* Configured Providers */}
        {Object.keys(configuredProviders).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Providers Configurados</h4>
            <div className="space-y-2">
              {Object.entries(configuredProviders).map(([providerId, config]) => {
                const provider = AI_PROVIDERS.find(p => p.id === providerId);
                if (!provider) return null;

                return (
                  <div key={providerId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {config.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">Modelo: {config.model}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeConfiguration(providerId)}
                      className="border-red-500/50 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Provider */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Adicionar Novo Provider</h4>
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider de IA</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provider" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          {selectedProvider && (
            <div className="space-y-2">
              <Label htmlFor="api-key">Chave da API</Label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProviderData?.keyPlaceholder}
                    className="pl-10 border-primary/30 focus:border-primary"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  className="border-primary/50"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {selectedProvider && selectedProviderData && (
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProviderData.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Test Button */}
          {selectedProvider && apiKey && selectedModel && (
            <Button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="w-full bg-gradient-hero hover:shadow-glow-primary"
            >
              {isTestingConnection ? (
                <>
                  <TestTube className="h-4 w-4 mr-2 animate-pulse" />
                  Testando conexão...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar e Salvar Configuração
                </>
              )}
            </Button>
          )}

          {/* Connection Status */}
          {connectionStatus !== 'idle' && (
            <Alert className={connectionStatus === 'success' ? 'border-green-500/50 bg-green-50/10' : 'border-red-500/50 bg-red-50/10'}>
              {connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                {connectionStatus === 'success' 
                  ? 'Conexão testada com sucesso! Provider configurado e pronto para uso.'
                  : 'Falha na conexão. Verifique sua chave API e tente novamente.'
                }
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Info */}
        <Alert className="border-primary/30 bg-primary/5">
          <Key className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Segurança:</strong> As chaves API são armazenadas localmente no seu navegador 
            e nunca são enviadas para nossos servidores. Configure pelo menos um provider para 
            habilitar a reescrita inteligente de conteúdo.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
};

export default AIConfigPanel;