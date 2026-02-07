-- Allow users to see their own providers (including inactive ones)
CREATE POLICY "Users can view own providers"
ON public.service_providers
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to see their own job listings (including inactive ones)
CREATE POLICY "Users can view own jobs"
ON public.job_listings
FOR SELECT
USING (auth.uid() = user_id);