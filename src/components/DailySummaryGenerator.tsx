import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Newspaper, 
  Copy, 
  Loader2, 
  CheckCircle,
  Calendar,
  Mic
} from 'lucide-react';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ArticleSummary {
  title: string;
  category: string;
  summary: string;
}

interface DailySummaryResult {
  date: string;
  totalArticles: number;
  summaries: ArticleSummary[];
  fullText: string;
}

const DailySummaryGenerator: React.FC = () => {
  const { articles } = useSupabaseNews();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<DailySummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtrar artigos publicados hoje
  const getTodayArticles = () => {
    const today = new Date();
    return articles.filter(article => {
      if (article.status !== 'published') return false;
      const articleDate = new Date(article.created_at);
      return isToday(articleDate);
    });
  };

  const generateSummary = async () => {
    const todayArticles = getTodayArticles();
    
    if (todayArticles.length === 0) {
      toast({
        title: "Nenhuma matéria hoje",
        description: "Não há matérias publicadas no dia de hoje.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      // Preparar dados das matérias para enviar à IA
      const articlesData = todayArticles.map(article => ({
        title: article.title,
        category: article.category,
        excerpt: article.excerpt || '',
        content: article.content?.substring(0, 500) || '' // Limitar conteúdo para não sobrecarregar
      }));

      // Chamar edge function para gerar resumos
      const { data, error } = await supabase.functions.invoke('daily-summary-generator', {
        body: { articles: articlesData }
      });

      if (error) throw error;

      const summaries: ArticleSummary[] = data.summaries || [];
      
      // Montar texto completo para leitura em rádio
      const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
      
      let fullText = `📻 RESUMO DO DIA - ${today.toUpperCase()}\n\n`;
      fullText += `Confira as principais notícias de hoje na Rádio Radar News:\n\n`;
      fullText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Agrupar por categoria
      const byCategory: Record<string, ArticleSummary[]> = {};
      summaries.forEach(summary => {
        if (!byCategory[summary.category]) {
          byCategory[summary.category] = [];
        }
        byCategory[summary.category].push(summary);
      });

      Object.entries(byCategory).forEach(([category, items]) => {
        fullText += `📌 ${category.toUpperCase()}\n\n`;
        items.forEach((item, index) => {
          fullText += `▶ ${item.title}\n`;
          fullText += `${item.summary}\n\n`;
        });
        fullText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      });

      fullText += `📡 Essas foram as principais notícias de hoje.\n`;
      fullText += `Acompanhe a Rádio Radar News para mais informações.\n`;
      fullText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      setResult({
        date: today,
        totalArticles: todayArticles.length,
        summaries,
        fullText
      });

      toast({
        title: "Resumo gerado!",
        description: `${summaries.length} matérias resumidas com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast({
        title: "Erro ao gerar resumo",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.fullText) return;
    
    try {
      await navigator.clipboard.writeText(result.fullText);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "O resumo foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive"
      });
    }
  };

  const todayCount = getTodayArticles().length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Resumo do Dia para Rádio
          </CardTitle>
          <CardDescription>
            Gere um resumo de todas as matérias publicadas hoje, pronto para leitura ao vivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {todayCount} {todayCount === 1 ? 'matéria publicada' : 'matérias publicadas'} hoje
              </p>
            </div>
          </div>

          <Button
            onClick={generateSummary}
            disabled={isGenerating || todayCount === 0}
            className="w-full bg-gradient-hero hover:shadow-glow-primary"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando Resumo...
              </>
            ) : (
              <>
                <Newspaper className="h-5 w-5 mr-2" />
                Gerar Resumo Diário
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gradient-card border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resumo Gerado
              </CardTitle>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="border-primary/50"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Tudo
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              {result.totalArticles} matérias resumidas • {result.date}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background/80 border border-primary/20 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {result.fullText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailySummaryGenerator;
