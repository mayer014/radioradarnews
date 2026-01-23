-- Criar bucket público para artes de templates (backgrounds e logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'art-templates',
  'art-templates',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ver as imagens (bucket público)
CREATE POLICY "Art template images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'art-templates');

-- Política: apenas admins podem fazer upload
CREATE POLICY "Admins can upload art template images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'art-templates' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: admins podem atualizar
CREATE POLICY "Admins can update art template images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'art-templates' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política: admins podem deletar
CREATE POLICY "Admins can delete art template images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'art-templates' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);