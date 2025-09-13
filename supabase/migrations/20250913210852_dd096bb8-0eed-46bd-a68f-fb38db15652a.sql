-- RLS policy to allow the radio stream URL to be read publicly  
-- Ensures the site can load the stream URL even for non-authenticated users
DROP POLICY IF EXISTS "Public can read radio stream URL" ON public.settings;
CREATE POLICY "Public can read radio stream URL"
ON public.settings
FOR SELECT
USING (category = 'radio' AND key = 'stream_url');