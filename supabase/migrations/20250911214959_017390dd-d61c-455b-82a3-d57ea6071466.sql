-- Create storage buckets for images, avatars and banners
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('article-images', 'article-images', true),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true);

-- Create RLS policies for article-images bucket
CREATE POLICY "Article images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update article images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'article-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete article images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'article-images' AND is_admin(auth.uid()));

-- Create RLS policies for avatars bucket
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for banners bucket
CREATE POLICY "Banners are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'banners' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update banners" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'banners' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete banners" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'banners' AND is_admin(auth.uid()));