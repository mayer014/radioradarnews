-- Habilitar replica identity para atualizações em tempo real
ALTER TABLE public.articles REPLICA IDENTITY FULL;

-- Adicionar à publicação do realtime se ainda não estiver
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;