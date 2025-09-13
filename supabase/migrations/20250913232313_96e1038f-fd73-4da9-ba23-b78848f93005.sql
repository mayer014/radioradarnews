-- Fix contact_info security vulnerability by creating a public-safe view

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Informações de contato são visíveis por todos" ON public.contact_info;

-- 2. Create a new restrictive policy - only authenticated users can view all contact info
CREATE POLICY "Authenticated users can view contact info" ON public.contact_info
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Create a public-safe view with only essential contact information
CREATE OR REPLACE VIEW public.contact_info_public AS
SELECT 
    phone1,
    email1,
    city,
    state,
    weekdays_hours,
    saturday_hours,
    sunday_hours
FROM public.contact_info;

-- 4. Enable RLS on the view (inherits from base table)
ALTER VIEW public.contact_info_public SET (security_invoker = true);

-- 5. Grant public access to the safe view only
GRANT SELECT ON public.contact_info_public TO anon;
GRANT SELECT ON public.contact_info_public TO authenticated;

-- 6. Create a function for public contact info access (extra security layer)
CREATE OR REPLACE FUNCTION public.get_public_contact_info()
RETURNS TABLE(
    phone1 TEXT,
    email1 TEXT,
    city TEXT,
    state TEXT,
    weekdays_hours TEXT,
    saturday_hours TEXT,
    sunday_hours TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.phone1,
        ci.email1,
        ci.city,
        ci.state,
        ci.weekdays_hours,
        ci.saturday_hours,
        ci.sunday_hours
    FROM public.contact_info ci
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 7. Grant execute permission on the function to public
GRANT EXECUTE ON FUNCTION public.get_public_contact_info() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_contact_info() TO authenticated;