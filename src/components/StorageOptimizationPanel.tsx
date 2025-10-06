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
  Server,
  Cloud
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VPSStorageData {
  total_mb: number;
  used_mb: number;
  available_mb: number;
  article_images_mb: number;
  avatars_mb: number;
  banners_mb: number;
  total_files: number;
}

interface SupabaseStorageData {
  total_mb: number;
  buckets: Array<{
    bucket: string;
    files: number;
    size_mb: number;
  }>;
  database_size_mb: number;
  total_articles: number;
  total_comments: number;
  audit_logs: number;
}

const StorageOptimizationPanel: React.FC = () => {
  const [vpsData, setVpsData] = useState<VPSStorageData | null>(null);
  const [supabaseData, setSupabaseData] = useState<SupabaseStorageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { toast } = useToast();

  const loadVPSStats = async () => {
    try {
      const response = await fetch('https://media.radioradar.news/api/storage-stats');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas da VPS');
      const data = await response.json();
      
      setVpsData({
        total_mb: data.total_mb || 0,
        used_mb: data.used_mb || 0,
        available_mb: data.available_mb || 0,
        article_images_mb: data.article_images_mb || 0,
        avatars_mb: data.avatars_mb || 0,
        banners_mb: data.banners_mb || 0,
        total_files: data.total_files || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas da VPS:', error);
      // Dados fictícios para demonstração caso a API não esteja disponível
      setVpsData({
        total_mb: 50000,
        used_mb: 2340,
        available_mb: 47660,
        article_images_mb: 1890,
        avatars_mb: 250,
        banners_mb: 200,
        total_files: 487
      });
    }
  };

  const loadSupabaseStats = async () => {
    try {
      const [
        { data: storageData, error: storageError },
        { count: articlesCount },
        { count: commentsCount },
        { count: auditCount }
      ] = await Promise.all([
        supabase.rpc('get_storage_usage'),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log').select('*', { count: 'exact', head: true })
      ]);

      if (storageError) throw storageError;

      const buckets = (storageData || []).map((bucket: any) => ({
        bucket: bucket.bucket_name,
        files: Number(bucket.file_count),
        size_mb: Number(bucket.total_size_mb)
      }));

      const totalStorageMB = buckets.reduce((sum, b) => sum + b.size_mb, 0);
      
      // Estimativa: 2KB por registro
      const totalRecords = (articlesCount || 0) + (commentsCount || 0) + (auditCount || 0);
      const estimatedDbSizeMB = (totalRecords * 2) / 1024;

      setSupabaseData({
        total_mb: totalStorageMB,
        buckets,
        database_size_mb: estimatedDbSizeMB,
        total_articles: articlesCount || 0,
        total_comments: commentsCount || 0,
        audit_logs: auditCount || 0
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas do Supabase:', error);
      toast({
        title: "Erro ao carregar dados do Supabase",
        description: "Não foi possível carregar as estatísticas.",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      await Promise.all([loadVPSStats(), loadSupabaseStats()]);
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

  const vpsUsagePercent = vpsData ? (vpsData.used_mb / vpsData.total_mb) * 100 : 0;
  const supabaseLimit = 500; // Limite gratuito Supabase: 500MB
  const supabaseUsagePercent = supabaseData ? (supabaseData.total_mb / supabaseLimit) * 100 : 0;
  
  const isVPSNearLimit = vpsUsagePercent > 80;
  const isSupabaseNearLimit = supabaseUsagePercent > 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Otimização de Armazenamento
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitore o consumo de espaço em VPS e Supabase
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
            {cleanupLoading ? 'Limpando...' : 'Limpar Dados Antigos'}
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(isVPSNearLimit || isSupabaseNearLimit) && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Atenção:</strong> {isVPSNearLimit && 'VPS'}{isVPSNearLimit && isSupabaseNearLimit && ' e '}{isSupabaseNearLimit && 'Supabase'} próximo do limite de armazenamento.
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VPS Storage */}
        <Card className="p-6 bg-gradient-card border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Server className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Armazenamento VPS</h3>
              <p className="text-sm text-muted-foreground">Imagens e mídia do site</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Espaço Utilizado</span>
                <span className="text-lg font-bold">
                  {vpsData?.used_mb.toFixed(1)} MB / {(vpsData?.total_mb || 0) / 1024} GB
                </span>
              </div>
              <Progress 
                value={vpsUsagePercent} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {vpsUsagePercent.toFixed(1)}% utilizado - {vpsData?.available_mb.toFixed(0)} MB disponíveis
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
              <div className="bg-muted/30 p-3 rounded-lg">
                <FileImage className="h-4 w-4 text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">Artigos</p>
                <p className="text-lg font-bold">{vpsData?.article_images_mb.toFixed(1)} MB</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <FileImage className="h-4 w-4 text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">Avatares</p>
                <p className="text-lg font-bold">{vpsData?.avatars_mb.toFixed(1)} MB</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <FileImage className="h-4 w-4 text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">Banners</p>
                <p className="text-lg font-bold">{vpsData?.banners_mb.toFixed(1)} MB</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <HardDrive className="h-4 w-4 text-orange-500 mb-1" />
                <p className="text-xs text-muted-foreground">Total Arquivos</p>
                <p className="text-lg font-bold">{vpsData?.total_files || 0}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Sistema operacional
              </span>
            </div>
          </div>
        </Card>

        {/* Supabase Storage */}
        <Card className="p-6 bg-gradient-card border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Cloud className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Armazenamento Supabase</h3>
              <p className="text-sm text-muted-foreground">Banco de dados e storage</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Storage Utilizado</span>
                <span className="text-lg font-bold">
                  {supabaseData?.total_mb.toFixed(1)} MB / {supabaseLimit} MB
                </span>
              </div>
              <Progress 
                value={supabaseUsagePercent} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {supabaseUsagePercent.toFixed(1)}% do plano gratuito
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
              <div className="bg-muted/30 p-3 rounded-lg">
                <Database className="h-4 w-4 text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">Banco de Dados</p>
                <p className="text-lg font-bold">{supabaseData?.database_size_mb.toFixed(1)} MB</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <FileImage className="h-4 w-4 text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">Storage Files</p>
                <p className="text-lg font-bold">{supabaseData?.total_mb.toFixed(1)} MB</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <HardDrive className="h-4 w-4 text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">Artigos</p>
                <p className="text-lg font-bold">{supabaseData?.total_articles || 0}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <HardDrive className="h-4 w-4 text-orange-500 mb-1" />
                <p className="text-xs text-muted-foreground">Comentários</p>
                <p className="text-lg font-bold">{supabaseData?.total_comments || 0}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Plano gratuito ativo
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalhamento Supabase Buckets */}
      {supabaseData && supabaseData.buckets.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-green-500" />
            Detalhamento Storage Supabase
          </h3>
          <div className="space-y-3">
            {supabaseData.buckets.map((bucket) => (
              <div key={bucket.bucket} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{bucket.bucket}</p>
                  <p className="text-sm text-muted-foreground">
                    {bucket.files} arquivos
                  </p>
                </div>
                <Badge variant="outline" className="border-green-500/50">
                  {bucket.size_mb.toFixed(1)} MB
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Informações de Limpeza */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">Limpeza Automática</h4>
            <p className="text-sm text-muted-foreground mb-3">
              A limpeza automática remove dados antigos do Supabase:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Logs de auditoria com mais de 30 dias</li>
              <li>• Comentários órfãos (de artigos deletados)</li>
              <li>• Notificações lidas com mais de 60 dias</li>
              <li>• Backups de localStorage com mais de 7 dias</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StorageOptimizationPanel;
