-- Fix get_columnist_info to use user_roles table instead of removed profiles.role column
CREATE OR REPLACE FUNCTION public.get_columnist_info(columnist_id uuid)
 RETURNS TABLE(id uuid, name text, avatar text, bio text, specialty text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar,
        p.bio,
        p.specialty
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = columnist_id 
      AND ur.role = 'colunista'
      AND p.is_active = true;
END;
$function$;
