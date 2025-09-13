-- Create simple banner system
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    banner_type TEXT NOT NULL DEFAULT 'category',
    target_category TEXT NULL,
    target_columnist_id UUID NULL,
    start_date TIMESTAMP WITH TIME ZONE NULL,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_pilot BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins podem gerenciar todos os banners" ON public.banners;
DROP POLICY IF EXISTS "Banners ativos são visíveis por todos" ON public.banners;

-- Create policies for banners
CREATE POLICY "Admins podem gerenciar todos os banners" 
ON public.banners 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Banners ativos são visíveis por todos" 
ON public.banners 
FOR SELECT 
USING (
    status = 'active' OR 
    (status = 'scheduled' AND start_date <= now() AND (end_date IS NULL OR end_date >= now())) OR
    is_pilot = true
);

-- Insert pilot banner if not exists
INSERT INTO public.banners (
    title,
    image_url,
    banner_type,
    status,
    is_pilot,
    sort_order
) 
SELECT 
    'Banner Piloto - Rádio Radar RRN News',
    '/lovable-uploads/ff5e1b42-0800-4f2f-af32-28657e649317.png',
    'pilot',
    'active',
    true,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM public.banners WHERE is_pilot = true
);