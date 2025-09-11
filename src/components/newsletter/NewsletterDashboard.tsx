import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNewsletterStats, useSubscriberGrowth } from '@/hooks/useNewsletterStats';
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  AlertTriangle,
  Calendar,
  Target
} from 'lucide-react';

const NewsletterDashboard = () => {
  const stats = useNewsletterStats();
  const growth = useSubscriberGrowth(7); // Últimos 7 dias

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: number;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      red: 'text-red-600 bg-red-100'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{value}</p>
                {trend !== undefined && (
                  <Badge 
                    variant={trend >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Newsletter</h2>
        <p className="text-muted-foreground">
          Visão geral do desempenho da sua newsletter
        </p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Inscritos"
          value={stats.totalSubscribers.toLocaleString()}
          subtitle={`${stats.activeSubscribers} ativos`}
          icon={Users}
          trend={stats.recentGrowth}
          color="blue"
        />
        
        <StatCard
          title="Campanhas Enviadas"
          value={stats.totalCampaigns}
          subtitle={`${stats.totalEmailsSent.toLocaleString()} emails`}
          icon={Mail}
          color="green"
        />
        
        <StatCard
          title="Taxa de Abertura"
          value={`${stats.averageOpenRate.toFixed(1)}%`}
          subtitle="Média das campanhas"
          icon={Eye}
          color="purple"
        />
        
        <StatCard
          title="Taxa de Clique"
          value={`${stats.averageClickRate.toFixed(1)}%`}
          subtitle="Engajamento médio"
          icon={MousePointer}
          color="orange"
        />
      </div>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Descadastrados"
          value={stats.unsubscribedCount}
          subtitle={`${((stats.unsubscribedCount / Math.max(stats.totalSubscribers, 1)) * 100).toFixed(1)}% do total`}
          icon={AlertTriangle}
          color="red"
        />
        
        <StatCard
          title="Taxa de Bounce"
          value={`${stats.averageBounceRate.toFixed(1)}%`}
          subtitle="Emails não entregues"
          icon={Target}
          color="orange"
        />
        
        <StatCard
          title="Crescimento (7d)"
          value={growth.reduce((sum, day) => sum + day.count, 0)}
          subtitle="Novos inscritos"
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Top Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Principais Fontes de Inscrição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topSources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 text-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium capitalize">
                    {source.source === 'homepage' ? 'Página Inicial' :
                     source.source === 'article' ? 'Artigos' :
                     source.source === 'footer' ? 'Rodapé' :
                     source.source === 'manual' ? 'Manual' :
                     source.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {source.count} inscritos
                  </span>
                  <Badge>
                    {((source.count / Math.max(stats.totalSubscribers, 1)) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
            
            {stats.topSources.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum dado de fonte disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Crescimento nos últimos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Crescimento nos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {growth.map(day => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((day.count / Math.max(...growth.map(g => g.count), 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {day.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterDashboard;