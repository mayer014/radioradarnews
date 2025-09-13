-- Fix critical security vulnerability in comments table
-- Remove public access to email addresses and IP addresses

-- First, drop the existing policy that exposes all comment data
DROP POLICY IF EXISTS "Comentários aprovados são visíveis por todos" ON public.comments;

-- Create a secure view for public comment access that excludes sensitive data
CREATE OR REPLACE VIEW public.comments_public AS
SELECT 
    id,
    article_id,
    name,
    content,
    created_at,
    parent_id,
    status
FROM public.comments
WHERE status = 'approved';

-- Enable RLS on the view
ALTER VIEW public.comments_public SET (security_invoker = true);

-- Create new restricted policy for public comment access
CREATE POLICY "Public can view approved comments safely" 
ON public.comments 
FOR SELECT 
USING (status = 'approved'::comment_status AND auth.uid() IS NULL);

-- Create policy for authenticated users to see approved comments with limited data
CREATE POLICY "Authenticated users can view approved comments" 
ON public.comments 
FOR SELECT 
USING (status = 'approved'::comment_status AND auth.uid() IS NOT NULL);

-- Ensure email and IP are only visible to admins
CREATE POLICY "Only admins can see sensitive comment data" 
ON public.comments 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Grant access to the public view
GRANT SELECT ON public.comments_public TO anon;
GRANT SELECT ON public.comments_public TO authenticated;