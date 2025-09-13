-- Final security hardening: remove username from public view and ensure complete data protection

-- Drop and recreate the public view without sensitive username field
DROP VIEW IF EXISTS public.profiles_public;

-- Create a completely safe public view with only display information
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

-- Enable RLS on the view
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- Update the safe function to not expose username either
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

-- Grant access to the safe public view
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;