-- Remove all existing storage policies and recreate them properly
DROP POLICY IF EXISTS "Anyone can view article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own article images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own article images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;

-- Create simple and permissive storage policies
CREATE POLICY "Public can view all files" 
ON storage.objects 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update files" 
ON storage.objects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete files" 
ON storage.objects 
FOR DELETE 
USING (auth.uid() IS NOT NULL);