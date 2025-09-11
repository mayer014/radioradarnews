-- Allow anonymous uploads to article-images to restore functionality quickly
-- Note: Bucket is public; we allow INSERT for anyone for this specific bucket
CREATE POLICY IF NOT EXISTS "Anyone can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-images');