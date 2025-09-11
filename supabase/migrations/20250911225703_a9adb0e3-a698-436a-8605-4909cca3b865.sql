-- ============================================
-- POLÍTICAS RLS PARA NOVAS TABELAS
-- ============================================

-- 1. POLÍTICAS PARA ARTICLES_NORMALIZED
CREATE POLICY "Artigos publicados são visíveis por todos"
ON public.articles_normalized FOR SELECT
USING (status = 'published');

CREATE POLICY "Autores podem ver seus próprios artigos"
ON public.articles_normalized FOR SELECT
USING (author_id IN (
  SELECT id FROM public.authors WHERE id = author_id
) AND is_active_columnist_user(auth.uid()));

CREATE POLICY "Admins podem gerenciar todos os artigos"
ON public.articles_normalized FOR ALL
USING (is_admin_user(auth.uid()));

CREATE POLICY "Colunistas ativos podem criar artigos"
ON public.articles_normalized FOR INSERT
WITH CHECK (is_active_columnist_user(auth.uid()) AND author_id IN (
  SELECT id FROM public.authors WHERE id = author_id
));

CREATE POLICY "Autores podem editar seus próprios artigos"
ON public.articles_normalized FOR UPDATE
USING (author_id IN (
  SELECT id FROM public.authors WHERE id = author_id
) AND is_active_columnist_user(auth.uid()));

-- 2. POLÍTICAS PARA ARTICLE_TAGS
CREATE POLICY "Tags de artigos são visíveis como os artigos"
ON public.article_tags FOR SELECT
USING (article_id IN (
  SELECT id FROM public.articles_normalized WHERE status = 'published'
));

CREATE POLICY "Admins podem gerenciar tags de artigos"
ON public.article_tags FOR ALL
USING (is_admin_user(auth.uid()));

-- 3. POLÍTICAS PARA BANNERS_NORMALIZED
CREATE POLICY "Banners ativos são visíveis por todos"
ON public.banners_normalized FOR SELECT
USING (active = true);

CREATE POLICY "Admins podem gerenciar banners"
ON public.banners_normalized FOR ALL
USING (is_admin_user(auth.uid()));

-- 4. POLÍTICAS PARA BANNER_SLOTS
CREATE POLICY "Slots de banners ativos são visíveis por todos"
ON public.banner_slots FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar slots de banners"
ON public.banner_slots FOR ALL
USING (is_admin_user(auth.uid()));

-- 5. POLÍTICAS PARA BANNER_SCHEDULE
CREATE POLICY "Programação de banners ativa é visível por todos"
ON public.banner_schedule FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar programação de banners"
ON public.banner_schedule FOR ALL
USING (is_admin_user(auth.uid()));