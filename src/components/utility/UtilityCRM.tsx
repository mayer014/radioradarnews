import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClickTracking } from '@/hooks/useClickTracking';
import { BarChart3, TrendingUp, MousePointerClick, Wrench, Briefcase } from 'lucide-react';

interface ClickStat {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  click_count: number;
  last_click: string;
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Mini CRM – Utilidade Pública
        </h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hoje</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-5 text-center">
            <MousePointerClick className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{totalClicks}</p>
            <p className="text-sm text-muted-foreground">Total de Cliques</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-5 text-center">
            <Wrench className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold">{providerStats.reduce((s, p) => s + Number(p.click_count), 0)}</p>
            <p className="text-sm text-muted-foreground">Cliques Prestadores</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-5 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold">{jobStats.reduce((s, j) => s + Number(j.click_count), 0)}</p>
            <p className="text-sm text-muted-foreground">Cliques Vagas</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Prestadores */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Ranking – Prestadores</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Carregando...</p> : providerStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum clique registrado no período.</p>
          ) : (
            <div className="space-y-3">
              {providerStats.map((s, i) => (
                <div key={s.entity_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/20 text-primary">#{i + 1}</Badge>
                    <span className="font-medium">{s.entity_name || 'Sem nome'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{s.click_count}</p>
                    <p className="text-xs text-muted-foreground">Último: {new Date(s.last_click).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Vagas */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Ranking – Vagas</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Carregando...</p> : jobStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum clique registrado no período.</p>
          ) : (
            <div className="space-y-3">
              {jobStats.map((s, i) => (
                <div key={s.entity_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-secondary/20 text-secondary">#{i + 1}</Badge>
                    <span className="font-medium">{s.entity_name || 'Sem nome'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{s.click_count}</p>
                    <p className="text-xs text-muted-foreground">Último: {new Date(s.last_click).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilityCRM;
