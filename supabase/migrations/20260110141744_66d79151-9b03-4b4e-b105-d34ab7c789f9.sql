-- Primeiro, vamos popular o site_analytics_summary com os dados que faltam
-- Inserir dados consolidados por dia para todos os dias que têm registros em site_analytics

INSERT INTO site_analytics_summary (
  date,
  total_visits,
  unique_visitors,
  home_visits,
  article_visits,
  desktop_visits,
  mobile_visits,
  other_visits,
  created_at,
  updated_at
)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT visitor_hash) as unique_visitors,
  COUNT(*) FILTER (WHERE page_path = '/' OR page_path = '') as home_visits,
  COUNT(*) FILTER (WHERE page_path LIKE '/noticia/%' OR page_path LIKE '/colunista/%') as article_visits,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_visits,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_visits,
  COUNT(*) FILTER (WHERE device_type NOT IN ('desktop', 'mobile') OR device_type IS NULL) as other_visits,
  NOW() as created_at,
  NOW() as updated_at
FROM site_analytics
WHERE DATE(created_at) NOT IN (SELECT date FROM site_analytics_summary)
GROUP BY DATE(created_at)
ORDER BY date;

-- Verificar e corrigir a função aggregate_daily_analytics para garantir que rode corretamente
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date date DEFAULT (CURRENT_DATE - INTERVAL '1 day')::date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar registro existente para o dia alvo (para permitir re-execução)
  DELETE FROM site_analytics_summary WHERE date = target_date;
  
  -- Inserir dados consolidados do dia
  INSERT INTO site_analytics_summary (
    date,
    total_visits,
    unique_visitors,
    home_visits,
    article_visits,
    desktop_visits,
    mobile_visits,
    other_visits,
    created_at,
    updated_at
  )
  SELECT 
    target_date as date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT visitor_hash) as unique_visitors,
    COUNT(*) FILTER (WHERE page_path = '/' OR page_path = '') as home_visits,
    COUNT(*) FILTER (WHERE page_path LIKE '/noticia/%' OR page_path LIKE '/colunista/%') as article_visits,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_visits,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_visits,
    COUNT(*) FILTER (WHERE device_type NOT IN ('desktop', 'mobile') OR device_type IS NULL) as other_visits,
    NOW() as created_at,
    NOW() as updated_at
  FROM site_analytics
  WHERE DATE(created_at) = target_date
  HAVING COUNT(*) > 0;
  
  RAISE NOTICE 'Analytics aggregated for date: %', target_date;
END;
$$;