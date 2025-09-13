-- Correções para o sistema de banners

-- 1. Definir o Banner Principal como piloto (fallback quando não há banners específicos)
UPDATE banners_normalized 
SET is_pilot = true 
WHERE id = 'b39c34bc-5954-47fe-aaa7-e7750d2ec11d' AND name = 'Banner Principal';

-- 2. Atualizar URLs dos banners que começam com /src/assets/ para URLs públicas
UPDATE banners_normalized 
SET payload_jsonb = jsonb_set(
    payload_jsonb, 
    '{image_url}', 
    to_jsonb(replace(payload_jsonb->>'image_url', '/src/assets/', '/'))
)
WHERE payload_jsonb->>'image_url' LIKE '/src/assets/%';

-- 3. Garantir que não existam múltiplos banners piloto (apenas um deve ser piloto)
UPDATE banners_normalized 
SET is_pilot = false 
WHERE is_pilot = true AND id != 'b39c34bc-5954-47fe-aaa7-e7750d2ec11d';

-- 4. Criar alguns exemplos de entradas na fila se não existirem para teste
INSERT INTO banner_queue (slot_key, banner_id, priority, starts_at, ends_at, is_active)
VALUES 
  ('hero', 'b39c34bc-5954-47fe-aaa7-e7750d2ec11d', 10, NOW(), NOW() + INTERVAL '30 days', true)
ON CONFLICT DO NOTHING;