-- Corrigir problemas de segurança detectados

-- 1. Recriar view comments_public sem SECURITY DEFINER
DROP VIEW IF EXISTS public.comments_public CASCADE;

CREATE VIEW public.comments_public AS 
SELECT 
    id,
    article_id,
    name,
    content,
    created_at,
    parent_id,
    status
FROM public.comments 
WHERE status = 'approved';

-- Permitir acesso público à view
GRANT SELECT ON public.comments_public TO anon, authenticated;

-- 2. Corrigir função com search_path adequado
CREATE OR REPLACE FUNCTION public.update_article_comments_count_new()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar contador quando comentário for inserido, atualizado ou deletado
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE articles 
        SET comments_count = (
            SELECT COUNT(*) 
            FROM comments 
            WHERE article_id = NEW.article_id AND status = 'approved'
        )
        WHERE id = NEW.article_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Se status mudou para approved ou de approved
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE articles 
            SET comments_count = comments_count + 1
            WHERE id = NEW.article_id;
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE articles 
            SET comments_count = GREATEST(comments_count - 1, 0)
            WHERE id = NEW.article_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE articles 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.article_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;