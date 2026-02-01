import React, { useMemo, useState, useEffect } from 'react';
import { useSupabaseNews } from '@/contexts/SupabaseNewsContext';
import { useUsers } from '@/contexts/UsersContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Eye,
  Bell,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Share2,
  BarChart3,
  Users,
  CalendarDays,
  Activity,
  History,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, differenceInHours, startOfMonth, format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ColumnistStats {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string | null;
  totalArticles: number;
  lastPostDate: Date | null;
  daysSinceLastPost: number | null;
  hoursSinceLastPost: number | null;
  recentArticles: Array<{
    id: string;
    title: string;
    created_at: string;
    category: string;
  }>;
  hasNewPosts: boolean;
  isInactive: boolean;
}

interface SiteAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  monthlyVisits: number;
  monthlyUniqueVisitors: number;
  todayVisits: number;
  isLoading: boolean;
}

interface MonthlyHistory {
  month: string;
  label: string;
  totalVisits: number;
  uniqueVisitors: number;
  homeVisits: number;
  articleVisits: number;
  mobileVisits: number;
  desktopVisits: number;
}

const ColumnistActivityDashboard: React.FC = () => {
  const { articles } = useSupabaseNews();
  const { users } = useUsers();
  const navigate = useNavigate();
  const [selectedColumnist, setSelectedColumnist] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [siteAnalytics, setSiteAnalytics] = useState<SiteAnalytics>({
    totalVisits: 0,
    uniqueVisitors: 0,
    monthlyVisits: 0,
    monthlyUniqueVisitors: 0,
    todayVisits: 0,
    isLoading: true
  });

  // Fetch site analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch total visits (all time)
        const { count: totalVisits } = await supabase
          .from('site_analytics')
          .select('*', { count: 'exact', head: true });

        // Fetch unique visitors (all time - distinct visitor_hash)
        const { data: uniqueData } = await supabase
          .from('site_analytics')
          .select('visitor_hash');
        
        const uniqueVisitors = new Set(uniqueData?.map(v => v.visitor_hash) || []).size;

        // Fetch monthly visits (current month only)
        const { count: monthlyVisits } = await supabase
          .from('site_analytics')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfCurrentMonth.toISOString());

        // Fetch monthly unique visitors (current month only)
        const { data: monthlyUniqueData } = await supabase
          .from('site_analytics')
          .select('visitor_hash')
          .gte('created_at', startOfCurrentMonth.toISOString());
        
        const monthlyUniqueVisitors = new Set(monthlyUniqueData?.map(v => v.visitor_hash) || []).size;

        // Fetch today visits
        const { count: todayVisits } = await supabase
          .from('site_analytics')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString());

        setSiteAnalytics({
          totalVisits: totalVisits || 0,
          uniqueVisitors: uniqueVisitors,
          monthlyVisits: monthlyVisits || 0,
          monthlyUniqueVisitors: monthlyUniqueVisitors,
          todayVisits: todayVisits || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        setSiteAnalytics(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchAnalytics();
  }, []);

  // Fetch monthly history from site_analytics_summary
  useEffect(() => {
    const fetchMonthlyHistory = async () => {
      try {
        setHistoryLoading(true);
        
        // Fetch all summary data
        const { data: summaryData, error } = await supabase
          .from('site_analytics_summary')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          console.error('Erro ao buscar histórico:', error);
          return;
        }

        // Group by month
        const monthlyData = new Map<string, MonthlyHistory>();
        
        summaryData?.forEach(day => {
          const date = parseISO(day.date);
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              month: monthKey,
              label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
              totalVisits: 0,
              uniqueVisitors: 0,
              homeVisits: 0,
              articleVisits: 0,
              mobileVisits: 0,
              desktopVisits: 0
            });
          }
          
          const existing = monthlyData.get(monthKey)!;
          existing.totalVisits += day.total_visits || 0;
          existing.uniqueVisitors += day.unique_visitors || 0;
          existing.homeVisits += day.home_visits || 0;
          existing.articleVisits += day.article_visits || 0;
          existing.mobileVisits += day.mobile_visits || 0;
          existing.desktopVisits += day.desktop_visits || 0;
        });

        setMonthlyHistory(Array.from(monthlyData.values()));
      } catch (error) {
        console.error('Erro ao buscar histórico mensal:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchMonthlyHistory();
  }, []);

  // Calculate total stats across all history
  const allTimeStats = useMemo(() => {
    return monthlyHistory.reduce((acc, month) => ({
      totalVisits: acc.totalVisits + month.totalVisits,
      uniqueVisitors: acc.uniqueVisitors + month.uniqueVisitors,
      homeVisits: acc.homeVisits + month.homeVisits,
      articleVisits: acc.articleVisits + month.articleVisits,
      mobileVisits: acc.mobileVisits + month.mobileVisits,
      desktopVisits: acc.desktopVisits + month.desktopVisits,
    }), {
      totalVisits: 0,
      uniqueVisitors: 0,
      homeVisits: 0,
      articleVisits: 0,
      mobileVisits: 0,
      desktopVisits: 0,
    });
  }, [monthlyHistory]);

  // Get selected month data
  const selectedMonthData = useMemo(() => {
    if (selectedMonth === 'current' || selectedMonth === 'all') {
      return null; // Use current live data or all-time
    }
    return monthlyHistory.find(m => m.month === selectedMonth) || null;
  }, [selectedMonth, monthlyHistory]);

  // Calculate comparison with previous month
  const monthComparison = useMemo(() => {
    if (monthlyHistory.length < 2) return null;
    
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const currentIdx = monthlyHistory.findIndex(m => m.month === currentMonthKey);
    
    if (currentIdx === -1 || currentIdx >= monthlyHistory.length - 1) return null;
    
    const current = monthlyHistory[currentIdx];
    const previous = monthlyHistory[currentIdx + 1];
    
    if (!current || !previous) return null;
    
    const visitsDiff = current.totalVisits - previous.totalVisits;
    const visitsPercent = previous.totalVisits > 0 
      ? Math.round((visitsDiff / previous.totalVisits) * 100) 
      : 0;
    
    return {
      previousMonth: previous.label,
      visitsDiff,
      visitsPercent,
      isPositive: visitsDiff >= 0
    };
  }, [monthlyHistory]);

  // Get all columnists from users
  const columnists = useMemo(() => {
    return users.filter(u => u.role === 'colunista' && u.columnistProfile?.isActive !== false);
  }, [users]);

  // Calculate stats for each columnist
  const columnistStats = useMemo((): ColumnistStats[] => {
    const now = new Date();
    
    return columnists.map(columnist => {
      // Get all articles by this columnist
      const columnistArticles = articles.filter(a => a.author_id === columnist.id);
      
      // Sort by date descending
      const sortedArticles = [...columnistArticles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const lastPost = sortedArticles[0];
      const lastPostDate = lastPost ? new Date(lastPost.created_at) : null;
      
      const daysSinceLastPost = lastPostDate 
        ? differenceInDays(now, lastPostDate)
        : null;
        
      const hoursSinceLastPost = lastPostDate
        ? differenceInHours(now, lastPostDate)
        : null;
      
      // Recent articles (last 5)
      const recentArticles = sortedArticles.slice(0, 5).map(a => ({
        id: a.id,
        title: a.title,
        created_at: a.created_at,
        category: a.category
      }));
      
      // Has new posts in last 48 hours
      const hasNewPosts = hoursSinceLastPost !== null && hoursSinceLastPost <= 48;
      
      // Is inactive (no posts in 7+ days or never posted)
      const isInactive = daysSinceLastPost === null || daysSinceLastPost >= 7;
      
      return {
        id: columnist.id,
        name: columnist.name,
        avatar: columnist.columnistProfile?.avatar || null,
        specialty: columnist.columnistProfile?.specialty || null,
        totalArticles: columnistArticles.length,
        lastPostDate,
        daysSinceLastPost,
        hoursSinceLastPost,
        recentArticles,
        hasNewPosts,
        isInactive
      };
    }).sort((a, b) => {
      // Sort by last post date (most recent first), nulls last
      if (!a.lastPostDate && !b.lastPostDate) return 0;
      if (!a.lastPostDate) return 1;
      if (!b.lastPostDate) return -1;
      return b.lastPostDate.getTime() - a.lastPostDate.getTime();
    });
  }, [columnists, articles]);

  // Filter stats based on selected filter
  const filteredStats = useMemo(() => {
    switch (filterStatus) {
      case 'active':
        return columnistStats.filter(s => !s.isInactive);
      case 'inactive':
        return columnistStats.filter(s => s.isInactive);
      case 'new':
        return columnistStats.filter(s => s.hasNewPosts);
      default:
        return columnistStats;
    }
  }, [columnistStats, filterStatus]);

  // Summary stats
  const summary = useMemo(() => {
    const total = columnistStats.length;
    const active = columnistStats.filter(s => !s.isInactive).length;
    const inactive = columnistStats.filter(s => s.isInactive).length;
    const withNewPosts = columnistStats.filter(s => s.hasNewPosts).length;
    const totalArticles = columnistStats.reduce((sum, s) => sum + s.totalArticles, 0);
    
    return { total, active, inactive, withNewPosts, totalArticles };
  }, [columnistStats]);

  const getStatusBadge = (stat: ColumnistStats) => {
    if (stat.hasNewPosts) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Bell className="h-3 w-3 mr-1" />
          Nova Postagem
        </Badge>
      );
    }
    if (stat.isInactive) {
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Inativo
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    );
  };

  const getTimeSinceLastPost = (stat: ColumnistStats) => {
    if (!stat.lastPostDate) {
      return <span className="text-muted-foreground">Nunca postou</span>;
    }
    
    const distance = formatDistanceToNow(stat.lastPostDate, { 
      addSuffix: true, 
      locale: ptBR 
    });
    
    return (
      <span className={stat.isInactive ? 'text-orange-400' : 'text-muted-foreground'}>
        {distance}
      </span>
    );
  };

  const handleViewArticle = (articleId: string) => {
    navigate(`/noticia/${articleId}`);
  };

  return (
    <div className="space-y-6">
      {/* Analytics do Site */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas de Visitas do Site
          </h2>
          
          {/* Seletor de Mês */}
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Mês Atual (Tempo Real)
                  </span>
                </SelectItem>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Total Geral (Todos os Meses)
                  </span>
                </SelectItem>
                {monthlyHistory.map(month => (
                  <SelectItem key={month.month} value={month.month}>
                    <span className="flex items-center justify-between w-full">
                      {month.label}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({month.totalVisits.toLocaleString('pt-BR')})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        {selectedMonth === 'current' ? (
          // Dados em tempo real DO MÊS ATUAL
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visitas do Mês ({format(new Date(), 'MMMM', { locale: ptBR })})</p>
                  <p className="text-xl font-bold">
                    {siteAnalytics.isLoading ? '...' : siteAnalytics.monthlyVisits.toLocaleString('pt-BR')}
                  </p>
                  {monthComparison && (
                    <p className={`text-xs flex items-center gap-1 mt-1 ${monthComparison.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {monthComparison.isPositive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {Math.abs(monthComparison.visitsPercent)}% vs {monthComparison.previousMonth}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visitantes Únicos (Mês)</p>
                  <p className="text-xl font-bold">
                    {siteAnalytics.isLoading ? '...' : siteAnalytics.monthlyUniqueVisitors.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Diária</p>
                  <p className="text-xl font-bold">
                    {siteAnalytics.isLoading ? '...' : Math.round(siteAnalytics.monthlyVisits / Math.max(1, new Date().getDate())).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date().getDate()} dias no mês
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visitas Hoje</p>
                  <p className="text-xl font-bold">
                    {siteAnalytics.isLoading ? '...' : siteAnalytics.todayVisits.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : selectedMonth === 'all' ? (
          // Total Geral - todos os meses
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Total Geral - Desde {monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1]?.label : 'o início'}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Visitas</p>
                    <p className="text-xl font-bold">
                      {allTimeStats.totalVisits.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visitantes Únicos</p>
                    <p className="text-xl font-bold">
                      {allTimeStats.uniqueVisitors.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visitas em Artigos</p>
                    <p className="text-xl font-bold">
                      {allTimeStats.articleVisits.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile / Desktop</p>
                    <p className="text-xl font-bold">
                      {allTimeStats.mobileVisits.toLocaleString('pt-BR')} / {allTimeStats.desktopVisits.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Breakdown por mês quando vendo total geral */}
            <div className="mt-4 pt-4 border-t border-muted/30">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Detalhamento por Mês
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthlyHistory.map(month => (
                  <Card 
                    key={month.month} 
                    className="p-3 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedMonth(month.month)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{month.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {month.totalVisits.toLocaleString('pt-BR')} visitas
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {month.uniqueVisitors} únicos • {month.articleVisits} artigos
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : selectedMonthData ? (
          // Dados históricos do mês selecionado
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="h-4 w-4" />
              Histórico de {selectedMonthData.label}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Visitas</p>
                    <p className="text-xl font-bold">
                      {selectedMonthData.totalVisits.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visitantes Únicos</p>
                    <p className="text-xl font-bold">
                      {selectedMonthData.uniqueVisitors.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visitas em Artigos</p>
                    <p className="text-xl font-bold">
                      {selectedMonthData.articleVisits.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile / Desktop</p>
                    <p className="text-xl font-bold">
                      {selectedMonthData.mobileVisits} / {selectedMonthData.desktopVisits}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-gradient-card border-muted/30 p-8 text-center">
            <p className="text-muted-foreground">
              {historyLoading ? 'Carregando histórico...' : 'Nenhum dado disponível para este período.'}
            </p>
          </Card>
        )}

        {/* Lista de meses disponíveis */}
        {monthlyHistory.length > 0 && selectedMonth === 'current' && (
          <div className="mt-4 pt-4 border-t border-muted/30">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Histórico Mensal Disponível
            </h3>
            <div className="flex flex-wrap gap-2">
              {monthlyHistory.map(month => (
                <Button
                  key={month.month}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(month.month)}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  {month.label}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {month.totalVisits.toLocaleString('pt-BR')} visitas
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header com resumo dos colunistas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-card border-primary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Colunistas</p>
              <p className="text-xl font-bold">{summary.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-xl font-bold">{summary.active}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-orange-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inativos (7+ dias)</p>
              <p className="text-xl font-bold">{summary.inactive}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Bell className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Novas Postagens</p>
              <p className="text-xl font-bold">{summary.withNewPosts}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-card border-blue-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Artigos</p>
              <p className="text-xl font-bold">{summary.totalArticles}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          size="sm"
          className={filterStatus === 'all' ? 'bg-gradient-hero' : ''}
        >
          Todos ({summary.total})
        </Button>
        <Button
          variant={filterStatus === 'new' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('new')}
          size="sm"
          className={filterStatus === 'new' ? 'bg-green-600' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}
        >
          <Bell className="h-4 w-4 mr-1" />
          Novas Postagens ({summary.withNewPosts})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
          size="sm"
          className={filterStatus === 'active' ? 'bg-blue-600' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Ativos ({summary.active})
        </Button>
        <Button
          variant={filterStatus === 'inactive' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('inactive')}
          size="sm"
          className={filterStatus === 'inactive' ? 'bg-orange-600' : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10'}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Inativos ({summary.inactive})
        </Button>
      </div>

      {/* Lista de colunistas */}
      <div className="space-y-4">
        {filteredStats.length === 0 ? (
          <Card className="bg-gradient-card border-muted/30 p-8 text-center">
            <p className="text-muted-foreground">Nenhum colunista encontrado nesta categoria.</p>
          </Card>
        ) : (
          filteredStats.map(stat => (
            <Card 
              key={stat.id} 
              className={`bg-gradient-card border-muted/30 p-4 transition-all ${
                selectedColumnist === stat.id ? 'ring-2 ring-primary' : ''
              } ${stat.hasNewPosts ? 'border-green-500/30' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Info do colunista */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {stat.avatar ? (
                      <img src={stat.avatar} alt={stat.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{stat.name}</h3>
                      {getStatusBadge(stat)}
                    </div>
                    
                    {stat.specialty && (
                      <p className="text-sm text-muted-foreground mb-2">{stat.specialty}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{stat.totalArticles} artigos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {getTimeSinceLastPost(stat)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColumnist(selectedColumnist === stat.id ? null : stat.id)}
                    className="border-primary/30"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedColumnist === stat.id ? 'Ocultar' : 'Ver Artigos'}
                  </Button>
                </div>
              </div>

              {/* Lista de artigos recentes (expandível) */}
              {selectedColumnist === stat.id && (
                <div className="mt-4 pt-4 border-t border-muted/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Artigos Recentes
                  </h4>
                  
                  {stat.recentArticles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum artigo publicado.</p>
                  ) : (
                    <div className="space-y-2">
                      {stat.recentArticles.map(article => {
                        const isNew = differenceInHours(new Date(), new Date(article.created_at)) <= 48;
                        
                        return (
                          <div 
                            key={article.id}
                            className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 ${
                              isNew ? 'ring-1 ring-green-500/30' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2 mb-1">
                                {isNew && (
                                  <Badge className="bg-green-500/20 text-green-400 text-xs px-1 py-0">
                                    NOVO
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {article.category}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium truncate">{article.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(article.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewArticle(article.id)}
                                title="Ver artigo"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/colunista/${stat.id}/artigo/${article.id}`)}
                                title="Ver página do artigo (com opção de compartilhar)"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ColumnistActivityDashboard;
