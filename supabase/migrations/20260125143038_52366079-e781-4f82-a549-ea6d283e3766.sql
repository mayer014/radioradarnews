-- Criar tabela de configuração de redes sociais
CREATE TABLE public.social_media_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  page_id TEXT NOT NULL,
  instagram_user_id TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  auto_publish_articles BOOLEAN DEFAULT true,
  auto_publish_columnist BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform)
);

-- Criar tabela de log de publicações
CREATE TABLE public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  post_id TEXT,
  image_url TEXT,
  caption TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  error_message TEXT,
  is_columnist_article BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_social_media_posts_article_id ON public.social_media_posts(article_id);
CREATE INDEX idx_social_media_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_media_posts_created_at ON public.social_media_posts(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.social_media_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para social_media_config (apenas admins)
CREATE POLICY "Admins podem gerenciar configurações de redes sociais"
  ON public.social_media_config
  FOR ALL
  USING (public.is_admin_user(auth.uid()));

-- Políticas para social_media_posts
CREATE POLICY "Admins podem ver todos os posts de redes sociais"
  ON public.social_media_posts
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Sistema pode inserir posts de redes sociais"
  ON public.social_media_posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar posts de redes sociais"
  ON public.social_media_posts
  FOR UPDATE
  USING (true);

-- Trigger para updated_at em social_media_config
CREATE TRIGGER update_social_media_config_updated_at
  BEFORE UPDATE ON public.social_media_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();