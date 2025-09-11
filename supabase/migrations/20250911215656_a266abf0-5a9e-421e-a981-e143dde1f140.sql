-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gif_url TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('hero', 'category', 'columnist')),
  category TEXT,
  columnist_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  click_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- duration in seconds
  sequence INTEGER DEFAULT 0, -- order in sequence
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies for banners
CREATE POLICY "Banners são visíveis por todos" 
ON public.banners 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem inserir banners" 
ON public.banners 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar banners" 
ON public.banners 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar banners" 
ON public.banners 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create contact_info table
CREATE TABLE public.contact_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone1 TEXT NOT NULL,
  phone2 TEXT,
  email1 TEXT NOT NULL,
  email2 TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  weekdays_hours TEXT NOT NULL,
  saturday_hours TEXT NOT NULL,
  sunday_hours TEXT NOT NULL,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_info
CREATE POLICY "Informações de contato são visíveis por todos" 
ON public.contact_info 
FOR SELECT 
USING (true);

CREATE POLICY "Admins podem inserir informações de contato" 
ON public.contact_info 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar informações de contato" 
ON public.contact_info 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar informações de contato" 
ON public.contact_info 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_contact_info_updated_at
BEFORE UPDATE ON public.contact_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact info
INSERT INTO public.contact_info (
  phone1, phone2, email1, email2, address, city, state, zip_code,
  weekdays_hours, saturday_hours, sunday_hours,
  facebook_url, instagram_url, twitter_url, youtube_url
) VALUES (
  '(11) 3456-7890', '(11) 99999-8888', 'contato@radioradar.news', 'redacao@radioradar.news',
  'Rua das Comunicações, 123', 'São Paulo', 'SP', '01234-567',
  'Segunda a Sexta: 6h às 22h', 'Sábados: 8h às 18h', 'Domingos: 10h às 16h',
  'https://facebook.com/radioradar', 'https://instagram.com/radioradar', 
  'https://twitter.com/radioradar', 'https://youtube.com/@radioradar'
);

-- Insert default banners
INSERT INTO public.banners (id, name, gif_url, position, category, is_active, is_default) VALUES
('hero-banner', 'Banner Principal', '/src/assets/banner-principal.jpg', 'hero', NULL, true, true),
('politica-banner', 'Banner Política', '/src/assets/banner-politica.jpg', 'category', 'Política', true, true),
('policial-banner', 'Banner Policial', '/src/assets/banner-policial.jpg', 'category', 'Policial', true, true),
('entretenimento-banner', 'Banner Entretenimento', '/src/assets/banner-entretenimento.jpg', 'category', 'Entretenimento', true, true),
('internacional-banner', 'Banner Internacional', '/src/assets/banner-internacional.jpg', 'category', 'Internacional', true, true),
('esportes-banner', 'Banner Esportes', '/src/assets/banner-esportes.jpg', 'category', 'Esportes', true, true),
('tecnologia-banner', 'Banner Tecnologia', '/src/assets/banner-tecnologia.jpg', 'category', 'Tecnologia', true, true),
('ciencia-saude-banner', 'Banner Ciência / Saúde', '/src/assets/banner-ciencia-saude.jpg', 'category', 'Ciência / Saúde', true, true);