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
  Cloud
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [supabaseData, setSupabaseData] = useState<SupabaseStorageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { toast } = useToast();

  const loadSupabaseStats = async () => {
    try {
      // Buscar dados reais de contagem de tabelas
      const [
        { count: articlesCount },
        { count: commentsCount },
        { count: auditCount },
        { data: storageObjects }
      ] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log').select('*', { count: 'exact', head: true }),
        supabase.storage.from('article-images').list()
      ]);

      // Calcular tamanho dos buckets manualmente
      const buckets = [
        { bucket: 'article-images', files: 0, size_mb: 0 },
        { bucket: 'avatars', files: 0, size_mb: 0 },
        { bucket: 'banners', files: 0, size_mb: 0 }
      ];

      // Buscar TODOS os arquivos de cada bucket com paginação
      for (const bucket of buckets) {
        try {
          let allFiles: any[] = [];
          let page = 0;
          const limit = 100;

          // Paginação para obter todos os arquivos
          while (true) {
            const { data: files, error } = await supabase.storage
              .from(bucket.bucket)
              .list('', { limit, offset: page * limit });
            
            if (error) throw error;
            if (!files || files.length === 0) break;
            
            allFiles = [...allFiles, ...files];
            if (files.length < limit) break;
            page++;
          }

          bucket.files = allFiles.length;
          // Somar o tamanho de todos os arquivos (metadata.size está em bytes)
          const totalBytes = allFiles.reduce((sum, file: any) => {
            return sum + (file.metadata?.size || 0);
          }, 0);
          bucket.size_mb = totalBytes / (1024 * 1024); // Converter para MB
        } catch (err) {
          console.warn(`Erro ao carregar bucket ${bucket.bucket}:`, err);
        }
      }

      const totalStorageMB = buckets.reduce((sum, b) => sum + b.size_mb, 0);
      
      // Estimativa: 2KB por registro de artigo, 1KB por comentário, 0.5KB por log
      const estimatedDbSizeMB = (
        ((articlesCount || 0) * 2) + 
        ((commentsCount || 0) * 1) + 
        ((auditCount || 0) * 0.5)
      ) / 1024;

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
      await loadSupabaseStats();
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
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

  const supabaseLimit = 500; // Limite gratuito Supabase: 500MB
  const supabaseUsagePercent = supabaseData ? (supabaseData.total_mb / supabaseLimit) * 100 : 0;
  const isSupabaseNearLimit = supabaseUsagePercent > 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Otimização de Armazenamento Supabase
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitore o consumo de espaço no Supabase (storage e banco de dados)
            {lastUpdate && <span className="ml-2 text-xs">• Atualizado às {lastUpdate}</span>}
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
      {isSupabaseNearLimit && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Atenção:</strong> Supabase próximo do limite de armazenamento ({supabaseUsagePercent.toFixed(1)}% utilizado).
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo Principal */}
      <Card className="p-6 bg-gradient-card border-green-500/30 max-w-4xl mx-auto">
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

      {/* Detalhamento Supabase Buckets */}
      {supabaseData && supabaseData.buckets.length > 0 && (
        <Card className="p-6 max-w-4xl mx-auto">
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
      <Card className="p-6 bg-muted/30 max-w-4xl mx-auto">
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
