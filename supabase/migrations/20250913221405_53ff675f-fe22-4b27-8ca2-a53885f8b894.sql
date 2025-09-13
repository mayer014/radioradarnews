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

-- 2. Criar função para verificar arquivos órfãos no storage (corrigida)
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
        so.bucket_id::text,
        so.name::text,
        (so.metadata->>'size')::bigint
    FROM storage.objects so
    WHERE so.bucket_id IN ('article-images', 'avatars', 'banners')
    AND (
        (so.bucket_id = 'article-images' AND NOT EXISTS (
            SELECT 1 FROM articles WHERE featured_image LIKE '%' || so.name || '%'
        ))
        OR
        (so.bucket_id = 'avatars' AND NOT EXISTS (
            SELECT 1 FROM profiles WHERE avatar LIKE '%' || so.name || '%'
        ))
        OR
        (so.bucket_id = 'banners' AND NOT EXISTS (
            SELECT 1 FROM banners WHERE image_url LIKE '%' || so.name || '%'
        ))
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
        so.bucket_id::text,
        COUNT(*)::bigint,
        ROUND(SUM((so.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2)
    FROM storage.objects so
    GROUP BY so.bucket_id
    ORDER BY SUM((so.metadata->>'size')::bigint) DESC;
END;
$$;

-- 4. Otimizar índices existentes - remover duplicados e adicionar essenciais
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