-- ============================================
-- MIGRATION: ESTRUTURAS AVANÇADAS - PARTE 2
-- Data: 11/09/2025
-- ============================================

-- 1. TABELA DE ARTIGOS NORMALIZADA
CREATE TABLE IF NOT EXISTS public.articles_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  body_richtext TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  cover_image_url TEXT,
  cover_media_id UUID REFERENCES public.media_assets(id),
  status article_status DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES public.authors(id) NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  views INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  seo_jsonb JSONB DEFAULT '{}',
  meta_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE RELACIONAMENTO ARTIGOS-TAGS
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles_normalized(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- 3. BANNER SLOTS (slots programáveis)
CREATE TABLE IF NOT EXISTS public.banner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  default_banner_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. NORMALIZAR BANNERS
CREATE TABLE IF NOT EXISTS public.banners_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type banner_type DEFAULT 'image',
  payload_jsonb JSONB NOT NULL DEFAULT '{}',
  click_url TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  meta_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROGRAMAÇÃO DE BANNERS
CREATE TABLE IF NOT EXISTS public.banner_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES public.banner_slots(id) ON DELETE CASCADE,
  banner_id UUID REFERENCES public.banners_normalized(id) ON DELETE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id, banner_id, starts_at, ends_at)
);

-- 6. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE public.articles_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_schedule ENABLE ROW LEVEL SECURITY;

-- 7. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER trigger_articles_normalized_updated_at BEFORE UPDATE ON public.articles_normalized FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_banner_slots_updated_at BEFORE UPDATE ON public.banner_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_banners_normalized_updated_at BEFORE UPDATE ON public.banners_normalized FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_banner_schedule_updated_at BEFORE UPDATE ON public.banner_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_articles_normalized_status ON public.articles_normalized(status);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_published_at ON public.articles_normalized(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_author_id ON public.articles_normalized(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_category_id ON public.articles_normalized(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_slug ON public.articles_normalized(slug);
CREATE INDEX IF NOT EXISTS idx_banner_schedule_active ON public.banner_schedule(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_banner_slots_key ON public.banner_slots(slot_key);

-- 9. ADICIONAR FK PARA DEFAULT BANNER (após criação das tabelas)
ALTER TABLE public.banner_slots 
ADD CONSTRAINT fk_banner_slots_default_banner 
FOREIGN KEY (default_banner_id) REFERENCES public.banners_normalized(id);

-- 10. FUNÇÃO PARA AUTO-PUBLISH ARTIGOS AGENDADOS
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.articles_normalized 
    SET 
        status = 'published',
        published_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'scheduled' 
        AND scheduled_for <= NOW()
        AND scheduled_for IS NOT NULL;
        
    -- Log das publicações automáticas
    INSERT INTO public.audit_log (event, entity, entity_id, payload_jsonb, level)
    SELECT 
        'auto_publish',
        'article',
        id::text,
        jsonb_build_object('scheduled_for', scheduled_for, 'published_at', published_at),
        'info'
    FROM public.articles_normalized 
    WHERE status = 'published' AND published_at >= NOW() - INTERVAL '1 minute';
END;
$$;