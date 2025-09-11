-- Fix RLS policies for storage uploads
-- Drop existing storage policies if they exist and recreate them properly

-- First, remove any existing storage policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Article images are publicly accessible" ON storage.objects;

-- Create comprehensive storage policies for article-images bucket
CREATE POLICY "Anyone can view article images" 
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

CREATE POLICY "Users can update their own article images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'article-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own article images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'article-images' 
  AND auth.uid() IS NOT NULL
);

-- Create policies for avatars bucket
CREATE POLICY "Anyone can view avatars" 
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

-- Create policies for banners bucket  
CREATE POLICY "Anyone can view banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'banners' 
  AND is_admin_user(auth.uid())
);

CREATE POLICY "Admins can update banners" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'banners' 
  AND is_admin_user(auth.uid())
);

CREATE POLICY "Admins can delete banners" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'banners' 
  AND is_admin_user(auth.uid())
);