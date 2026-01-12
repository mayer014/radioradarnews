-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_public_contact_info();

-- Drop and recreate the public contact info view to include social media URLs
DROP VIEW IF EXISTS contact_info_public;

CREATE VIEW contact_info_public AS
SELECT 
  phone1,
  email1,
  city,
  state,
  weekdays_hours,
  saturday_hours,
  sunday_hours,
  facebook_url,
  instagram_url,
  twitter_url,
  youtube_url
FROM contact_info;

-- Grant select permission to public
GRANT SELECT ON contact_info_public TO anon, authenticated;

-- Recreate the function with social media URLs included
CREATE OR REPLACE FUNCTION public.get_public_contact_info()
RETURNS TABLE (
  phone1 text,
  email1 text,
  city text,
  state text,
  weekdays_hours text,
  saturday_hours text,
  sunday_hours text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  youtube_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    phone1,
    email1,
    city,
    state,
    weekdays_hours,
    saturday_hours,
    sunday_hours,
    facebook_url,
    instagram_url,
    twitter_url,
    youtube_url
  FROM contact_info
  LIMIT 1;
$$;