-- Criar tabela de analytics para rastrear cada acesso
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do acesso
  page_path TEXT NOT NULL,
  page_title TEXT,
  
  -- Informações do visitante (anonimizadas)
  visitor_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Informações de sessão
  session_id UUID,
  is_unique_visit BOOLEAN DEFAULT false,
  
  -- Dados contextuais
  referrer TEXT,
  device_type TEXT,
  country TEXT,
  
  -- Relacionamentos
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  user_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para device_type
  CONSTRAINT valid_device_type CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.site_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON public.site_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_hash ON public.site_analytics(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_article_id ON public.site_analytics(article_id);

-- Criar tabela de resumo diário para consultas rápidas
CREATE TABLE IF NOT EXISTS public.site_analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  date DATE NOT NULL UNIQUE,
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  -- Por tipo de página
  home_visits INTEGER DEFAULT 0,
  article_visits INTEGER DEFAULT 0,
  other_visits INTEGER DEFAULT 0,
  
  -- Por dispositivo
  mobile_visits INTEGER DEFAULT 0,
  desktop_visits INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por período
CREATE INDEX IF NOT EXISTS idx_summary_date ON public.site_analytics_summary(date DESC);

-- Habilitar RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics_summary ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para site_analytics
CREATE POLICY "Admins podem ver todos os analytics"
  ON public.site_analytics FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Sistema pode inserir analytics"
  ON public.site_analytics FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para site_analytics_summary
CREATE POLICY "Admins podem ver resumos"
  ON public.site_analytics_summary FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Sistema pode gerenciar resumos"
  ON public.site_analytics_summary FOR ALL
  USING (true);

-- Função para agregação diária
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.site_analytics_summary (
    date,
    total_visits,
    unique_visitors,
    home_visits,
    article_visits,
    other_visits,
    mobile_visits,
    desktop_visits
  )
  SELECT
    target_date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT visitor_hash) as unique_visitors,
    COUNT(*) FILTER (WHERE page_path = '/') as home_visits,
    COUNT(*) FILTER (WHERE article_id IS NOT NULL) as article_visits,
    COUNT(*) FILTER (WHERE page_path != '/' AND article_id IS NULL) as other_visits,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_visits,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_visits
  FROM public.site_analytics
  WHERE DATE(created_at) = target_date
  ON CONFLICT (date) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    unique_visitors = EXCLUDED.unique_visitors,
    home_visits = EXCLUDED.home_visits,
    article_visits = EXCLUDED.article_visits,
    other_visits = EXCLUDED.other_visits,
    mobile_visits = EXCLUDED.mobile_visits,
    desktop_visits = EXCLUDED.desktop_visits,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;