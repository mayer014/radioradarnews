-- Adicionar nova coluna para banner piloto
ALTER TABLE banners_normalized ADD COLUMN is_pilot boolean DEFAULT false;

-- Adicionar nova tabela para fila de banners
CREATE TABLE banner_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_key text NOT NULL,
  banner_id uuid REFERENCES banners_normalized(id) ON DELETE CASCADE,
  priority integer DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_banner_queue_slot_key ON banner_queue(slot_key);
CREATE INDEX idx_banner_queue_priority ON banner_queue(priority DESC);
CREATE INDEX idx_banner_queue_active ON banner_queue(is_active);
CREATE INDEX idx_banner_queue_times ON banner_queue(starts_at, ends_at);

-- RLS para banner_queue
ALTER TABLE banner_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar fila de banners"
ON banner_queue FOR ALL
USING (is_admin_user(auth.uid()));

CREATE POLICY "Fila de banners ativa é visível por todos"
ON banner_queue FOR SELECT
USING (is_active = true);

-- Função para obter o banner ativo atual
CREATE OR REPLACE FUNCTION get_current_banner(slot_key_param text)
RETURNS table(
  banner_id uuid,
  banner_name text,
  banner_payload jsonb,
  banner_click_url text,
  is_pilot boolean,
  queue_priority integer,
  queue_ends_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  now_time timestamp with time zone := now();
BEGIN
  -- Primeiro, tenta encontrar banner ativo na fila
  RETURN QUERY
  SELECT 
    b.id as banner_id,
    b.name as banner_name,
    b.payload_jsonb as banner_payload,
    b.click_url as banner_click_url,
    false as is_pilot,
    bq.priority as queue_priority,
    bq.ends_at as queue_ends_at
  FROM banner_queue bq
  JOIN banners_normalized b ON b.id = bq.banner_id
  WHERE bq.slot_key = slot_key_param
    AND bq.is_active = true
    AND b.active = true
    AND (bq.starts_at IS NULL OR bq.starts_at <= now_time)
    AND (bq.ends_at IS NULL OR bq.ends_at > now_time)
  ORDER BY bq.priority DESC, bq.created_at ASC
  LIMIT 1;
  
  -- Se não encontrou banner na fila, busca o banner piloto
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      b.id as banner_id,
      b.name as banner_name,
      b.payload_jsonb as banner_payload,
      b.click_url as banner_click_url,
      true as is_pilot,
      999 as queue_priority,
      null::timestamp with time zone as queue_ends_at
    FROM banners_normalized b
    WHERE b.is_pilot = true
      AND b.active = true
    ORDER BY b.created_at ASC
    LIMIT 1;
  END IF;
END;
$$;

-- Função para limpar banners expirados da fila
CREATE OR REPLACE FUNCTION cleanup_expired_banners()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Desativar banners expirados na fila
  UPDATE banner_queue 
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
    AND ends_at IS NOT NULL 
    AND ends_at <= now();
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_banner_queue_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_banner_queue_updated_at_trigger
  BEFORE UPDATE ON banner_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_queue_updated_at();