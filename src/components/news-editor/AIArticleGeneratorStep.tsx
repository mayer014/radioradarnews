import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wand2, Loader2, Sparkles, FileText, Target, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import AIArticleGenerator from '@/services/AIArticleGenerator';

interface AIArticleGeneratorStepProps {
  onArticleGenerated: (article: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    selectedColumnist?: string;
  }) => void;
}

const AIArticleGeneratorStep: React.FC<AIArticleGeneratorStepProps> = ({ onArticleGenerated }) => {
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('');
  const [selectedColumnist, setSelectedColumnist] = useState('');
  const [tone, setTone] = useState<'formal' | 'informal' | 'investigativo' | 'opinativo'>('formal');
  const [length, setLength] = useState<'curto' | 'medio' | 'longo'>('medio');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { columnists } = useUsers();
  
  // Para colunistas, definir categoria automaticamente
  useEffect(() => {
    if (currentUser?.role === 'colunista' && !category) {
      setCategory('Artigo');
    }
  }, [currentUser?.role, category]);

  // Quando um colunista é selecionado, definir a categoria automaticamente
  useEffect(() => {
    if (selectedColumnist && selectedColumnist !== 'none') {
      const columnist = columnists.find(c => c.id === selectedColumnist);
      if (columnist) {
        setCategory(`Coluna ${columnist.name}`);
      }
    } else if (selectedColumnist === 'none') {
      setCategory('');
    }
  }, [selectedColumnist, columnists]);

  const categories = [
    'Política', 'Policial', 'Entretenimento', 'Internacional', 
    'Esportes', 'Tecnologia', 'Ciência / Saúde'
  ];

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva sua ideia para o artigo.",
        variant: "destructive",
      });
      return;
    }

    if (!category && currentUser?.role !== 'colunista' && (!selectedColumnist || selectedColumnist === 'none')) {
      toast({
        title: "Campo obrigatório", 
        description: "Por favor, selecione uma categoria ou um colunista.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se a IA está habilitada no sistema
    const aiConfig = localStorage.getItem('ai_config');
    let systemApiKey = '';
    
    if (aiConfig) {
      try {
        const config = JSON.parse(aiConfig);
        if (!config.enabled) {
          toast({
            title: "IA desabilitada",
            description: "A geração de artigos com IA está desabilitada pelo administrador.",
            variant: "destructive",
          });
          return;
        }
        systemApiKey = config.apiKey;
      } catch (error) {
        console.error('Erro ao carregar configuração da IA:', error);
      }
    }

    setIsGenerating(true);

    try {
      const generator = new AIArticleGenerator(systemApiKey);
      const result = await generator.generateArticle({
        idea,
        category,
        tone,
        length,
      });

      onArticleGenerated({
        title: result.title,
        excerpt: result.excerpt,
        content: result.content,
        category: selectedColumnist && selectedColumnist !== 'none' ? `Coluna ${columnists.find(c => c.id === selectedColumnist)?.name}` : result.suggestedCategory,
        selectedColumnist: selectedColumnist !== 'none' ? selectedColumnist : '',
      });

      toast({
        title: "Artigo gerado com sucesso!",
        description: `"${result.title}" foi criado e está pronto para revisão.`,
      });

    } catch (error) {
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : "Falha ao gerar artigo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toneDescriptions = {
    formal: "Linguagem técnica e imparcial, ideal para notícias e reportagens",
    informal: "Tom mais próximo e acessível, bom para matérias de interesse geral",
    investigativo: "Abordagem analítica e questionadora, própria para investigações",
    opinativo: "Tom reflexivo e argumentativo, adequado para artigos de opinião"
  };

  const lengthDescriptions = {
    curto: "1200-2000 palavras - Para análises consistentes e bem fundamentadas",
    medio: "2000-3200 palavras - Padrão profissional para artigos completos", 
    longo: "3200-4800 palavras - Para investigações jornalísticas aprofundadas"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gerador de Artigos IA
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descreva sua ideia e nossa IA criará um artigo jornalístico completo, bem estruturado e pronto para publicação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ideia do Artigo
              </CardTitle>
              <CardDescription>
                Descreva o tema, acontecimento ou questão que deseja transformar em artigo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="idea">Sua ideia *</Label>
                <Textarea
                  id="idea"
                  placeholder="Ex: 'Nova tecnologia de energia solar desenvolvida na universidade local' ou 'Análise sobre o impacto das redes sociais na política municipal'"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-24 mt-2"
                />
              </div>

              {/* Seleção de Colunista para Admins */}
              {currentUser?.role === 'admin' && (
                <div>
                  <Label htmlFor="columnist">Escrever para Colunista (opcional)</Label>
                  <Select value={selectedColumnist} onValueChange={setSelectedColumnist}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione um colunista ou deixe vazio para artigo normal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Artigo normal (não para colunista)</SelectItem>
                      {columnists.filter(c => c.columnistProfile?.isActive).map((columnist) => (
                        <SelectItem key={columnist.id} value={columnist.id}>
                          {columnist.name} - {columnist.columnistProfile?.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedColumnist && (
                    <p className="text-xs text-muted-foreground mt-1">
                      O artigo será criado automaticamente para a coluna do colunista selecionado.
                    </p>
                  )}
                </div>
              )}

              {/* Categoria - apenas para admins quando não selecionaram colunista, colunistas têm categoria fixa */}
              {currentUser?.role === 'admin' && (!selectedColumnist || selectedColumnist === 'none') && (
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Informação sobre categoria automática */}
              {(currentUser?.role === 'colunista' || (selectedColumnist && selectedColumnist !== 'none')) && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/50">
                      {selectedColumnist && selectedColumnist !== 'none' ? `Coluna ${columnists.find(c => c.id === selectedColumnist)?.name}` : 'Artigo'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedColumnist && selectedColumnist !== 'none' ? 'Categoria automática para o colunista selecionado' : 'Categoria automática para colunistas'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configurações do Artigo
              </CardTitle>
              <CardDescription>
                Personalize o tom e extensão do seu artigo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tom do Artigo</Label>
                <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="informal">Informal</SelectItem>
                    <SelectItem value="investigativo">Investigativo</SelectItem>
                    <SelectItem value="opinativo">Opinativo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {toneDescriptions[tone]}
                </p>
              </div>

              <div>
                <Label>Extensão do Artigo</Label>
                <Select value={length} onValueChange={(value: any) => setLength(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curto">Curto</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="longo">Longo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {lengthDescriptions[length]}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de API removida - agora é central */}
        </div>

        {/* Preview e Ações */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-lg">Prévia da Geração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedColumnist && selectedColumnist !== 'none' ? `Coluna ${columnists.find(c => c.id === selectedColumnist)?.name}` : 
                   category || 'Categoria não selecionada'}
                </Badge>
                {selectedColumnist && selectedColumnist !== 'none' && (
                  <Badge variant="secondary" className="text-xs">
                    Para Colunista
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Tom:</strong> {tone}
                <br />
                <strong>Extensão:</strong> {length}
              </div>
              
              <Separator className="my-3" />
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Título otimizado para SEO</p>
                <p>✓ Estrutura jornalística profissional</p>
                <p>✓ Conteúdo formatado em HTML</p>
                <p>✓ Resumo/lead automático</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !idea.trim() || (!category && currentUser?.role !== 'colunista' && (!selectedColumnist || selectedColumnist === 'none'))}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-6"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando artigo...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Gerar Artigo com IA
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            A geração pode levar alguns segundos. O artigo será automaticamente preenchido nos próximos passos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIArticleGeneratorStep;