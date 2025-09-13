-- 1. Criar função para limpeza de dados obsoletos
CREATE OR REPLACE FUNCTION public.cleanup_obsolete_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Limpar logs de auditoria mais antigos que 30 dias
    DELETE FROM audit_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Limpar comentários órfãos (artigos que não existem mais)
    DELETE FROM comments 
    WHERE article_id NOT IN (SELECT id FROM articles);
    
    -- Limpar notificações antigas (mais de 60 dias)
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '60 days' AND is_read = true;
    
    -- Limpar backup de localStorage antigo (mais de 7 dias)
    DELETE FROM local_storage_backup 
    WHERE migrated_at < NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Limpeza de dados obsoletos concluída';
END;
$$;

-- 2. Criar função para verificar arquivos órfãos no storage
CREATE OR REPLACE FUNCTION public.get_orphaned_files()
RETURNS TABLE (
    bucket_name text,
    file_path text,
    file_size bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id,
        so.name,
        so.metadata->>'size'::bigint
    FROM storage.objects so
    WHERE so.bucket_id IN ('article-images', 'avatars', 'banners')
    AND NOT EXISTS (
        CASE 
            WHEN so.bucket_id = 'article-images' THEN
                -- Verificar se a imagem está sendo usada em artigos
                (SELECT 1 FROM articles WHERE featured_image LIKE '%' || so.name || '%')
            WHEN so.bucket_id = 'avatars' THEN
                -- Verificar se o avatar está sendo usado em perfis
                (SELECT 1 FROM profiles WHERE avatar LIKE '%' || so.name || '%')
            WHEN so.bucket_id = 'banners' THEN
                -- Verificar se o banner está ativo
                (SELECT 1 FROM banners WHERE image_url LIKE '%' || so.name || '%')
            ELSE
                -- Por padrão, manter arquivos não identificados
                (SELECT 1)
        END
    );
END;
$$;

-- 3. Criar função para monitorar uso de espaço
CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS TABLE (
    bucket_name text,
    file_count bigint,
    total_size_mb numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.bucket_id,
        COUNT(*)::bigint,
        ROUND(SUM((so.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2)
    FROM storage.objects so
    GROUP BY so.bucket_id
    ORDER BY SUM((so.metadata->>'size')::bigint) DESC;
END;
$$;

-- 4. Otimizar índices existentes - remover duplicados e adicionar essenciais
-- Verificar e criar apenas índices necessários
DROP INDEX IF EXISTS idx_articles_category_created;
DROP INDEX IF EXISTS idx_articles_status_created;
DROP INDEX IF EXISTS idx_articles_featured;

-- Índices essenciais otimizados
CREATE INDEX IF NOT EXISTS idx_articles_status_category_created 
ON articles(status, category, created_at DESC) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_columnist_created 
ON articles(columnist_id, created_at DESC) 
WHERE columnist_id IS NOT NULL AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_featured_category 
ON articles(featured, category) 
WHERE featured = true AND status = 'published';

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_comments_article_status 
ON comments(article_id, status);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read, created_at DESC);

-- 5. Consolidar configurações em tabela única otimizada
-- Já existe a tabela settings, vamos otimizá-la
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_category_unique;
ALTER TABLE settings ADD CONSTRAINT settings_key_category_unique 
UNIQUE(key, category);

-- Inserir configurações padrão se não existirem
INSERT INTO settings (key, category, value) VALUES
('stream_url', 'radio', '"https://radioradar.news/stream"'::jsonb),
('compression_quality', 'media', '0.8'::jsonb),
('max_file_size_mb', 'media', '5'::jsonb),
('cleanup_interval_days', 'system', '7'::jsonb),
('storage_warning_threshold_mb', 'system', '400'::jsonb)
ON CONFLICT (key, category) DO NOTHING;

-- 6. Criar trigger para limpeza automática
CREATE OR REPLACE FUNCTION public.auto_cleanup_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Executar limpeza automática a cada 100 inserções de artigos
    IF (SELECT COUNT(*) FROM articles) % 100 = 0 THEN
        PERFORM public.cleanup_obsolete_data();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para executar limpeza periodicamente
DROP TRIGGER IF EXISTS trigger_auto_cleanup ON articles;
CREATE TRIGGER trigger_auto_cleanup
    AFTER INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_trigger();

-- 7. Função para obter estatísticas de otimização
CREATE OR REPLACE FUNCTION public.get_optimization_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    stats jsonb;
    storage_usage jsonb;
    db_size text;
BEGIN
    -- Estatísticas de banco
    SELECT jsonb_build_object(
        'total_articles', (SELECT COUNT(*) FROM articles),
        'published_articles', (SELECT COUNT(*) FROM articles WHERE status = 'published'),
        'draft_articles', (SELECT COUNT(*) FROM articles WHERE status = 'draft'),
        'total_comments', (SELECT COUNT(*) FROM comments),
        'approved_comments', (SELECT COUNT(*) FROM comments WHERE status = 'approved'),
        'audit_logs', (SELECT COUNT(*) FROM audit_log),
        'notifications', (SELECT COUNT(*) FROM notifications),
        'storage_backup_entries', (SELECT COUNT(*) FROM local_storage_backup)
    ) INTO stats;
    
    -- Estatísticas de storage
    SELECT jsonb_agg(
        jsonb_build_object(
            'bucket', bucket_name,
            'files', file_count,
            'size_mb', total_size_mb
        )
    ) INTO storage_usage
    FROM public.get_storage_usage();
    
    -- Tamanho do banco (aproximado)
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    RETURN jsonb_build_object(
        'database_stats', stats,
        'storage_usage', storage_usage,
        'database_size', db_size,
        'last_check', NOW()
    );
END;
$$;