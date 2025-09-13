-- Migração para corrigir sistema de banners e criar banners iniciais
-- Primeiro, vamos garantir que há banners na tabela banners_normalized

-- Inserir banners padrões se não existirem
INSERT INTO public.banners_normalized (name, type, payload_jsonb, active, is_pilot, priority)
SELECT * FROM (VALUES
  ('Banner Principal', 'image'::banner_type, '{"image_url": "/src/assets/banner-principal.jpg", "alt_text": "Banner Principal", "width": 1200, "height": 400}'::jsonb, true, true, 100),
  ('Banner Política', 'image'::banner_type, '{"image_url": "/src/assets/banner-politica.jpg", "alt_text": "Banner Política", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Tecnologia', 'image'::banner_type, '{"image_url": "/src/assets/banner-tecnologia.jpg", "alt_text": "Banner Tecnologia", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Esportes', 'image'::banner_type, '{"image_url": "/src/assets/banner-esportes.jpg", "alt_text": "Banner Esportes", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Internacional', 'image'::banner_type, '{"image_url": "/src/assets/banner-internacional.jpg", "alt_text": "Banner Internacional", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Policial', 'image'::banner_type, '{"image_url": "/src/assets/banner-policial.jpg", "alt_text": "Banner Policial", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Entretenimento', 'image'::banner_type, '{"image_url": "/src/assets/banner-entretenimento.jpg", "alt_text": "Banner Entretenimento", "width": 1200, "height": 400}'::jsonb, true, false, 80),
  ('Banner Ciência/Saúde', 'image'::banner_type, '{"image_url": "/src/assets/banner-ciencia-saude.jpg", "alt_text": "Banner Ciência e Saúde", "width": 1200, "height": 400}'::jsonb, true, false, 80)
) AS v(name, type, payload_jsonb, active, is_pilot, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.banners_normalized WHERE name = v.name
);

-- Garantir que apenas um banner seja piloto (o Banner Principal)
UPDATE public.banners_normalized 
SET is_pilot = CASE WHEN name = 'Banner Principal' THEN true ELSE false END
WHERE is_pilot = true OR name = 'Banner Principal';