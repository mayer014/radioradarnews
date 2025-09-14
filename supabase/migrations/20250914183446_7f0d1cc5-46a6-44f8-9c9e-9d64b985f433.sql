-- 1) Coagir valores antigos de stream_url para objeto {url: ...}
UPDATE public.settings
SET value = jsonb_build_object('url', trim(both '"' from value::text))
WHERE category = 'radio' AND key = 'stream_url' AND jsonb_typeof(value) = 'string';

-- 2) Definir a melhor URL (não vazia) como valor de todos os registros de stream_url
WITH candidates AS (
  SELECT 
    (CASE 
      WHEN jsonb_typeof(value) = 'string' THEN trim(both '"' from value::text)
      ELSE value->>'url'
    END) AS url,
    updated_at,
    created_at
  FROM public.settings
  WHERE category = 'radio' AND key = 'stream_url'
), best AS (
  SELECT url
  FROM candidates
  WHERE url IS NOT NULL AND trim(url) <> ''
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1
)
UPDATE public.settings s
SET value = jsonb_build_object('url', (SELECT url FROM best))
WHERE s.category = 'radio' AND s.key = 'stream_url'
AND (SELECT url FROM best) IS NOT NULL;

-- 3) Remover duplicados globalmente por (category, key) mantendo o mais recente
WITH ranked AS (
  SELECT id, category, key,
         ROW_NUMBER() OVER (PARTITION BY category, key ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
  FROM public.settings
)
DELETE FROM public.settings s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 4) Constraint única em (category, key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_category_key_unique'
  ) THEN
    ALTER TABLE public.settings
    ADD CONSTRAINT settings_category_key_unique UNIQUE (category, key);
  END IF;
END $$;

-- 5) Trigger para manter updated_at sempre atualizado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;