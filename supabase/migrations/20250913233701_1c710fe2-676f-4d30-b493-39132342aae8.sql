-- Adicionar coluna para preferência de tema dos usuários
ALTER TABLE public.profiles 
ADD COLUMN theme_preference text DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark'));

-- Atualizar todos os usuários existentes para ter tema dark como padrão
UPDATE public.profiles 
SET theme_preference = 'dark' 
WHERE theme_preference IS NULL;