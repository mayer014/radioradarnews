import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  RotateCcw, 
  Eye, 
  Info,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const DEFAULT_PROMPT = `Você é um jornalista especializado em reescrever notícias extraídas da web para um portal de notícias brasileiro.

Seu trabalho é transformar o conteúdo bruto em uma matéria jornalística de alta qualidade, seguindo os padrões profissionais do jornalismo.

## Diretrizes de Reescrita:

1. **Tom e Estilo**:
   - Use linguagem clara, objetiva e acessível ao público geral
   - Mantenha um tom jornalístico profissional, mas evite formalidade excessiva
   - Seja imparcial e evite opiniões pessoais

2. **Estrutura**:
   - Crie um título chamativo e informativo (máximo 120 caracteres)
   - Desenvolva uma linha fina/subtítulo que complemente o título
   - Elabore um lead (primeiro parágrafo) que responda às 5W1H quando possível
   - Organize o conteúdo em parágrafos curtos e bem estruturados
   - Use HTML simples: <p>, <strong>, <em>, <ul>, <li>

3. **Conteúdo**:
   - Reescreva completamente o texto, não copie trechos literais
   - Verifique e corrija erros gramaticais e ortográficos
   - Adicione contexto quando necessário
   - Cite a fonte original de forma adequada
   - Extraia e crie um resumo/excerpt de 2-3 linhas

4. **SEO e Categorização**:
   - Sugira uma categoria apropriada
   - Crie 5-7 tags relevantes
   - Gere um slug amigável para URL
   - Sugira um prompt para imagem representativa

## Formato de Saída (JSON):

\`\`\`json
{
  "title": "Título da matéria",
  "slug": "titulo-da-materia",
  "lead": "Linha fina/subtítulo complementar",
  "content": "<p>Conteúdo em HTML...</p>",
  "excerpt": "Resumo breve de 2-3 linhas",
  "category": "Categoria sugerida",
  "tags": ["tag1", "tag2", "tag3"],
  "imagePrompt": "Descrição para geração de imagem",
  "sourceAttribution": "Nome da fonte original",
  "sourceDomain": "dominio.com.br"
}
\`\`\`

Retorne APENAS o JSON, sem texto adicional antes ou depois.`;

const AIPromptEditor: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  useEffect(() => {
    setHasChanges(prompt !== originalPrompt);
  }, [prompt, originalPrompt]);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('category', 'ai')
        .eq('key', 'rewriter_system_prompt')
        .maybeSingle();

      if (error) throw error;

      const valueData = data?.value as { prompt?: string; updated_at?: string } | null;
      const loadedPrompt = valueData?.prompt || DEFAULT_PROMPT;
      const updated = valueData?.updated_at;
      
      setPrompt(loadedPrompt);
      setOriginalPrompt(loadedPrompt);
      
      if (updated) {
        setLastUpdated(new Date(updated).toLocaleString('pt-BR'));
      }
    } catch (error: any) {
      console.error('Error loading prompt:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o prompt. Usando padrão.",
        variant: "destructive"
      });
      setPrompt(DEFAULT_PROMPT);
      setOriginalPrompt(DEFAULT_PROMPT);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "O prompt não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('settings')
        .update({
          value: {
            prompt: prompt,
            updated_at: new Date().toISOString(),
            default: false
          },
          updated_at: new Date().toISOString()
        })
        .eq('category', 'ai')
        .eq('key', 'rewriter_system_prompt');

      if (error) throw error;

      setOriginalPrompt(prompt);
      setLastUpdated(new Date().toLocaleString('pt-BR'));

      toast({
        title: "✅ Prompt salvo",
        description: "O prompt de reescrita foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o prompt.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Tem certeza que deseja restaurar o prompt padrão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('settings')
        .update({
          value: {
            prompt: DEFAULT_PROMPT,
            updated_at: new Date().toISOString(),
            default: true
          },
          updated_at: new Date().toISOString()
        })
        .eq('category', 'ai')
        .eq('key', 'rewriter_system_prompt');

      if (error) throw error;

      setPrompt(DEFAULT_PROMPT);
      setOriginalPrompt(DEFAULT_PROMPT);
      setLastUpdated(new Date().toLocaleString('pt-BR'));

      toast({
        title: "✅ Prompt restaurado",
        description: "O prompt padrão foi restaurado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error restoring prompt:', error);
      toast({
        title: "Erro ao restaurar",
        description: error.message || "Não foi possível restaurar o prompt padrão.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview do Prompt</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                background: #f5f5f5;
                line-height: 1.6;
              }
              pre {
                background: white;
                padding: 20px;
                border-radius: 8px;
                overflow-x: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <h1>Preview do Prompt de Reescrita</h1>
            <pre>${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando prompt...</div>
      </div>
    );
  }

  const charCount = prompt.length;
  const maxChars = 10000;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Editor de Prompt de Reescrita
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure como a IA deve reescrever as matérias importadas
              </p>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Última atualização: {lastUpdated}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-editor" className="text-sm font-medium">
              Prompt do Sistema
            </Label>
            <Textarea
              id="prompt-editor"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm border-primary/30 focus:border-primary"
              placeholder="Digite o prompt que a IA deve seguir..."
            />
            <div className="flex justify-between items-center text-xs">
              <span className={charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} caracteres
              </span>
              {hasChanges && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertCircle className="h-3 w-3" />
                  Alterações não salvas
                </span>
              )}
            </div>
          </div>

          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1">
              <p><strong>Variáveis disponíveis no contexto da reescrita:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li><code className="bg-muted px-1 rounded">[TÍTULO_ORIGINAL]</code> - Título extraído da fonte</li>
                <li><code className="bg-muted px-1 rounded">[CONTEÚDO_ORIGINAL]</code> - Texto completo extraído</li>
                <li><code className="bg-muted px-1 rounded">[URL_FONTE]</code> - URL da matéria original</li>
                <li><code className="bg-muted px-1 rounded">[DOMÍNIO_FONTE]</code> - Domínio do site fonte</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges || charCount > maxChars}
              className="bg-gradient-hero hover:shadow-glow-primary flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>

            <Button
              onClick={handlePreview}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10 flex-1 sm:flex-initial"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>

            <Button
              onClick={handleRestore}
              variant="outline"
              disabled={saving}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIPromptEditor;