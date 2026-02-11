-- Allow anyone (including columnists and anonymous) to read art_templates settings
CREATE POLICY "Public can read art templates" 
ON public.settings 
FOR SELECT 
USING (category = 'art_templates');