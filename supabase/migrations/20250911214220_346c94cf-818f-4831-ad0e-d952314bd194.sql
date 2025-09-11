-- Criar função para incrementar views dos artigos
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.articles 
    SET views = views + 1 
    WHERE id = article_id;
$$;