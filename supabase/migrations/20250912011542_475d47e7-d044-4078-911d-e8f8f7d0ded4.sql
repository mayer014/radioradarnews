-- Update handle_new_user to grant admin role to adm@radioradar.news
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    CASE 
      WHEN NEW.email = 'adm@radioradar.news' THEN 'admin'::user_role
      ELSE 'colunista'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  RETURN NEW;
END;
$function$;