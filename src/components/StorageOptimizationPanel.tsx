import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  FileImage,
  Database,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StorageStats {
  database_stats: {
    total_articles: number;
    published_articles: number;
    draft_articles: number;
    total_comments: number;
    approved_comments: number;
    audit_logs: number;
    notifications: number;
    storage_backup_entries: number;
  };
  storage_usage: Array<{
    bucket: string;
    files: number;
    size_mb: number;
  }>;
  database_size: string;
  last_check: string;
}

interface OrphanedFile {
  bucket_name: string;
  file_path: string;
  file_size: number;
}

const StorageOptimizationPanel: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [orphanedFiles, setOrphanedFiles] = useState<OrphanedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas de otimização
      const { data: statsData, error: statsError } = await supabase
        .from('settings')
        .select('*');

      if (statsError) throw statsError;
      
      // Por enquanto, vamos simular os dados até a função estar disponível
      const mockStats: StorageStats = {
        database_stats: {
          total_articles: 0,
          published_articles: 0,
          draft_articles: 0,
          total_comments: 0,
          approved_comments: 0,
          audit_logs: 0,
          notifications: 0,
          storage_backup_entries: 0
        },
        storage_usage: [],
        database_size: '0 MB',
        last_check: new Date().toISOString()
      };
      setStats(mockStats);

      // Carregar arquivos órfãos - simulado por enquanto
      const mockOrphaned: OrphanedFile[] = [];
      setOrphanedFiles(mockOrphaned);

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas de armazenamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCleanup = async () => {
    setCleanupLoading(true);
    try {
      const { data, error } = await supabase.rpc('execute_full_cleanup');

      if (error) throw error;

      toast({
        title: "Limpeza concluída",
        description: `Removidos: ${(data as any).deleted_audit_logs} logs, ${(data as any).deleted_orphaned_comments} comentários órfãos, ${(data as any).deleted_old_notifications} notificações antigas.`,
      });

      // Recarregar estatísticas
      await loadStats();

    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: "Não foi possível executar a limpeza completa.",
        variant: "destructive",
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Calcular uso total de storage
  const totalStorageUsage = stats?.storage_usage?.reduce((sum, bucket) => sum + bucket.size_mb, 0) || 0;
  const storageWarningThreshold = 400; // MB
  const isNearLimit = totalStorageUsage > storageWarningThreshold;

  // Calcular tamanho total de arquivos órfãos
  const orphanedSizeMB = orphanedFiles.reduce((sum, file) => sum + (file.file_size || 0), 0) / 1024 / 1024;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Otimização de Armazenamento</h2>
          <p className="text-muted-foreground">
            Monitore e otimize o uso de espaço no Supabase
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={executeCleanup} 
            disabled={cleanupLoading}
            className="bg-gradient-hero hover:shadow-glow-primary"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {cleanupLoading ? 'Limpando...' : 'Executar Limpeza'}
          </Button>
        </div>
      </div>

      {/* Alerta de espaço */}
      {isNearLimit && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Atenção:</strong> Uso de armazenamento próximo ao limite ({totalStorageUsage.toFixed(1)} MB).
            Execute a limpeza automática para liberar espaço.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas de Storage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <HardDrive className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Armazenamento Total</p>
              <p className="text-2xl font-bold">
                {totalStorageUsage.toFixed(1)} MB
              </p>
            </div>
          </div>
          <Progress 
            value={(totalStorageUsage / 500) * 100} 
            className="mt-3"
            style={{
              color: isNearLimit ? '#f59e0b' : '#3b82f6'
            }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Limite gratuito: 500 MB
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Database className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Banco de Dados</p>
              <p className="text-2xl font-bold">
                {stats?.database_size || '0 MB'}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {stats?.database_stats.total_articles || 0} artigos totais
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FileImage className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Arquivos Órfãos</p>
              <p className="text-2xl font-bold">
                {orphanedSizeMB.toFixed(1)} MB
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {orphanedFiles.length} arquivos não utilizados
          </p>
        </Card>
      </div>

      {/* Detalhes por bucket */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Uso por Bucket
        </h3>
        <div className="space-y-3">
          {stats?.storage_usage?.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">{bucket.bucket}</p>
                <p className="text-sm text-muted-foreground">
                  {bucket.files} arquivos
                </p>
              </div>
              <Badge variant="outline">
                {bucket.size_mb.toFixed(1)} MB
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Estatísticas do banco */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Estatísticas do Banco</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-500">
              {stats?.database_stats.published_articles || 0}
            </p>
            <p className="text-sm text-muted-foreground">Artigos Publicados</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-500">
              {stats?.database_stats.approved_comments || 0}
            </p>
            <p className="text-sm text-muted-foreground">Comentários</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">
              {stats?.database_stats.audit_logs || 0}
            </p>
            <p className="text-sm text-muted-foreground">Logs de Auditoria</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-purple-500">
              {stats?.database_stats.notifications || 0}
            </p>
            <p className="text-sm text-muted-foreground">Notificações</p>
          </div>
        </div>
      </Card>

      {/* Status da otimização */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Sistema Otimizado</p>
              <p className="text-sm text-muted-foreground">
                Última verificação: {stats?.last_check ? new Date(stats.last_check).toLocaleString('pt-BR') : 'Nunca'}
              </p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
            Ativo
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default StorageOptimizationPanel;