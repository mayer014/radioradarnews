-- 1. Criar função para limpeza de dados obsoletos (já criada)
-- Esta função já foi criada na migração anterior

-- 2. Função corrigida para verificar arquivos órfãos no storage
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

-- 3. Função para executar limpeza manual completa
CREATE OR REPLACE FUNCTION public.execute_full_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    deleted_logs integer;
    deleted_comments integer;
    deleted_notifications integer;
    deleted_backup integer;
    result jsonb;
BEGIN
    -- Contar e deletar logs antigos
    SELECT COUNT(*) INTO deleted_logs
    FROM audit_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM audit_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Contar e deletar comentários órfãos
    SELECT COUNT(*) INTO deleted_comments
    FROM comments 
    WHERE article_id NOT IN (SELECT id FROM articles);
    
    DELETE FROM comments 
    WHERE article_id NOT IN (SELECT id FROM articles);
    
    -- Contar e deletar notificações antigas lidas
    SELECT COUNT(*) INTO deleted_notifications
    FROM notifications 
    WHERE created_at < NOW() - INTERVAL '60 days' AND is_read = true;
    
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '60 days' AND is_read = true;
    
    -- Contar e deletar backup antigo
    SELECT COUNT(*) INTO deleted_backup
    FROM local_storage_backup 
    WHERE migrated_at < NOW() - INTERVAL '7 days';
    
    DELETE FROM local_storage_backup 
    WHERE migrated_at < NOW() - INTERVAL '7 days';
    
    -- Vacuum para recuperar espaço
    VACUUM ANALYZE;
    
    -- Retornar estatísticas da limpeza
    SELECT jsonb_build_object(
        'deleted_audit_logs', deleted_logs,
        'deleted_orphaned_comments', deleted_comments,
        'deleted_old_notifications', deleted_notifications,
        'deleted_backup_entries', deleted_backup,
        'cleanup_date', NOW(),
        'status', 'success'
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 4. Garantir hard delete para artigos (modificar função delete)
CREATE OR REPLACE FUNCTION public.hard_delete_article(article_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Primeiro deletar comentários relacionados
    DELETE FROM comments WHERE article_id = article_id_param;
    
    -- Deletar tags relacionadas
    DELETE FROM article_tags WHERE article_id = article_id_param;
    
    -- Finalmente deletar o artigo
    DELETE FROM articles WHERE id = article_id_param;
    
    -- Verificar se foi deletado
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- 5. Configurar RLS para as novas funções
GRANT EXECUTE ON FUNCTION public.get_orphaned_files() TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_full_cleanup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hard_delete_article(uuid) TO authenticated;