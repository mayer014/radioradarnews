
-- =============================================
-- MÓDULO UTILIDADE PÚBLICA - RRN
-- =============================================

-- 1. Public user profiles (isolado de profiles/user_roles)
CREATE TABLE public.public_user_profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.public_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can view own profile"
ON public.public_user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Public users can update own profile"
ON public.public_user_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Public users can insert own profile"
ON public.public_user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage public profiles"
ON public.public_user_profiles FOR ALL
USING (is_admin_user(auth.uid()));

-- 2. Service categories
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly visible"
ON public.service_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage service categories"
ON public.service_categories FOR ALL
USING (is_admin_user(auth.uid()));

-- Seed categories
INSERT INTO public.service_categories (name, slug, icon, sort_order) VALUES
('Eletricista', 'eletricista', '⚡', 1),
('Encanador', 'encanador', '🔧', 2),
('Pintor', 'pintor', '🎨', 3),
('Pedreiro', 'pedreiro', '🧱', 4),
('Mecânico', 'mecanico', '🔩', 5),
('Diarista', 'diarista', '🧹', 6),
('Jardineiro', 'jardineiro', '🌿', 7),
('Técnico de Informática', 'tecnico-informatica', '💻', 8),
('Cuidador', 'cuidador', '❤️', 9),
('Motorista', 'motorista', '🚗', 10),
('Professor Particular', 'professor-particular', '📚', 11),
('Fotógrafo', 'fotografo', '📷', 12),
('Outros', 'outros', '🔹', 99);

-- 3. Service providers
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.public_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.service_categories(id),
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  whatsapp TEXT NOT NULL,
  charges_estimate BOOLEAN DEFAULT false,
  charges_displacement BOOLEAN DEFAULT false,
  notes TEXT,
  available_days TEXT[] DEFAULT '{}',
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active providers are publicly visible"
ON public.service_providers FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert own providers"
ON public.service_providers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own providers"
ON public.service_providers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own providers"
ON public.service_providers FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all providers"
ON public.service_providers FOR ALL
USING (is_admin_user(auth.uid()));

CREATE INDEX idx_service_providers_category ON public.service_providers(category_id);
CREATE INDEX idx_service_providers_city ON public.service_providers(city);
CREATE INDEX idx_service_providers_active ON public.service_providers(is_active) WHERE is_active = true;

-- 4. Job listings
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.public_user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL, -- clt, pj, freelancer, temporario
  city TEXT NOT NULL,
  neighborhood TEXT,
  salary TEXT,
  requirements TEXT,
  whatsapp TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active jobs are publicly visible"
ON public.job_listings FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert own jobs"
ON public.job_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
ON public.job_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
ON public.job_listings FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all jobs"
ON public.job_listings FOR ALL
USING (is_admin_user(auth.uid()));

CREATE INDEX idx_job_listings_city ON public.job_listings(city);
CREATE INDEX idx_job_listings_type ON public.job_listings(job_type);
CREATE INDEX idx_job_listings_active ON public.job_listings(is_active) WHERE is_active = true;

-- 5. Click tracking (métricas CRM)
CREATE TABLE public.utility_click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'service_provider' ou 'job_listing'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'whatsapp_click',
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.utility_click_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track clicks"
ON public.utility_click_tracking FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view click tracking"
ON public.utility_click_tracking FOR SELECT
USING (is_admin_user(auth.uid()));

CREATE INDEX idx_click_tracking_entity ON public.utility_click_tracking(entity_type, entity_id);
CREATE INDEX idx_click_tracking_date ON public.utility_click_tracking(created_at);

-- 6. Helper function: check if user is a public user
CREATE OR REPLACE FUNCTION public.is_public_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_user_profiles WHERE id = p_user_id
  );
$$;

-- 7. CRM stats function
CREATE OR REPLACE FUNCTION public.get_utility_click_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  click_count BIGINT,
  last_click TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ct.entity_type,
    ct.entity_id,
    CASE 
      WHEN ct.entity_type = 'service_provider' THEN (SELECT sp.name FROM service_providers sp WHERE sp.id = ct.entity_id)
      WHEN ct.entity_type = 'job_listing' THEN (SELECT jl.title FROM job_listings jl WHERE jl.id = ct.entity_id)
      ELSE 'Desconhecido'
    END as entity_name,
    COUNT(*)::BIGINT as click_count,
    MAX(ct.created_at) as last_click
  FROM utility_click_tracking ct
  WHERE ct.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY ct.entity_type, ct.entity_id
  ORDER BY click_count DESC;
END;
$function$;

-- 8. Update trigger to handle public users separately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Public users go to public_user_profiles (isolated)
  IF COALESCE((NEW.raw_user_meta_data->>'is_public_user')::boolean, false) = true THEN
    INSERT INTO public.public_user_profiles (id, full_name, email, phone, city)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'city'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW();
    RETURN NEW;
  END IF;

  -- Admin/columnist users go to profiles + user_roles (existing logic unchanged)
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

-- 9. Updated_at trigger for new tables
CREATE TRIGGER update_public_user_profiles_updated_at
BEFORE UPDATE ON public.public_user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
