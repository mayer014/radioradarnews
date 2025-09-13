-- Fix execute_full_cleanup function by removing VACUUM ANALYZE
-- VACUUM cannot run inside a transaction block

CREATE OR REPLACE FUNCTION public.execute_full_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    deleted_logs integer;
    deleted_comments integer;
    deleted_notifications integer;
    deleted_backup integer;
    result jsonb;
BEGIN
    -- Contar e deletar logs antigos (mais de 30 dias)
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
    
    -- Contar e deletar notificações antigas lidas (mais de 60 dias)
    SELECT COUNT(*) INTO deleted_notifications
    FROM notifications 
    WHERE created_at < NOW() - INTERVAL '60 days' AND is_read = true;
    
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '60 days' AND is_read = true;
    
    -- Contar e deletar backup antigo (mais de 7 dias)
    SELECT COUNT(*) INTO deleted_backup
    FROM local_storage_backup 
    WHERE migrated_at < NOW() - INTERVAL '7 days';
    
    DELETE FROM local_storage_backup 
    WHERE migrated_at < NOW() - INTERVAL '7 days';
    
    -- Retornar estatísticas da limpeza (sem VACUUM)
    SELECT jsonb_build_object(
        'deleted_audit_logs', deleted_logs,
        'deleted_orphaned_comments', deleted_comments,
        'deleted_old_notifications', deleted_notifications,
        'deleted_backup_entries', deleted_backup,
        'cleanup_date', NOW(),
        'status', 'success',
        'note', 'Cleanup completed successfully. VACUUM can be run manually if needed.'
    ) INTO result;
    
    RETURN result;
END;
$function$;