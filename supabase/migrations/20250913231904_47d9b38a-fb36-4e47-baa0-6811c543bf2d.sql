-- Add rate limiting table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate limits table
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "Admins can view rate limits" ON public.contact_rate_limits
FOR SELECT USING (is_admin_user(auth.uid()));

-- System can manage rate limits
CREATE POLICY "System can manage rate limits" ON public.contact_rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- Add index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_ip_window 
ON public.contact_rate_limits (ip_address, window_start);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(request_ip INET)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_submissions INTEGER := 5; -- Max 5 submissions per hour
    window_minutes INTEGER := 60; -- 1 hour window
BEGIN
    -- Clean up old entries
    DELETE FROM public.contact_rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    -- Get current count for this IP in the window
    SELECT COALESCE(SUM(submission_count), 0) INTO current_count
    FROM public.contact_rate_limits 
    WHERE ip_address = request_ip 
    AND window_start > NOW() - INTERVAL '1 hour';
    
    -- Check if limit exceeded
    IF current_count >= max_submissions THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert rate limit record
    INSERT INTO public.contact_rate_limits (ip_address, submission_count, window_start)
    VALUES (request_ip, 1, NOW())
    ON CONFLICT (ip_address) 
    DO UPDATE SET 
        submission_count = contact_rate_limits.submission_count + 1,
        window_start = CASE 
            WHEN contact_rate_limits.window_start < NOW() - INTERVAL '1 hour' 
            THEN NOW() 
            ELSE contact_rate_limits.window_start 
        END;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;