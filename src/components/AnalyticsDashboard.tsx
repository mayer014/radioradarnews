import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, Users, TrendingUp, Monitor, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  total_all_time: number;
  total_this_month: number;
  unique_visitors_this_month: number;
  monthly_stats: Array<{ date: string; total_visits: number; unique_visitors: number }>;
  top_pages: Array<{ path: string; count: number }>;
  device_stats: Record<string, number>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: analyticsData, error } = await supabase.functions.invoke('analytics-dashboard');
      
      if (error) throw error;
      
      setData(analyticsData.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Erro ao carregar estatísticas
      </div>
    );
  }

  const topDevice = Object.entries(data.device_stats || {})
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Acessos</p>
              <p className="text-2xl font-bold text-foreground">{data.total_all_time.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Desde o início</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-secondary/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acessos este Mês</p>
              <p className="text-2xl font-bold text-foreground">{data.total_this_month.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-accent/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-lg">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              <p className="text-2xl font-bold text-foreground">{data.unique_visitors_this_month.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-primary/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dispositivo Principal</p>
              <p className="text-2xl font-bold text-foreground capitalize">
                {topDevice?.[0] || 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Acessos Mensais */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Acessos por Mês (Últimos 12 meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthly_stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { month: 'short' })}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="total_visits" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total de Acessos" 
            />
            <Line 
              type="monotone" 
              dataKey="unique_visitors" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              name="Visitantes Únicos" 
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Páginas Mais Visitadas */}
      <Card className="bg-gradient-card border-primary/30 p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Páginas Mais Visitadas (Este Mês)</h3>
        <div className="space-y-2">
          {data.top_pages.length > 0 ? (
            data.top_pages.map((page, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-sm text-foreground truncate flex-1">{page.path}</span>
                <span className="text-sm font-semibold text-foreground ml-4">{page.count} acessos</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível ainda
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
