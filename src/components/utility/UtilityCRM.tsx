import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useClickTracking } from '@/hooks/useClickTracking';
import { BarChart3, TrendingUp, MousePointerClick, Wrench, Briefcase, Trophy, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ClickStat {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  click_count: number;
  last_click: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(142 76% 36%)',
  'hsl(217 91% 60%)',
  'hsl(280 67% 55%)',
  'hsl(25 95% 53%)',
];

const chartConfig = {
  clicks: { label: 'Cliques', color: 'hsl(var(--primary))' },
  providers: { label: 'Prestadores', color: 'hsl(142 76% 36%)' },
  jobs: { label: 'Vagas', color: 'hsl(217 91% 60%)' },
};

const UtilityCRM: React.FC = () => {
  const { getStats } = useClickTracking();
  const [stats, setStats] = useState<ClickStat[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const { data } = await getStats(parseInt(period));
    setStats(data as ClickStat[]);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, [period]);

  const providerStats = stats.filter(s => s.entity_type === 'service_provider');
  const jobStats = stats.filter(s => s.entity_type === 'job_listing');
  const totalClicks = stats.reduce((sum, s) => sum + Number(s.click_count), 0);
  const totalProviderClicks = providerStats.reduce((s, p) => s + Number(p.click_count), 0);
  const totalJobClicks = jobStats.reduce((s, j) => s + Number(j.click_count), 0);

  // Data for pie chart
  const pieData = [
    { name: 'Prestadores', value: totalProviderClicks },
    { name: 'Vagas', value: totalJobClicks },
  ].filter(d => d.value > 0);

  // Data for bar chart (top 8)
  const barData = [...stats]
    .sort((a, b) => Number(b.click_count) - Number(a.click_count))
    .slice(0, 8)
    .map(s => ({
      name: (s.entity_name || 'Sem nome').substring(0, 18),
      clicks: Number(s.click_count),
      type: s.entity_type,
    }));

  const periodLabel = { '1': 'Hoje', '7': '7 dias', '30': '30 dias', '90': '90 dias' }[period] || period;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            CRM – Utilidade Pública
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de engajamento e conversão
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hoje</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cliques</p>
                <p className="text-3xl font-bold mt-1">{totalClicks}</p>
                <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prestadores</p>
                <p className="text-3xl font-bold mt-1">{totalProviderClicks}</p>
                <p className="text-xs text-muted-foreground mt-1">{providerStats.length} ativos</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vagas</p>
                <p className="text-3xl font-bold mt-1">{totalJobClicks}</p>
                <p className="text-xs text-muted-foreground mt-1">{jobStats.length} ativas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {!loading && stats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart - Top Clicados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Mais Clicados
              </CardTitle>
              <CardDescription>Top 8 por volume de cliques</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="clicks"
                    radius={[0, 4, 4, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribuição */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Distribuição
              </CardTitle>
              <CardDescription>Prestadores vs Vagas</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[280px] w-full max-w-[300px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rankings Tabs */}
      <Tabs defaultValue="providers">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="providers" className="gap-2">
            <Wrench className="h-4 w-4" /> Prestadores
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" /> Vagas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Ranking de Prestadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingList items={providerStats} loading={loading} colorClass="bg-green-500" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Ranking de Vagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingList items={jobStats} loading={loading} colorClass="bg-blue-500" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const RankingList: React.FC<{
  items: ClickStat[];
  loading: boolean;
  colorClass: string;
}> = ({ items, loading, colorClass }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum clique registrado no período.
      </p>
    );
  }

  const maxClicks = Math.max(...items.map(s => Number(s.click_count)));

  return (
    <div className="space-y-2">
      {items.map((s, i) => {
        const pct = maxClicks > 0 ? (Number(s.click_count) / maxClicks) * 100 : 0;
        return (
          <div key={s.entity_id} className="relative overflow-hidden rounded-lg border p-3">
            {/* Progress bar background */}
            <div
              className={`absolute inset-y-0 left-0 ${colorClass} opacity-10`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-medium text-sm truncate">
                  {s.entity_name || 'Sem nome'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className="font-bold">
                  {s.click_count}
                </Badge>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {new Date(s.last_click).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UtilityCRM;
