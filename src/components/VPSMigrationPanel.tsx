import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Zap, Database, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface MigrationStatus {
  articles: number
  profiles: number  
  banners: number
}

interface MigrationResult {
  articles: { migrated: number; errors: number; urls_updated: number }
  profiles: { migrated: number; errors: number; urls_updated: number }
  banners: { migrated: number; errors: number; urls_updated: number }
  total_time: number
}

const VPSMigrationPanel: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [progress, setProgress] = useState(0)

  const checkMigrationStatus = async () => {
    setIsChecking(true)
    try {
      const { data, error } = await supabase.functions.invoke('vps-image-migration', {
        body: { action: 'status' }
      })

      if (error) throw error

      setMigrationStatus(data.pending_migration)
      toast.success('Status verificado com sucesso!')
    } catch (error) {
      console.error('Error checking migration status:', error)
      toast.error('Erro ao verificar status da migração')
    } finally {
      setIsChecking(false)
    }
  }

  const startMigration = async () => {
    if (!migrationStatus) {
      toast.error('Verifique o status primeiro')
      return
    }

    const total = migrationStatus.articles + migrationStatus.profiles + migrationStatus.banners
    if (total === 0) {
      toast.info('Não há imagens para migrar')
      return
    }

    setIsMigrating(true)
    setProgress(0)

    try {
      // Simular progresso durante a migração
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90))
      }, 1000)

      const { data, error } = await supabase.functions.invoke('vps-image-migration', {
        body: { action: 'migrate_all' }
      })

      clearInterval(progressInterval)

      if (error) throw error

      setProgress(100)
      setMigrationResult(data.results)
      setMigrationStatus({ articles: 0, profiles: 0, banners: 0 }) // Reset status
      
      toast.success('Migração concluída com sucesso!')
    } catch (error) {
      console.error('Error during migration:', error)
      toast.error('Erro durante a migração')
      setProgress(0)
    } finally {
      setIsMigrating(false)
    }
  }

  const getTotalPending = () => {
    if (!migrationStatus) return 0
    return migrationStatus.articles + migrationStatus.profiles + migrationStatus.banners
  }

  const getTotalMigrated = () => {
    if (!migrationResult) return 0
    return migrationResult.articles.migrated + migrationResult.profiles.migrated + migrationResult.banners.migrated
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-primary/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Migração VPS - Sistema de Imagens</h2>
        </div>

        <p className="text-muted-foreground mb-6">
          Migre todas as imagens do Supabase Storage para sua VPS, liberando espaço e melhorando a performance.
        </p>

        {/* Status Check */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Status da Migração
            </h3>
            <Button 
              variant="outline" 
              onClick={checkMigrationStatus}
              disabled={isChecking}
              size="sm"
            >
              {isChecking ? 'Verificando...' : 'Verificar Status'}
            </Button>
          </div>

          {migrationStatus && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-500">{migrationStatus.articles}</div>
                <div className="text-xs text-muted-foreground">Imagens de Artigos</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-500">{migrationStatus.profiles}</div>
                <div className="text-xs text-muted-foreground">Avatares de Perfis</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-500">{migrationStatus.banners}</div>
                <div className="text-xs text-muted-foreground">Imagens de Banners</div>
              </div>
            </div>
          )}

          {migrationStatus && getTotalPending() > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{getTotalPending()} imagens</strong> encontradas para migração.
                Elas serão movidas do Supabase para sua VPS automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus && getTotalPending() === 0 && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Todas as imagens já foram migradas para a VPS! 🎉
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Migration Progress */}
        {isMigrating && (
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Migrando imagens...</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Migration Results */}
        {migrationResult && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Migração Concluída
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{migrationResult.articles.migrated}</div>
                <div className="text-xs text-muted-foreground">Artigos Migrados</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{migrationResult.profiles.migrated}</div>
                <div className="text-xs text-muted-foreground">Perfis Migrados</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{migrationResult.banners.migrated}</div>
                <div className="text-xs text-muted-foreground">Banners Migrados</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-green-600">
                  {getTotalMigrated()} Total Migrado
                </Badge>
                <span className="text-muted-foreground">
                  Tempo: {(migrationResult.total_time / 1000).toFixed(1)}s
                </span>
              </div>
            </div>

            <Alert className="border-green-500/50 bg-green-500/10">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>Próximos passos:</strong> Todas as imagens agora são servidas pela sua VPS em 
                <code className="mx-1 px-2 py-1 bg-black/20 rounded">media.radioradar.news</code>
                com melhor performance e economia de espaço no Supabase!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Migration Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={startMigration}
            disabled={!migrationStatus || getTotalPending() === 0 || isMigrating}
            className="bg-gradient-hero hover:shadow-glow-primary"
          >
            {isMigrating ? 'Migrando...' : 'Iniciar Migração Completa'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default VPSMigrationPanel