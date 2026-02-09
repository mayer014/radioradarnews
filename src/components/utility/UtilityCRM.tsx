import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useClickTracking } from '@/hooks/useClickTracking';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, TrendingUp, MousePointerClick, Wrench, Briefcase,
  Trophy, Calendar, Trash2, Shield, Phone, MapPin, RefreshCw,
  Search, KeyRound, Users, Eye, EyeOff, Share2,
} from 'lucide-react';
import { UtilitySocialMediaModal } from './UtilitySocialMediaModal';
import { UtilityArtData } from '@/utils/utilityArtGenerator';
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
  id: string; name: string; description: string; city: string;
  whatsapp: string; is_active: boolean; created_at: string; user_id: string;
}

interface JobListing {
  id: string; title: string; company: string; city: string;
  whatsapp: string; is_active: boolean; created_at: string; user_id: string;
  job_type?: string; salary?: string;
}

interface PublicUser {
  id: string; full_name: string; email: string; phone: string | null;
  city: string | null; is_active: boolean; created_at: string;
}

// ─── Constants ───────────────────────────────────────────────
const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--secondary))',
  'hsl(142 76% 36%)', 'hsl(217 91% 60%)',
  'hsl(280 67% 55%)', 'hsl(25 95% 53%)',
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
  const [managementTab, setManagementTab] = useState('providers');

  // Management state
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [providerSearch, setProviderSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Password reset state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Social media modal state
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialModalData, setSocialModalData] = useState<UtilityArtData | null>(null);
  const [socialModalEntityId, setSocialModalEntityId] = useState<string | undefined>();
  const [socialModalEntityType, setSocialModalEntityType] = useState<'service_provider' | 'job_listing' | undefined>();
  
  // Shared tracking: set of entity IDs that have been shared
  const [sharedIds, setSharedIds] = useState<Record<string, Set<string>>>({});

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data } = await getStats(parseInt(period));
    setStats(data as ClickStat[]);
    setLoading(false);
  }, [period, getStats]);

  const loadManagementData = useCallback(async () => {
    setManagementLoading(true);
    const [provRes, jobRes, usersRes, sharedRes] = await Promise.all([
      supabase.from('service_providers').select('id, name, description, city, whatsapp, is_active, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('job_listings').select('id, title, company, city, whatsapp, is_active, created_at, user_id, job_type, salary').order('created_at', { ascending: false }),
      supabase.from('public_user_profiles').select('id, full_name, email, phone, city, is_active, created_at').order('created_at', { ascending: false }),
      supabase.from('utility_click_tracking').select('entity_id, action').like('action', 'social_shared_%'),
    ]);
    setProviders((provRes.data || []) as ServiceProvider[]);
    setJobs((jobRes.data || []) as JobListing[]);
    setPublicUsers((usersRes.data || []) as PublicUser[]);
    
    // Build shared IDs map: { entityId: Set<platform> }
    const shared: Record<string, Set<string>> = {};
    (sharedRes.data || []).forEach((row: { entity_id: string; action: string }) => {
      if (!shared[row.entity_id]) shared[row.entity_id] = new Set();
      const platform = row.action.replace('social_shared_', '');
      shared[row.entity_id].add(platform);
    });
    setSharedIds(shared);
    
    setManagementLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [period]);
  useEffect(() => { if (mainTab === 'management') loadManagementData(); }, [mainTab]);
  
  const handleShareSuccess = (entityId: string, platform: string) => {
    setSharedIds(prev => {
      const updated = { ...prev };
      if (!updated[entityId]) updated[entityId] = new Set();
      else updated[entityId] = new Set(updated[entityId]);
      updated[entityId].add(platform);
      return updated;
    });
  };

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

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-user-service', {
        body: { action: 'update_password', user_id: resetUserId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Senha redefinida com sucesso!' });
      setResetUserId(null);
      setNewPassword('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setResettingPassword(false);
    }
  };

  // Derived analytics
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
    .map(s => ({ name: (s.entity_name || 'Sem nome').substring(0, 18), clicks: Number(s.click_count) }));

  const periodLabel = { '1': 'Hoje', '7': '7 dias', '30': '30 dias', '90': '90 dias' }[period] || period;

  // Filtered lists
  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers;
    const q = providerSearch.toLowerCase();
    return providers.filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.whatsapp.includes(q));
  }, [providers, providerSearch]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return jobs;
    const q = jobSearch.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.city.toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return publicUsers;
    const q = userSearch.toLowerCase();
    return publicUsers.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.city && u.city.toLowerCase().includes(q)));
  }, [publicUsers, userSearch]);

  return (
    <div className="space-y-6">
      {/* ─── Top-level Tabs: 3 clear sections ─── */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full grid grid-cols-3 h-12">
          <TabsTrigger value="analytics" className="gap-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-4 w-4" /> Métricas
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4" /> Gerenciar
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
            TAB 1: MÉTRICAS (Analytics)
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-primary" />
              <h3 className="text-lg font-bold">Engajamento</h3>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" /><SelectValue />
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
            <KPICard label="Total de Cliques" value={totalClicks} sub={periodLabel}
              icon={<MousePointerClick className="h-6 w-6" />}
              accentClass="text-primary bg-primary/10 border-primary/20" />
            <KPICard label="Prestadores" value={totalProviderClicks} sub={`${providerStats.length} ativos`}
              icon={<Wrench className="h-6 w-6" />}
              accentClass="text-green-500 bg-green-500/10 border-green-500/20" />
            <KPICard label="Vagas" value={totalJobClicks} sub={`${jobStats.length} ativas`}
              icon={<Briefcase className="h-6 w-6" />}
              accentClass="text-blue-500 bg-blue-500/10 border-blue-500/20" />
          </div>

          {/* Charts */}
          {!loading && stats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Mais Clicados</CardTitle>
                  <CardDescription>Top 8 por volume</CardDescription>
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
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-secondary" /> Distribuição</CardTitle>
                  <CardDescription>Prestadores vs Vagas</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full max-w-[300px]">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" /> Ranking Prestadores
                </CardTitle>
              </CardHeader>
              <CardContent><RankingList items={providerStats} loading={loading} colorClass="bg-green-500" /></CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" /> Ranking Vagas
                </CardTitle>
              </CardHeader>
              <CardContent><RankingList items={jobStats} loading={loading} colorClass="bg-blue-500" /></CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            TAB 2: GERENCIAR (Providers + Jobs)
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="management" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-accent" />
              <h3 className="text-lg font-bold">Gerenciar Cadastros</h3>
            </div>
            <Button variant="outline" size="sm" onClick={loadManagementData} disabled={managementLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${managementLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          {/* Sub-tabs for Providers vs Jobs */}
          <Tabs value={managementTab} onValueChange={setManagementTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="providers" className="gap-2">
                <Wrench className="h-4 w-4" /> Prestadores
                <Badge variant="outline" className="ml-1 text-[10px]">{providers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" /> Vagas
                <Badge variant="outline" className="ml-1 text-[10px]">{jobs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Providers management */}
            <TabsContent value="providers" className="mt-4">
              <Card className="border-t-4 border-t-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-green-500" /> Prestadores de Serviço
                    </CardTitle>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30">{filteredProviders.length} exibidos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome, cidade ou WhatsApp..." value={providerSearch} onChange={e => setProviderSearch(e.target.value)} className="pl-9" />
                  </div>
                  {managementLoading ? <LoadingSkeleton count={3} /> : filteredProviders.length === 0 ? (
                    <EmptyState text="Nenhum prestador encontrado." />
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredProviders.map(p => (
                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-green-500/10 hover:border-green-500/30 transition-colors bg-card">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Wrench className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                              <span className="font-medium text-sm">{p.name}</span>
                              <Badge variant={p.is_active ? 'default' : 'outline'} className={`text-[10px] ${p.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}>
                                {p.is_active ? '● Ativo' : '○ Inativo'}
                              </Badge>
                              {sharedIds[p.id] && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30">
                                  📢 Compartilhado
                                  {sharedIds[p.id].has('facebook') && sharedIds[p.id].has('instagram') ? ' (FB + IG)' :
                                   sharedIds[p.id].has('facebook') ? ' (FB)' : ' (IG)'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.whatsapp}</span>
                              <span>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => {
                                setSocialModalData({
                                  type: 'service_provider',
                                  name: p.name,
                                  description: p.description,
                                  city: p.city,
                                  whatsapp: p.whatsapp,
                                });
                                setSocialModalEntityId(p.id);
                                setSocialModalEntityType('service_provider');
                                setSocialModalOpen(true);
                              }}>
                              <Share2 className="h-4 w-4" />
                              {sharedIds[p.id] ? '↻' : ''}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleToggleActive('service_provider', p.id, p.is_active)}>
                              {p.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="destructive" size="sm" disabled={deletingId === p.id} onClick={() => handleDelete('service_provider', p.id, p.name)}>
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

            {/* Jobs management */}
            <TabsContent value="jobs" className="mt-4">
              <Card className="border-t-4 border-t-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-500" /> Vagas de Emprego
                    </CardTitle>
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">{filteredJobs.length} exibidas</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por título, empresa ou cidade..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pl-9" />
                  </div>
                  {managementLoading ? <LoadingSkeleton count={3} /> : filteredJobs.length === 0 ? (
                    <EmptyState text="Nenhuma vaga encontrada." />
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredJobs.map(j => (
                        <div key={j.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-blue-500/10 hover:border-blue-500/30 transition-colors bg-card">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Briefcase className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                              <span className="font-medium text-sm">{j.title}</span>
                              <Badge variant={j.is_active ? 'default' : 'outline'} className={`text-[10px] ${j.is_active ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}`}>
                                {j.is_active ? '● Ativa' : '○ Inativa'}
                              </Badge>
                              {sharedIds[j.id] && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30">
                                  📢 Compartilhado
                                  {sharedIds[j.id].has('facebook') && sharedIds[j.id].has('instagram') ? ' (FB + IG)' :
                                   sharedIds[j.id].has('facebook') ? ' (FB)' : ' (IG)'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="font-medium">{j.company}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.city}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{j.whatsapp}</span>
                              <span>{new Date(j.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => {
                                setSocialModalData({
                                  type: 'job_listing',
                                  title: j.title,
                                  company: j.company,
                                  city: j.city,
                                  whatsapp: j.whatsapp,
                                  jobType: j.job_type,
                                  salary: j.salary || undefined,
                                });
                                setSocialModalEntityId(j.id);
                                setSocialModalEntityType('job_listing');
                                setSocialModalOpen(true);
                              }}>
                              <Share2 className="h-4 w-4" />
                              {sharedIds[j.id] ? '↻' : ''}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleToggleActive('job_listing', j.id, j.is_active)}>
                              {j.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="destructive" size="sm" disabled={deletingId === j.id} onClick={() => handleDelete('job_listing', j.id, j.title)}>
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
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
            TAB 3: USUÁRIOS (Password reset, user list)
        ═══════════════════════════════════════════════════ */}
        <TabsContent value="users" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-secondary" />
              <h3 className="text-lg font-bold">Usuários Cadastrados</h3>
              <Badge variant="secondary">{publicUsers.length}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={loadManagementData} disabled={managementLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${managementLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <Card className="border-t-4 border-t-secondary">
            <CardContent className="pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, e-mail ou cidade..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9" />
              </div>
              {managementLoading ? <LoadingSkeleton count={4} /> : filteredUsers.length === 0 ? (
                <EmptyState text="Nenhum usuário encontrado." />
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="p-3 rounded-lg border hover:border-secondary/30 transition-colors bg-card space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                            <span className="font-medium text-sm">{u.full_name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span>{u.email}</span>
                            {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                            {u.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.city}</span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 border-secondary/30 hover:bg-secondary/10"
                          onClick={() => { setResetUserId(resetUserId === u.id ? null : u.id); setNewPassword(''); }}>
                          <KeyRound className="h-4 w-4" /> Redefinir Senha
                        </Button>
                      </div>
                      {resetUserId === u.id && (
                        <div className="flex items-center gap-2 pt-2 border-t border-secondary/20">
                          <div className="relative flex-1">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Nova senha (mín. 6 caracteres)"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              className="pr-10"
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <Button size="sm" disabled={resettingPassword || newPassword.length < 6} onClick={handleResetPassword}>
                            {resettingPassword ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UtilitySocialMediaModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        data={socialModalData}
        entityId={socialModalEntityId}
        entityType={socialModalEntityType}
        onShareSuccess={handleShareSuccess}
      />
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────
const KPICard: React.FC<{ label: string; value: number; sub: string; icon: React.ReactNode; accentClass: string }> = ({ label, value, sub, icon, accentClass }) => (
  <Card className={`border-l-4 ${accentClass.includes('primary') ? 'border-l-primary' : accentClass.includes('green') ? 'border-l-green-500' : 'border-l-blue-500'}`}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl ${accentClass} flex items-center justify-center border`}>{icon}</div>
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
                <span className="text-[10px] text-muted-foreground hidden sm:block">{new Date(s.last_click).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LoadingSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />)}</div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-muted-foreground text-center py-8">{text}</p>
);

export default UtilityCRM;
