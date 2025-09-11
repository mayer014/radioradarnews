-- Storage policies for avatars bucket
CREATE POLICY "Avatares são públicos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários autenticados podem enviar avatares" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar avatares" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar avatares" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);