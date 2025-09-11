import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, RefreshCw, Activity, Database, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serviceLayer } from '@/services/SupabaseServiceLayer';

interface AuditLog {
  id: string;
  event: string;
  entity: string;
  entity_id: string;
  level: 'info' | 'warn' | 'error';
  payload_jsonb: any;
  context: any;
  created_at: string;
}

interface DashboardData {
  error_counts: Record<string, number>;
  recent_events: AuditLog[];
  activity_summary: Record<string, number>;
  last_updated: string;
  total_errors_24h: number;
  system_status: 'healthy' | 'needs_attention';
}

const ObservabilityDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [dashboardResult, logsResult] = await Promise.all([
        serviceLayer.getAuditDashboard(),
        serviceLayer.getAuditLogs({ limit: 50 })
      ]);

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data);
      }

      if (logsResult.success && logsResult.data) {
        setAuditLogs(logsResult.data);
      }

      if (!dashboardResult.success || !logsResult.success) {
        toast({
          title: "Erro ao carregar dados",
          description: "Alguns dados podem estar desatualizados",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reprocessFailedOperation = async (logId: string) => {
    // This would implement retry logic for failed operations
    toast({
      title: "Reprocessamento iniciado",
      description: `Tentando reprocessar operação ${logId}`,
    });
  };

  const getStoredLogs = () => {
    return serviceLayer.getStoredLogs();
  };

  const getFailedOperations = () => {
    return serviceLayer.getFailedOperations();
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs_attention':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Dashboard de Observabilidade
          </h1>
          <p className="text-muted-foreground">
            Monitoramento e auditoria do sistema RadioRadar.news
          </p>
        </div>
        <Button 
          onClick={loadDashboardData} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Overview */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(dashboardData.system_status)}
              <div>
                <p className="text-sm font-medium">Status do Sistema</p>
                <p className="text-2xl font-bold">
                  {dashboardData.system_status === 'healthy' ? 'Saudável' : 'Atenção'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Erros (24h)</p>
                <p className="text-2xl font-bold">{dashboardData.total_errors_24h}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Eventos Recentes</p>
                <p className="text-2xl font-bold">{dashboardData.recent_events.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Última Atualização</p>
                <p className="text-sm">{formatDate(dashboardData.last_updated)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="audit-logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="client-logs">Logs do Cliente</TabsTrigger>
          <TabsTrigger value="failed-ops">Operações Falhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Error Counts by Entity */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Erros por Entidade (24h)</h3>
                <div className="space-y-2">
                  {Object.keys(dashboardData.error_counts).length > 0 ? (
                    Object.entries(dashboardData.error_counts).map(([entity, count]) => (
                      <div key={entity} className="flex justify-between items-center">
                        <span className="capitalize">{entity}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Nenhum erro nas últimas 24 horas</p>
                  )}
                </div>
              </Card>

              {/* Activity Summary */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Resumo de Atividade (24h)</h3>
                <div className="space-y-2">
                  {Object.entries(dashboardData.activity_summary).map(([key, count]) => {
                    const [entity, level] = key.split('_');
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{entity} ({level})</span>
                        <Badge variant={getLevelColor(level)}>{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Logs de Auditoria Recentes</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                      <span className="font-medium">{log.event}</span>
                      <span className="text-sm text-muted-foreground">({log.entity})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.payload_jsonb && Object.keys(log.payload_jsonb).length > 0 && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.payload_jsonb, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="client-logs" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Logs do Cliente (Armazenados Localmente)</h3>
            <div className="flex space-x-2 mb-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => serviceLayer.clearStoredLogs()}>
                Limpar Logs
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getStoredLogs().map((log, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                      <span className="font-medium">{log.context}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="failed-ops" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Operações Falhadas</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFailedOperations().map((log, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">FALHA</Badge>
                      <span className="font-medium">{log.context}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => reprocessFailedOperation(`${index}`)}
                    >
                      Reprocessar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Erro: {log.data.error}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </p>
                </div>
              ))}
              {getFailedOperations().length === 0 && (
                <p className="text-muted-foreground">Nenhuma operação falhada encontrada</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObservabilityDashboard;