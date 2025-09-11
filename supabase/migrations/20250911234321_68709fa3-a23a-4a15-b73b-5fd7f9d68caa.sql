-- Fix Storage RLS policies to allow uploads without authentication

-- Create public INSERT policy for article-images bucket
CREATE POLICY "Allow public uploads to article-images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-images');

-- Create public INSERT policy for avatars bucket  
CREATE POLICY "Allow public uploads to avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- Create public INSERT policy for banners bucket
CREATE POLICY "Allow public uploads to banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'banners');