-- Políticas RLS para bucket article-images
-- Permitir que qualquer pessoa visualize as imagens dos artigos (público)
CREATE POLICY "Imagens de artigos são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'article-images');

-- Permitir que usuários autenticados façam upload de imagens
CREATE POLICY "Usuários autenticados podem fazer upload de imagens" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);

-- Permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Usuários autenticados podem atualizar imagens" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);

-- Permitir que usuários autenticados deletem suas próprias imagens
CREATE POLICY "Usuários autenticados podem deletar imagens" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);