-- Corrigir view comments_public para respeitar RLS usando security_invoker
DROP VIEW IF EXISTS public.comments_public CASCADE;

-- Criar view com security_invoker=true para respeitar RLS
CREATE VIEW public.comments_public
WITH (security_invoker = true) AS 
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