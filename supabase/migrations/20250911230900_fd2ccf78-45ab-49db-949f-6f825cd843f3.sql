-- Fix search_path for all functions to address security warning
-- Update existing functions to set proper search_path

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_active_columnist(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'colunista' AND is_active = true
    );
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_article_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.articles 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.articles 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    CASE 
      WHEN NEW.email = 'admin@radioradar.news' THEN 'admin'::user_role
      ELSE 'colunista'::user_role
    END
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_article_views(article_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    UPDATE public.articles 
    SET views = views + 1 
    WHERE id = article_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_active_columnist_user(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'colunista' AND is_active = true
    );
$function$;

CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_articles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    UPDATE public.articles_normalized 
    SET 
        status = 'published',
        published_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'scheduled' 
        AND scheduled_for <= NOW()
        AND scheduled_for IS NOT NULL;
        
    -- Log das publicações automáticas
    INSERT INTO public.audit_log (event, entity, entity_id, payload_jsonb, level)
    SELECT 
        'auto_publish',
        'article',
        id::text,
        jsonb_build_object('scheduled_for', scheduled_for, 'published_at', published_at),
        'info'
    FROM public.articles_normalized 
    WHERE status = 'published' AND published_at >= NOW() - INTERVAL '1 minute';
END;
$function$;