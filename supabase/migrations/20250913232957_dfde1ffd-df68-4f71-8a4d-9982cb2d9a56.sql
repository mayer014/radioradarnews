-- Enhanced security for contact_messages: Step 1 - Drop existing function and create secure one

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, INET);

-- 2. Create the secure contact message submission function
CREATE OR REPLACE FUNCTION public.submit_contact_message(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_subject TEXT,
    p_message TEXT,
    p_ip_address INET
) RETURNS JSONB AS $$
DECLARE
    message_id UUID;
    rate_limit_check BOOLEAN;
BEGIN
    -- Input validation
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Name is required');
    END IF;
    
    IF p_email IS NULL OR trim(p_email) = '' OR p_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Valid email is required');
    END IF;
    
    IF p_subject IS NULL OR trim(p_subject) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Subject is required');
    END IF;
    
    IF p_message IS NULL OR trim(p_message) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message is required');
    END IF;
    
    -- Check rate limit if IP provided
    IF p_ip_address IS NOT NULL THEN
        SELECT public.check_contact_rate_limit(p_ip_address) INTO rate_limit_check;
        IF NOT rate_limit_check THEN
            RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded. Please wait before submitting another message.');
        END IF;
    END IF;
    
    -- Insert the message securely
    INSERT INTO public.contact_messages (
        name, 
        email, 
        phone, 
        subject, 
        message, 
        read, 
        created_at
    ) VALUES (
        trim(p_name),
        lower(trim(p_email)),
        CASE WHEN p_phone IS NULL OR trim(p_phone) = '' THEN NULL ELSE trim(p_phone) END,
        trim(p_subject),
        trim(p_message),
        false,
        NOW()
    ) RETURNING id INTO message_id;
    
    -- Return success without exposing sensitive data
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Your message has been received successfully. We will contact you soon.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error internally but don't expose details to client
        RETURN jsonb_build_object('success', false, 'error', 'Unable to submit message. Please try again later.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant execute permission on the secure function
GRANT EXECUTE ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, INET) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, INET) TO authenticated;