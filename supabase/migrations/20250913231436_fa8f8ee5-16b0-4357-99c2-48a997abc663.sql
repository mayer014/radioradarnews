-- Harden profiles public exposure: remove username from public view and update safe function

-- 1) Drop existing function to allow changing return type
DROP FUNCTION IF EXISTS public.get_columnist_info(uuid);

-- 2) Drop and recreate the public view without username
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
    id,
    name,
    avatar,
    bio,
    specialty,
    is_active
FROM public.profiles
WHERE is_active = true AND role = 'colunista';

-- Make sure view executes with invoker's rights
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- 3) Recreate the safe function with a reduced return type (no username)
CREATE OR REPLACE FUNCTION public.get_columnist_info(columnist_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    avatar TEXT,
    bio TEXT,
    specialty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar,
        p.bio,
        p.specialty
    FROM public.profiles p
    WHERE p.id = columnist_id 
      AND p.role = 'colunista' 
      AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4) Ensure public can read only the safe view
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;