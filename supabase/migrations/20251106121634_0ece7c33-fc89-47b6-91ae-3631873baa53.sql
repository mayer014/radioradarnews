-- ============================================================================
-- CRITICAL SECURITY FIXES - Error Level Issues Only
-- ============================================================================

-- ============================================================================
-- FIX 1: Move roles from profiles to dedicated user_roles table
-- ============================================================================

-- Create the user_roles table with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create the has_role security definer function (if not exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update all RLS policies to use has_role function instead of profile.role

-- Drop old profile policies that check role
DROP POLICY IF EXISTS "Admins can view all profiles secure" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem inserir novos perfis" ON public.profiles;

-- Create new profile policies using has_role
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS policy for user_roles table
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop the profiles_public view that depends on role column
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- Remove role column from profiles (data already migrated)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Recreate profiles_public view without role column
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  name,
  avatar,
  bio,
  specialty,
  is_active
FROM public.profiles
WHERE is_active = true;

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- ============================================================================
-- FIX 2: Remove plaintext temporary passwords
-- ============================================================================

-- Remove the temp_password column entirely
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temp_password;

-- ============================================================================
-- FIX 3: Protect commenter email addresses
-- ============================================================================

-- Drop existing comments_public view if exists
DROP VIEW IF EXISTS public.comments_public CASCADE;

-- Create a public-safe view for comments (without email and IP)
CREATE OR REPLACE VIEW public.comments_public AS
SELECT 
  id,
  article_id,
  name,
  content,
  status,
  created_at,
  parent_id
FROM public.comments
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.comments_public TO anon;
GRANT SELECT ON public.comments_public TO authenticated;

-- Drop public access policies from comments table
DROP POLICY IF EXISTS "Public can view approved comments safely" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can view approved comments" ON public.comments;

-- Create restrictive policy - only admins can access full comments table
CREATE POLICY "Only admins can view all comment data"
ON public.comments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- FIX 4: Update existing functions and triggers
-- ============================================================================

-- Update handle_new_user trigger to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert profile without role
  INSERT INTO public.profiles (id, username, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  -- Assign role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'adm@radioradar.news' THEN 'admin'::user_role
      ELSE 'colunista'::user_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update is_admin function to use user_roles
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = 'admin'
  );
$function$;

-- Update is_admin_user function to use user_roles
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = 'admin'
  );
$function$;

-- Update is_active_columnist function
CREATE OR REPLACE FUNCTION public.is_active_columnist(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = $1 
      AND ur.role = 'colunista' 
      AND p.is_active = true
  );
$function$;

-- Update is_active_columnist_user function
CREATE OR REPLACE FUNCTION public.is_active_columnist_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = $1 
      AND ur.role = 'colunista' 
      AND p.is_active = true
  );
$function$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.user_roles 
  WHERE user_id = $1 
  LIMIT 1;
$function$;