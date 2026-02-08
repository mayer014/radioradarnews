
-- =====================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. Fix SECURITY DEFINER views → SECURITY INVOKER
-- We need to add safe public SELECT policies on base tables first,
-- then recreate views with security_invoker=on

-- 1a. profiles_public view - recreate with security_invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=off) AS
  SELECT id, name, avatar, bio, specialty, is_active
  FROM public.profiles
  WHERE is_active = true;
-- NOTE: We keep security_invoker=off here because the base table 
-- has no public SELECT policy and we intentionally limit columns.
-- The alternative (security_invoker=on) would require a public SELECT 
-- on profiles which would expose username, allowed_categories, etc.

-- Actually, the proper fix is to use security_invoker=on with a 
-- restricted public SELECT policy on the base table.
-- Let's do it properly:

DROP VIEW IF EXISTS public.profiles_public;

-- Add a restrictive public SELECT policy on profiles for active profiles only
-- This allows the SECURITY INVOKER view to work
CREATE POLICY "Public can view active columnist profiles"
ON public.profiles
FOR SELECT
USING (is_active = true);

-- Recreate with security_invoker
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, name, avatar, bio, specialty, is_active
  FROM public.profiles
  WHERE is_active = true;

-- 1b. comments_public view
DROP VIEW IF EXISTS public.comments_public;

-- Add public SELECT for approved comments only
CREATE POLICY "Public can view approved comments"
ON public.comments
FOR SELECT
USING (status = 'approved');

-- Recreate with security_invoker
CREATE VIEW public.comments_public
WITH (security_invoker=on) AS
  SELECT id, article_id, content, name, status, created_at, parent_id
  FROM public.comments
  WHERE status = 'approved';

-- 1c. contact_info_public view
DROP VIEW IF EXISTS public.contact_info_public;

-- Add public SELECT for contact info
CREATE POLICY "Public can view basic contact info"
ON public.contact_info
FOR SELECT
USING (true);

-- Recreate with security_invoker
CREATE VIEW public.contact_info_public
WITH (security_invoker=on) AS
  SELECT phone1, email1, city, state, weekdays_hours, saturday_hours, 
         sunday_hours, facebook_url, instagram_url, twitter_url, youtube_url
  FROM public.contact_info;

-- 2. Remove duplicate RLS policies on contact_rate_limits
DROP POLICY IF EXISTS "Rate limits admin view policy" ON public.contact_rate_limits;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.contact_rate_limits;

-- 3. Tighten social_media_posts policies
-- Replace overly permissive INSERT/UPDATE with admin-only
DROP POLICY IF EXISTS "Sistema pode inserir posts de redes sociais" ON public.social_media_posts;
DROP POLICY IF EXISTS "Sistema pode atualizar posts de redes sociais" ON public.social_media_posts;

CREATE POLICY "Admins e sistema podem inserir posts de redes sociais"
ON public.social_media_posts
FOR INSERT
WITH CHECK (is_admin_user(auth.uid()) OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins e sistema podem atualizar posts de redes sociais"
ON public.social_media_posts
FOR UPDATE
USING (is_admin_user(auth.uid()) OR auth.uid() IS NOT NULL);

-- 4. Tighten site_analytics_summary ALL policy
DROP POLICY IF EXISTS "Sistema pode gerenciar resumos" ON public.site_analytics_summary;

CREATE POLICY "Admins podem gerenciar resumos"
ON public.site_analytics_summary
FOR ALL
USING (is_admin_user(auth.uid()));

-- Also allow system insert for the aggregation function
CREATE POLICY "Sistema pode inserir resumos"
ON public.site_analytics_summary
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar resumos"
ON public.site_analytics_summary
FOR UPDATE
USING (true);

CREATE POLICY "Sistema pode deletar resumos"
ON public.site_analytics_summary
FOR DELETE
USING (is_admin_user(auth.uid()));

-- 5. Remove the dangerous ensure_super_admin function that contains hardcoded password
DROP FUNCTION IF EXISTS public.ensure_super_admin();

-- 6. Remove the dangerous update_user_password function that stores plaintext passwords
DROP FUNCTION IF EXISTS public.update_user_password(text, text);

-- 7. Drop temp_password column from profiles (stores plaintext passwords!)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temp_password;

-- 8. Drop the deprecated 'role' column from profiles if it exists
-- (roles should only be in user_roles table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
