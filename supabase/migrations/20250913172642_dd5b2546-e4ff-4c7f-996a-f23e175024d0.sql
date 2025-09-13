-- Inserir alguns banners de exemplo para teste
INSERT INTO public.banners_normalized (name, payload_jsonb, click_url, active, is_pilot, type) VALUES
  ('Banner Hero Teste', '{"image_url": "/lovable-uploads/ef193e05-ec63-47a4-9731-ac6dd613febc.png", "alt_text": "Banner principal do site"}', 'https://radioradar.news', true, true, 'image'),
  ('Banner News Grid', '{"image_url": "/lovable-uploads/cd040451-205a-4294-91d2-aa9172f90d3e.png", "alt_text": "Banner para área de notícias"}', 'https://radioradar.news/noticias', true, false, 'image'),
  ('Banner Política', '{"image_url": "/lovable-uploads/ff5e1b42-0800-4f2f-af32-28657e649317.png", "alt_text": "Banner categoria política"}', null, true, false, 'image')
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns itens na fila de banners
INSERT INTO public.banner_queue (slot_key, banner_id, priority, is_active, starts_at, ends_at) 
SELECT 
  'news-grid', 
  b.id, 
  10, 
  true, 
  NOW(), 
  NOW() + INTERVAL '7 days'
FROM public.banners_normalized b 
WHERE b.name = 'Banner News Grid'
ON CONFLICT DO NOTHING;

INSERT INTO public.banner_queue (slot_key, banner_id, priority, is_active, starts_at, ends_at) 
SELECT 
  'category-politica', 
  b.id, 
  5, 
  true, 
  NOW(), 
  NOW() + INTERVAL '3 days'
FROM public.banners_normalized b 
WHERE b.name = 'Banner Política'
ON CONFLICT DO NOTHING;