-- Criar tabela para registrar uso de tokens da LLM
CREATE TABLE public.llm_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'groq',
  model TEXT NOT NULL,
  function_name TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 8) NOT NULL DEFAULT 0,
  request_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_llm_usage_logs_created_at ON public.llm_usage_logs(created_at DESC);
CREATE INDEX idx_llm_usage_logs_provider ON public.llm_usage_logs(provider);
CREATE INDEX idx_llm_usage_logs_function ON public.llm_usage_logs(function_name);

-- RLS - apenas admins podem ver os logs
ALTER TABLE public.llm_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view llm usage logs"
ON public.llm_usage_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert llm usage logs"
ON public.llm_usage_logs
FOR INSERT
WITH CHECK (true);

-- Função para agregar estatísticas de uso
CREATE OR REPLACE FUNCTION public.get_llm_usage_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  total_tokens BIGINT,
  total_cost_usd NUMERIC,
  request_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN created_at >= CURRENT_DATE THEN 'today'
      WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'week'
      ELSE 'month'
    END as period,
    SUM(l.total_tokens)::BIGINT as total_tokens,
    SUM(l.cost_usd) as total_cost_usd,
    COUNT(*)::BIGINT as request_count
  FROM public.llm_usage_logs l
  WHERE l.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY 
    CASE 
      WHEN created_at >= CURRENT_DATE THEN 'today'
      WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'week'
      ELSE 'month'
    END;
END;
$$;