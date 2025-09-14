-- Dropar view existente e recriar corretamente
DROP VIEW IF EXISTS public.comments_public CASCADE;

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

-- Corrigir função para atualizar contador de comentários nos artigos
-- (a função update_article_comments_count já existe mas não está funcionando corretamente)
CREATE OR REPLACE FUNCTION update_article_comments_count_new()
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

-- Atualizar trigger para usar a nova função
DROP TRIGGER IF EXISTS update_comments_count_trigger ON public.comments;
CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comments_count_new();

-- Para testar: aprovar o comentário existente para que ele apareça
UPDATE comments SET status = 'approved' 
WHERE article_id = 'bb7c9ddd-ca43-4f45-9b38-b1983a7d4f5a' 
AND status = 'pending';