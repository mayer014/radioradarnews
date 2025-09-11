-- ============================================
-- SEEDS: DADOS INICIAIS PARA O SISTEMA
-- ============================================

-- 1. INSERIR CATEGORIAS PADRÃO
INSERT INTO public.categories (slug, name, description, color_hex) VALUES
('politica', 'Política', 'Notícias e análises políticas', '#DC2626'),
('policial', 'Policial', 'Ocorrências policiais e segurança pública', '#7C2D12'),
('entretenimento', 'Entretenimento', 'Cultura, celebridades e lazer', '#7C3AED'),
('internacional', 'Internacional', 'Notícias do mundo', '#059669'),
('esportes', 'Esportes', 'Cobertura esportiva completa', '#EA580C'),
('tecnologia', 'Tecnologia', 'Inovação e tecnologia', '#0284C7'),
('ciencia-saude', 'Ciência / Saúde', 'Descobertas científicas e saúde', '#16A34A')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color_hex = EXCLUDED.color_hex;

-- 2. CRIAR AUTOR PARA MIGRAÇÃO DOS PERFIS EXISTENTES
INSERT INTO public.authors (id, name, bio, is_active) 
SELECT 
  id,
  name,
  COALESCE(bio, 'Autor do RadioRadar.news'),
  is_active
FROM public.profiles 
WHERE role = 'colunista'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  is_active = EXCLUDED.is_active;

-- 3. CRIAR SLOTS DE BANNERS
INSERT INTO public.banner_slots (slot_key, description) VALUES
('hero', 'Banner principal da página inicial'),
('category-politica', 'Banner da categoria Política'),
('category-policial', 'Banner da categoria Policial'),
('category-entretenimento', 'Banner da categoria Entretenimento'),
('category-internacional', 'Banner da categoria Internacional'),
('category-esportes', 'Banner da categoria Esportes'),
('category-tecnologia', 'Banner da categoria Tecnologia'),
('category-ciencia-saude', 'Banner da categoria Ciência / Saúde'),
('sidebar', 'Banner lateral'),
('footer', 'Banner do rodapé')
ON CONFLICT (slot_key) DO UPDATE SET
  description = EXCLUDED.description;

-- 4. MIGRAR BANNERS EXISTENTES PARA ESTRUTURA NORMALIZADA
INSERT INTO public.banners_normalized (id, name, type, payload_jsonb, click_url, active)
SELECT 
  id,
  name,
  'image'::banner_type,
  jsonb_build_object(
    'image_url', gif_url,
    'alt_text', name,
    'width', null,
    'height', null
  ),
  click_url,
  is_active
FROM public.banners
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  payload_jsonb = EXCLUDED.payload_jsonb,
  click_url = EXCLUDED.click_url,
  active = EXCLUDED.active;

-- 5. CRIAR RELACIONAMENTO BANNER-SLOTS BASEADO NO SISTEMA ATUAL
WITH banner_slot_mapping AS (
  SELECT 
    b.id as banner_id,
    CASE 
      WHEN b.position = 'hero' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'hero')
      WHEN b.position = 'category' AND b.category = 'Política' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-politica')
      WHEN b.position = 'category' AND b.category = 'Policial' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-policial')
      WHEN b.position = 'category' AND b.category = 'Entretenimento' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-entretenimento')
      WHEN b.position = 'category' AND b.category = 'Internacional' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-internacional')
      WHEN b.position = 'category' AND b.category = 'Esportes' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-esportes')
      WHEN b.position = 'category' AND b.category = 'Tecnologia' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-tecnologia')
      WHEN b.position = 'category' AND b.category = 'Ciência / Saúde' THEN (SELECT id FROM public.banner_slots WHERE slot_key = 'category-ciencia-saude')
      ELSE (SELECT id FROM public.banner_slots WHERE slot_key = 'sidebar')
    END as slot_id
  FROM public.banners b
  WHERE b.is_active = true
)
UPDATE public.banner_slots 
SET default_banner_id = mapping.banner_id
FROM banner_slot_mapping mapping
WHERE banner_slots.id = mapping.slot_id
  AND mapping.banner_id IS NOT NULL;