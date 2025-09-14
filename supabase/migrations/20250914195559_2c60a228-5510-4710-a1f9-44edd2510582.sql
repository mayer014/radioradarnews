-- Primeiro, vamos verificar se comments_public é uma tabela ou view
-- Se for tabela, vamos removê-la e criar uma view

DROP TABLE IF EXISTS public.comments_public CASCADE;

-- Criar uma view para comentários públicos (somente comentários aprovados)
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

-- Criar função para atualizar contador de comentários nos artigos
CREATE OR REPLACE FUNCTION update_article_comments_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para manter contador atualizado
DROP TRIGGER IF EXISTS update_comments_count_trigger ON public.comments;
CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comments_count();