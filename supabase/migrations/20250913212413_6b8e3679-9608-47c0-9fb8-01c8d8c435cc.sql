-- Criar função para garantir exclusividade de destaque por categoria
CREATE OR REPLACE FUNCTION public.ensure_unique_featured_per_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o artigo está sendo marcado como destaque
    IF NEW.featured = true AND (OLD.featured IS NULL OR OLD.featured = false) THEN
        -- Desmarcar outros artigos destacados na mesma categoria
        UPDATE public.articles 
        SET featured = false 
        WHERE category = NEW.category 
            AND featured = true 
            AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para aplicar a função
DROP TRIGGER IF EXISTS ensure_unique_featured_trigger ON public.articles;
CREATE TRIGGER ensure_unique_featured_trigger
    BEFORE UPDATE OR INSERT ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_unique_featured_per_category();