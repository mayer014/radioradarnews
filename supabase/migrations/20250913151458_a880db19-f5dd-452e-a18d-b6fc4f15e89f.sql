-- Create missing tables for complete Supabase migration

-- AI configurations table
CREATE TABLE public.ai_configurations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  api_key_encrypted text,
  config_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notification rules table
CREATE TABLE public.notification_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Comment settings table
CREATE TABLE public.comment_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_approve boolean DEFAULT false,
  require_email boolean DEFAULT true,
  moderation_enabled boolean DEFAULT true,
  blocked_emails text[] DEFAULT '{}',
  auto_approve_keywords text[] DEFAULT '{}',
  auto_reject_keywords text[] DEFAULT '{}',
  max_content_length integer DEFAULT 1000,
  allow_replies boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Local storage backup table for migration
CREATE TABLE public.local_storage_backup (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  storage_value jsonb NOT NULL,
  migrated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_storage_backup ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_configurations
CREATE POLICY "Users can manage their own AI configs"
ON public.ai_configurations FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_rules
CREATE POLICY "Users can manage their own notification rules"
ON public.notification_rules FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own notifications"
ON public.notifications FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for comment_settings
CREATE POLICY "Users can manage their own comment settings"
ON public.comment_settings FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for local_storage_backup
CREATE POLICY "Users can manage their own backup data"
ON public.local_storage_backup FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all AI configs"
ON public.ai_configurations FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can view all notification rules"
ON public.notification_rules FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can view all comment settings"
ON public.comment_settings FOR SELECT 
TO authenticated
USING (is_admin_user(auth.uid()));

-- Update triggers for timestamps
CREATE TRIGGER update_ai_configurations_updated_at
BEFORE UPDATE ON public.ai_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at
BEFORE UPDATE ON public.notification_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comment_settings_updated_at
BEFORE UPDATE ON public.comment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();