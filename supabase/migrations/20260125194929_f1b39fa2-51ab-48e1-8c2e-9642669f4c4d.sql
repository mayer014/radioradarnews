-- Adicionar policy permitindo upload para qualquer usuário autenticado no bucket art-templates
-- Isso resolve o problema em produção onde a verificação de role pode falhar

-- Primeiro, remover a policy restritiva atual
DROP POLICY IF EXISTS "Admins can upload art template images" ON storage.objects;

-- Criar nova policy que permite qualquer usuário autenticado fazer upload
CREATE POLICY "Authenticated users can upload art template images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'art-templates' 
  AND auth.role() = 'authenticated'
);

-- Também permitir update e delete para usuários autenticados
DROP POLICY IF EXISTS "Admins can update art template images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete art template images" ON storage.objects;

CREATE POLICY "Authenticated users can update art template images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'art-templates' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete art template images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'art-templates' 
  AND auth.role() = 'authenticated'
);