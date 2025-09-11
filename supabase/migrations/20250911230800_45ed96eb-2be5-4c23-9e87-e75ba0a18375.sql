-- Remove ALL existing storage policies to start fresh
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Remove all policies on storage.objects
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Create simple and effective storage policies
CREATE POLICY "Public access to article images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'article-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Public access to avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Public access to banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Admins can manage banners" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'banners' 
  AND is_admin_user(auth.uid())
);