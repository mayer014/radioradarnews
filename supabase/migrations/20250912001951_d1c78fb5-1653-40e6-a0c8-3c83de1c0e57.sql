-- Create table for radio programs
CREATE TABLE public.radio_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  host TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('live', 'upcoming', 'ended')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_programs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins podem gerenciar programas de rádio" 
ON public.radio_programs 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Programas de rádio são visíveis por todos" 
ON public.radio_programs 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_radio_programs_updated_at
BEFORE UPDATE ON public.radio_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for favorite sites
CREATE TABLE public.favorite_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_sites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins podem gerenciar sites favoritos" 
ON public.favorite_sites 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Sites favoritos ativos são visíveis por todos" 
ON public.favorite_sites 
FOR SELECT 
USING (is_active = true);

-- Create trigger for timestamps
CREATE TRIGGER update_favorite_sites_updated_at
BEFORE UPDATE ON public.favorite_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default radio programs
INSERT INTO public.radio_programs (title, host, start_time, end_time, description, status, is_active) VALUES
('Portal News Manhã', 'Carlos Silva', '06:00', '09:00', 'Notícias, política e música regional para começar bem o dia', 'live', true),
('Jornal do Meio-Dia', 'Maria Santos', '12:00', '13:00', 'As principais notícias do dia em formato ágil', 'upcoming', true),
('Podcast Política Regional', 'Equipe Portal News', '14:00', '15:00', 'Análise semanal dos acontecimentos políticos locais', 'upcoming', true),
('Show Musical da Tarde', 'DJ Marco', '16:00', '18:00', 'O melhor da música regional e nacional', 'upcoming', true),
('Jornal da Noite', 'Roberto Lima', '19:00', '20:00', 'Retrospectiva completa dos acontecimentos do dia', 'upcoming', true);

-- Insert default favorite sites
INSERT INTO public.favorite_sites (name, url, description, sort_order) VALUES
('Google', 'https://google.com', 'Motor de busca', 1),
('Portal G1', 'https://g1.globo.com', 'Notícias nacionais', 2),
('UOL', 'https://uol.com.br', 'Portal de notícias', 3),
('YouTube', 'https://youtube.com', 'Vídeos e entretenimento', 4),
('Facebook', 'https://facebook.com', 'Rede social', 5);