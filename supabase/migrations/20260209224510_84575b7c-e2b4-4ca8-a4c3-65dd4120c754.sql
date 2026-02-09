-- Allow public read access to user_roles so visitors can distinguish admins from columnists
CREATE POLICY "Anyone can read user roles"
ON public.user_roles
FOR SELECT
TO anon, authenticated
USING (true);
