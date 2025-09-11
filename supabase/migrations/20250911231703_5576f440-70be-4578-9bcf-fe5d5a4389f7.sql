-- Allow anonymous uploads to article-images to restore functionality quickly
CREATE POLICY "Anyone can upload article images (public)" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-images');