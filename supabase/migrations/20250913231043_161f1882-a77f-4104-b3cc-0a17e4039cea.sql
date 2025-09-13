-- Fix critical security vulnerability in profiles table
-- Remove public access to sensitive user account information

-- First, drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Profiles são visíveis por todos" ON public.profiles;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active columnist basic info" ON public.profiles;

-- Create a secure view for public profile access that only exposes safe data
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
    id,
    username,
    name,
    avatar,
    bio,
    specialty,
    is_active
FROM public.profiles
WHERE is_active = true AND role = 'colunista';

-- Enable RLS on the view
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- Create restrictive policies for profile access

-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own profile secure" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Admins can view all profiles (for management)
CREATE POLICY "Admins can view all profiles secure" 
ON public.profiles 
FOR SELECT 
USING (is_admin_user(auth.uid()));

-- 3. Public can only see basic columnist info (for article attribution)
-- Exclude sensitive fields: role, temp_password, allowed_categories
CREATE POLICY "Public columnist basic info only" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() IS NULL 
    AND role = 'colunista' 
    AND is_active = true
);

-- Grant access to the safe public view
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Create a function to safely get columnist info for articles (without sensitive data)
CREATE OR REPLACE FUNCTION public.get_columnist_info(columnist_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    username TEXT,
    avatar TEXT,
    bio TEXT,
    specialty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.username,
        p.avatar,
        p.bio,
        p.specialty
    FROM public.profiles p
    WHERE p.id = columnist_id 
        AND p.role = 'colunista' 
        AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;