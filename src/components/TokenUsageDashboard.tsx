import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  RefreshCw,
  DollarSign,
  Zap
} from 'lucide-react';

interface UsageStats {
  today: { tokens: number; cost: number; requests: number };
  week: { tokens: number; cost: number; requests: number };
  month: { tokens: number; cost: number; requests: number };
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

// Tabela de custos por modelo Groq (USD por 1M tokens)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.2-1b-preview': { input: 0.04, output: 0.04 },
  'llama-3.2-3b-preview': { input: 0.06, output: 0.06 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  'gemma2-9b-it': { input: 0.20, output: 0.20 },
};

// Cotação aproximada USD -> BRL
const USD_TO_BRL = 5.50;

const TokenUsageDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    today: { tokens: 0, cost: 0, requests: 0 },
    week: { tokens: 0, cost: 0, requests: 0 },
    month: { tokens: 0, cost: 0, requests: 0 },
  });
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // Buscar dados agregados dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logs, error } = await supabase
        .from('llm_usage_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usage logs:', error);
        // Se não tiver permissão, mostrar dados zerados
        setLoading(false);
        return;
      }

      if (!logs || logs.length === 0) {
        setLoading(false);
        setLastRefresh(new Date());
        return;
      }

      // Calcular estatísticas
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);

      const todayLogs = logs.filter(l => new Date(l.created_at) >= todayStart);
      const weekLogs = logs.filter(l => new Date(l.created_at) >= weekStart);

      const aggregateLogs = (logList: typeof logs) => ({
        tokens: logList.reduce((sum, l) => sum + (l.total_tokens || 0), 0),
        cost: logList.reduce((sum, l) => sum + Number(l.cost_usd || 0), 0),
        requests: logList.length,
      });

      setStats({
        today: aggregateLogs(todayLogs),
        week: aggregateLogs(weekLogs),
        month: aggregateLogs(logs),
      });

      // Agrupar por dia para o gráfico (últimos 7 dias)
      const dailyMap = new Map<string, DailyUsage>();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Inicializar todos os dias
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap.set(key, { date: key, tokens: 0, cost: 0, requests: 0 });
      }

      // Preencher com dados reais
      logs.forEach(log => {
        const logDate = new Date(log.created_at);
        if (logDate >= sevenDaysAgo) {
          const key = logDate.toISOString().split('T')[0];
          const existing = dailyMap.get(key);
          if (existing) {
            existing.tokens += log.total_tokens || 0;
            existing.cost += Number(log.cost_usd || 0);
            existing.requests += 1;
          }
        }
      });

      // Converter para array ordenado
      const dailyArray = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        }));

      setDailyData(dailyArray);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('Error in fetchUsageData:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar dados de consumo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatCostBRL = (costUSD: number) => {
    const brl = costUSD * USD_TO_BRL;
    return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCostUSD = (costUSD: number) => {
    return `$${costUSD.toFixed(6)}`;
  };

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-background to-muted/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Consumo de IA</h4>
              <p className="text-xs text-muted-foreground">Tokens utilizados e custos estimados</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsageData}
            disabled={loading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Hoje */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Hoje</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatTokens(stats.today.tokens)}
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ {formatCostBRL(stats.today.cost)}
            </div>
            <Badge variant="outline" className="mt-1 text-xs">
              {stats.today.requests} req
            </Badge>
          </div>

          {/* Semana */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Semana</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatTokens(stats.week.tokens)}
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ {formatCostBRL(stats.week.cost)}
            </div>
            <Badge variant="outline" className="mt-1 text-xs">
              {stats.week.requests} req
            </Badge>
          </div>

          {/* Mês */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Mês</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatTokens(stats.month.tokens)}
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ {formatCostBRL(stats.month.cost)}
            </div>
            <Badge variant="outline" className="mt-1 text-xs">
              {stats.month.requests} req
            </Badge>
          </div>
        </div>

        {/* Gráfico de barras - últimos 7 dias */}
        {dailyData.length > 0 && stats.month.requests > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-1 mb-2">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Uso por dia (últimos 7 dias)</span>
            </div>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatTokens(v)}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatTokens(value), 'Tokens']}
                    labelFormatter={(label) => `📅 ${label}`}
                  />
                  <Bar 
                    dataKey="tokens" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Info sobre custos */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            💡 Custos baseados em preços Groq ({formatCostUSD(MODEL_COSTS['llama-3.1-8b-instant'].input)}/1M input) 
            • Cotação: 1 USD = R$ {USD_TO_BRL.toFixed(2)}
          </p>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TokenUsageDashboard;
