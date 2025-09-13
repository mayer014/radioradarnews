-- RLS policy to allow the radio stream URL to be read publicly
-- Ensures the site can load the stream URL even for non-authenticated users
CREATE POLICY IF NOT EXISTS "Public can read radio stream URL"
ON public.settings
FOR SELECT
USING (category = 'radio' AND key = 'stream_url');