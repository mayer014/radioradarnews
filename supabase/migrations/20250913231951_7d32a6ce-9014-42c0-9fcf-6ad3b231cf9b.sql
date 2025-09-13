-- Fix security warning: add search_path to existing functions
ALTER FUNCTION public.check_contact_rate_limit(inet) SET search_path = public;