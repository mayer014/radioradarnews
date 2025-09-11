-- ============================================
-- MIGRATION: ESQUEMA NORMALIZADO RADIORADAR
-- Data: 11/09/2025
-- Objetivo: Criar estrutura robusta e normalizada
-- ============================================

-- 1. TYPES E ENUMS
CREATE TYPE article_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE banner_type AS ENUM ('image', 'html', 'embed');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE audit_level AS ENUM ('info', 'warn', 'error');

-- 2. TABELA DE AUTORES (normalizada)
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  social_jsonb JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_hex TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  checksum TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  bucket_name TEXT NOT NULL DEFAULT 'article-images',
  meta_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MIGRAR ARTIGOS PARA ESTRUTURA NORMALIZADA
-- Primeiro, criar nova estrutura de artigos
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

-- 7. TABELA DE RELACIONAMENTO ARTIGOS-TAGS
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles_normalized(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- 8. BANNER SLOTS (slots programáveis)
CREATE TABLE IF NOT EXISTS public.banner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  default_banner_id UUID, -- FK será adicionada depois
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. NORMALIZAR BANNERS
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

-- 10. PROGRAMAÇÃO DE BANNERS
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

-- 11. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_jsonb JSONB DEFAULT '{}',
  level audit_level DEFAULT 'info',
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. ADICIONAR FK PARA DEFAULT BANNER
ALTER TABLE public.banner_slots 
ADD CONSTRAINT fk_banner_slots_default_banner 
FOREIGN KEY (default_banner_id) REFERENCES public.banners_normalized(id);

-- 13. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_articles_normalized_status ON public.articles_normalized(status);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_published_at ON public.articles_normalized(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_author_id ON public.articles_normalized(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_category_id ON public.articles_normalized(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_slug ON public.articles_normalized(slug);
CREATE INDEX IF NOT EXISTS idx_banner_schedule_active ON public.banner_schedule(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- 14. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas normalizadas
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_normalized_updated_at BEFORE UPDATE ON public.articles_normalized FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banners_normalized_updated_at BEFORE UPDATE ON public.banners_normalized FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banner_slots_updated_at BEFORE UPDATE ON public.banner_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banner_schedule_updated_at BEFORE UPDATE ON public.banner_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();