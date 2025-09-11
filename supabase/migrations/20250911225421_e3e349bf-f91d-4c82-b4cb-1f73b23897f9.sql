-- ============================================
-- CORREÇÃO CRÍTICA: HABILITAR RLS E POLÍTICAS
-- Data: 11/09/2025
-- ============================================

-- 1. HABILITAR RLS EM TODAS AS NOVAS TABELAS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2. FUNÇÕES DE SEGURANÇA (sem recursão RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_columnist_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'colunista' AND is_active = true
    );
$$;

-- 3. POLÍTICAS PARA AUTHORS
CREATE POLICY "Autores são visíveis por todos"
ON public.authors FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar autores"
ON public.authors FOR ALL
USING (is_admin_user(auth.uid()));

-- 4. POLÍTICAS PARA CATEGORIES
CREATE POLICY "Categorias ativas são visíveis por todos"
ON public.categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar categorias"
ON public.categories FOR ALL
USING (is_admin_user(auth.uid()));

-- 5. POLÍTICAS PARA TAGS
CREATE POLICY "Tags são visíveis por todos"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Admins podem gerenciar tags"
ON public.tags FOR ALL
USING (is_admin_user(auth.uid()));

-- 6. POLÍTICAS PARA MEDIA_ASSETS
CREATE POLICY "Media assets são visíveis por seus criadores e admins"
ON public.media_assets FOR SELECT
USING (uploaded_by = auth.uid() OR is_admin_user(auth.uid()));

CREATE POLICY "Usuários autenticados podem fazer upload"
ON public.media_assets FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

CREATE POLICY "Criadores e admins podem atualizar media"
ON public.media_assets FOR UPDATE
USING (uploaded_by = auth.uid() OR is_admin_user(auth.uid()));

CREATE POLICY "Criadores e admins podem deletar media"
ON public.media_assets FOR DELETE
USING (uploaded_by = auth.uid() OR is_admin_user(auth.uid()));

-- 7. POLÍTICAS PARA AUDIT_LOG
CREATE POLICY "Admins podem ver todos os logs de auditoria"
ON public.audit_log FOR SELECT
USING (is_admin_user(auth.uid()));

CREATE POLICY "Sistema pode inserir logs de auditoria"
ON public.audit_log FOR INSERT
WITH CHECK (true); -- Permitir inserção do sistema/triggers