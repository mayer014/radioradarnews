-- Create enum for banner types
CREATE TYPE banner_type AS ENUM ('pilot', 'hero', 'category', 'columnist');

-- Create enum for banner status
CREATE TYPE banner_status AS ENUM ('active', 'scheduled', 'expired', 'draft');

-- Create banners table
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    banner_type banner_type NOT NULL DEFAULT 'category',
    target_category TEXT NULL, -- For category banners
    target_columnist_id UUID NULL, -- For columnist banners
    start_date TIMESTAMP WITH TIME ZONE NULL,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    status banner_status NOT NULL DEFAULT 'draft',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_pilot BOOLEAN NOT NULL DEFAULT false, -- Mark pilot banner
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_banner_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_banner_timestamps();

-- Create function to get active banner for a specific area
CREATE OR REPLACE FUNCTION public.get_active_banner(
    p_banner_type banner_type,
    p_target_category TEXT DEFAULT NULL,
    p_target_columnist_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    image_url TEXT,
    banner_type banner_type,
    is_pilot BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- First try to get active/scheduled banners for the specific target
    SELECT 
        b.id,
        b.title,
        b.image_url,
        b.banner_type,
        b.is_pilot
    FROM public.banners b
    WHERE b.banner_type = p_banner_type
        AND (
            (p_banner_type = 'category' AND b.target_category = p_target_category) OR
            (p_banner_type = 'columnist' AND b.target_columnist_id = p_target_columnist_id) OR
            (p_banner_type = 'hero')
        )
        AND (
            (b.status = 'active') OR
            (b.status = 'scheduled' AND b.start_date <= now() AND (b.end_date IS NULL OR b.end_date >= now()))
        )
        AND b.is_pilot = false
    ORDER BY b.sort_order ASC, b.created_at DESC
    LIMIT 1
    
    UNION ALL
    
    -- If no specific banner found, get pilot banner as fallback
    SELECT 
        b.id,
        b.title,
        b.image_url,
        b.banner_type,
        b.is_pilot
    FROM public.banners b
    WHERE b.is_pilot = true
        AND b.status = 'active'
    LIMIT 1
$$;

-- Insert pilot banner
INSERT INTO public.banners (
    title,
    image_url,
    banner_type,
    status,
    is_pilot,
    sort_order
) VALUES (
    'Banner Piloto - Rádio Radar RRN News',
    '/lovable-uploads/ff5e1b42-0800-4f2f-af32-28657e649317.png',
    'pilot',
    'active',
    true,
    0
);