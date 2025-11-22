-- Adicionar política para permitir que colunistas deletem seus próprios artigos
CREATE POLICY "Colunistas podem deletar seus próprios artigos" 
ON public.articles 
FOR DELETE 
USING (
  (author_id = auth.uid()) AND is_active_columnist(auth.uid())
);