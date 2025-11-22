import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Radio, Save, Play, AlertCircle, Mic } from 'lucide-react';

/**
 * RadioManager Component
 * 
 * Gerencia a configuração da rádio online no painel administrativo.
 * Permite ao admin configurar a URL do stream de áudio que será
 * reproduzida no player de rádio do site.
 * 
 * Funcionalidades:
 * - Carregar URL atual do stream
 * - Atualizar URL do stream
 * - Testar stream antes de salvar
 * - Validação de URL
 */
const RadioManager = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();

  // Carregar configuração atual da rádio
  useEffect(() => {
    loadRadioSettings();
  }, []);

  const loadRadioSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        const url = typeof data.value === 'string' ? data.value : (data.value as any).url || '';
        setStreamUrl(url);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da rádio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações da rádio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!streamUrl.trim()) {
      toast({
        title: 'URL obrigatória',
        description: 'Por favor, insira a URL do stream',
        variant: 'destructive',
      });
      return;
    }

    // Validar URL
    try {
      new URL(streamUrl);
    } catch {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida (ex: https://exemplo.com/stream)',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('settings')
          .update({ 
            value: streamUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('settings')
          .insert({
            category: 'radio',
            key: 'stream_url',
            value: streamUrl
          });

        if (error) throw error;
      }

      toast({
        title: 'Configuração salva',
        description: 'A URL do stream foi atualizada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestStream = async () => {
    if (!streamUrl.trim()) {
      toast({
        title: 'URL obrigatória',
        description: 'Por favor, insira a URL do stream para testar',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);

    try {
      const audio = new Audio(streamUrl);
      
      // Tentar carregar o stream
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', resolve);
        audio.addEventListener('error', reject);
        audio.load();
        
        // Timeout de 10 segundos
        setTimeout(() => reject(new Error('Timeout')), 10000);
      });

      toast({
        title: 'Stream válido',
        description: 'O stream está acessível e pronto para uso',
      });

      audio.pause();
    } catch (error) {
      console.error('Erro ao testar stream:', error);
      toast({
        title: 'Erro no stream',
        description: 'Não foi possível conectar ao stream. Verifique a URL e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Acesso negado. Apenas administradores podem gerenciar a rádio.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Configuração da Rádio Online</h3>
            <p className="text-sm text-muted-foreground">
              Configure a URL do stream de áudio que será reproduzida no site
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="streamUrl" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              URL do Stream de Áudio
            </Label>
            <Input
              id="streamUrl"
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://cc6.streammaximum.com:20010/;"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Insira a URL completa do stream Shoutcast/Icecast
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTestStream}
              disabled={testing || !streamUrl.trim()}
              variant="outline"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Stream'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !streamUrl.trim()}
              className="flex-1 bg-gradient-hero"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-card border-primary/30 p-6">
        <h4 className="font-semibold mb-3">Instruções</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Cole a URL do stream fornecida pelo seu provedor de rádio</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>A URL geralmente termina com ponto e vírgula (;) ou porta (ex: :8000)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Teste o stream antes de salvar para garantir que está funcionando</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>O player de rádio será atualizado automaticamente após salvar</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default RadioManager;
