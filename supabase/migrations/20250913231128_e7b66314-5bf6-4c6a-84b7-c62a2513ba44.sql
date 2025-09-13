-- Harden profiles table: remove any public SELECT policy
DROP POLICY IF EXISTS "Public columnist basic info only" ON public.profiles;