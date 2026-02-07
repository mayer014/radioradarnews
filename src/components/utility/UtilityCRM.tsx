import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useClickTracking } from '@/hooks/useClickTracking';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, TrendingUp, MousePointerClick, Wrench, Briefcase,
  Trophy, Calendar, Trash2, Shield, Users, AlertTriangle, Phone,
  MapPin, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// ─── Types ───────────────────────────────────────────────────
interface ClickStat {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  click_count: number;
  last_click: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  description: string;
  city: string;
  whatsapp: string;
  is_active: boolean;
  created_at: string;
}

interface JobListing {
  id: string;
  title: string;
  company: string;
  city: string;
  whatsapp: string;
  is_active: boolean;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────
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

// ─── Main Component ─────────────────────────────────────────
const UtilityCRM: React.FC = () => {
  const { toast } = useToast();
  const { getStats } = useClickTracking();
  const [stats, setStats] = useState<ClickStat[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('analytics');

  // Admin management state
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data } = await getStats(parseInt(period));
    setStats(data as ClickStat[]);
    setLoading(false);
  }, [period, getStats]);

  const loadManagementData = useCallback(async () => {
    setManagementLoading(true);
    const [provRes, jobRes] = await Promise.all([
      supabase.from('service_providers').select('id, name, description, city, whatsapp, is_active, created_at').order('created_at', { ascending: false }),
      supabase.from('job_listings').select('id, title, company, city, whatsapp, is_active, created_at').order('created_at', { ascending: false }),
    ]);
    setProviders((provRes.data || []) as ServiceProvider[]);
    setJobs((jobRes.data || []) as JobListing[]);
    setManagementLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [period]);

  useEffect(() => {
    if (mainTab === 'management') loadManagementData();
  }, [mainTab]);

  const handleDelete = async (type: 'service_provider' | 'job_listing', id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação é irreversível.`)) return;
    setDeletingId(id);
    const table = type === 'service_provider' ? 'service_providers' : 'job_listings';
    const { error } = await supabase.from(table).delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Excluído com sucesso', description: `"${name}" foi removido.` });
      loadManagementData();
    }
  };

  const handleToggleActive = async (type: 'service_provider' | 'job_listing', id: string, currentActive: boolean) => {
    const table = type === 'service_provider' ? 'service_providers' : 'job_listings';
    const { error } = await supabase.from(table).update({ is_active: !currentActive }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentActive ? 'Desativado' : 'Ativado' });
      loadManagementData();
    }
  };

  // Derived data
  const providerStats = stats.filter(s => s.entity_type === 'service_provider');
  const jobStats = stats.filter(s => s.entity_type === 'job_listing');
  const totalClicks = stats.reduce((sum, s) => sum + Number(s.click_count), 0);
  const totalProviderClicks = providerStats.reduce((s, p) => s + Number(p.click_count), 0);
  const totalJobClicks = jobStats.reduce((s, j) => s + Number(j.click_count), 0);

  const pieData = [
    { name: 'Prestadores', value: totalProviderClicks },
    { name: 'Vagas', value: totalJobClicks },
  ].filter(d => d.value > 0);

  const barData = [...stats]
    .sort((a, b) => Number(b.click_count) - Number(a.click_count))
    .slice(0, 8)
    .map(s => ({
      name: (s.entity_name || 'Sem nome').substring(0, 18),
      clicks: Number(s.click_count),
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
          <p className="text-sm text-muted-foreground mt-1">Métricas e gerenciamento</p>
        </div>
      </div>

      {/* Main Tabs: Analytics vs Management */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Métricas
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <Shield className="h-4 w-4" /> Gerenciar
          </TabsTrigger>
        </TabsList>

        {/* ─── Analytics Tab ─────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Period selector */}
          <div className="flex justify-end">
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
            <KPICard label="Total de Cliques" value={totalClicks} sub={periodLabel} icon={<MousePointerClick className="h-6 w-6 text-primary" />} bgClass="bg-primary/10" />
            <KPICard label="Prestadores" value={totalProviderClicks} sub={`${providerStats.length} ativos`} icon={<Wrench className="h-6 w-6 text-green-500" />} bgClass="bg-green-500/10" />
            <KPICard label="Vagas" value={totalJobClicks} sub={`${jobStats.length} ativas`} icon={<Briefcase className="h-6 w-6 text-blue-500" />} bgClass="bg-blue-500/10" />
          </div>

          {/* Charts */}
          {!loading && stats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <Bar dataKey="clicks" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

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
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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

          {/* Click Rankings */}
          <Tabs defaultValue="providers">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="providers" className="gap-2"><Wrench className="h-4 w-4" /> Prestadores</TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2"><Briefcase className="h-4 w-4" /> Vagas</TabsTrigger>
            </TabsList>
            <TabsContent value="providers">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Ranking de Prestadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingList items={providerStats} loading={loading} colorClass="bg-green-500" />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Ranking de Vagas</CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingList items={jobStats} loading={loading} colorClass="bg-blue-500" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ─── Management Tab ────────────────────────────── */}
        <TabsContent value="management" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Gerencie todos os cadastros de utilidade pública
            </p>
            <Button variant="outline" size="sm" onClick={loadManagementData} disabled={managementLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${managementLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          {/* Providers list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Prestadores de Serviço
                <Badge variant="secondary" className="ml-auto">{providers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {managementLoading ? (
                <LoadingSkeleton count={3} />
              ) : providers.length === 0 ? (
                <EmptyState text="Nenhum prestador cadastrado." />
              ) : (
                <div className="space-y-2">
                  {providers.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{p.name}</span>
                          <Badge variant={p.is_active ? 'default' : 'outline'} className="text-[10px]">
                            {p.is_active ? '✅ Ativo' : '⏸ Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.whatsapp}</span>
                          <span>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleToggleActive('service_provider', p.id, p.is_active)}
                        >
                          {p.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="destructive" size="sm"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete('service_provider', p.id, p.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Vagas de Emprego
                <Badge variant="secondary" className="ml-auto">{jobs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {managementLoading ? (
                <LoadingSkeleton count={3} />
              ) : jobs.length === 0 ? (
                <EmptyState text="Nenhuma vaga cadastrada." />
              ) : (
                <div className="space-y-2">
                  {jobs.map(j => (
                    <div key={j.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{j.title}</span>
                          <Badge variant={j.is_active ? 'default' : 'outline'} className="text-[10px]">
                            {j.is_active ? '✅ Ativa' : '⏸ Inativa'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium">{j.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.city}</span>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{j.whatsapp}</span>
                          <span>{new Date(j.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleToggleActive('job_listing', j.id, j.is_active)}
                        >
                          {j.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="destructive" size="sm"
                          disabled={deletingId === j.id}
                          onClick={() => handleDelete('job_listing', j.id, j.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────

const KPICard: React.FC<{ label: string; value: number; sub: string; icon: React.ReactNode; bgClass: string }> = ({ label, value, sub, icon, bgClass }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className={`h-12 w-12 rounded-full ${bgClass} flex items-center justify-center`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const RankingList: React.FC<{ items: ClickStat[]; loading: boolean; colorClass: string }> = ({ items, loading, colorClass }) => {
  if (loading) return <LoadingSkeleton count={3} />;
  if (items.length === 0) return <EmptyState text="Nenhum clique registrado no período." />;

  const maxClicks = Math.max(...items.map(s => Number(s.click_count)));

  return (
    <div className="space-y-2">
      {items.map((s, i) => {
        const pct = maxClicks > 0 ? (Number(s.click_count) / maxClicks) * 100 : 0;
        return (
          <div key={s.entity_id} className="relative overflow-hidden rounded-lg border p-3">
            <div className={`absolute inset-y-0 left-0 ${colorClass} opacity-10`} style={{ width: `${pct}%` }} />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="font-medium text-sm truncate">{s.entity_name || 'Sem nome'}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className="font-bold">{s.click_count}</Badge>
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

const LoadingSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
    ))}
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-muted-foreground text-center py-8">{text}</p>
);

export default UtilityCRM;
