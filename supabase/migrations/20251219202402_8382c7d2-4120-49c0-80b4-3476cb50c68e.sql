
-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Aggregate existing data that hasn't been processed yet
-- First, manually insert the existing data summaries
INSERT INTO public.site_analytics_summary (date, total_visits, unique_visitors, home_visits, article_visits, other_visits, mobile_visits, desktop_visits)
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT visitor_hash) as unique_visitors,
    COUNT(*) FILTER (WHERE page_path = '/') as home_visits,
    COUNT(*) FILTER (WHERE article_id IS NOT NULL) as article_visits,
    COUNT(*) FILTER (WHERE page_path != '/' AND article_id IS NULL) as other_visits,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_visits,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_visits
FROM public.site_analytics
GROUP BY DATE(created_at)
ON CONFLICT (date) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    unique_visitors = EXCLUDED.unique_visitors,
    home_visits = EXCLUDED.home_visits,
    article_visits = EXCLUDED.article_visits,
    other_visits = EXCLUDED.other_visits,
    mobile_visits = EXCLUDED.mobile_visits,
    desktop_visits = EXCLUDED.desktop_visits,
    updated_at = NOW();

-- Schedule the daily aggregation to run at midnight (00:05) every day
SELECT cron.schedule(
    'aggregate-daily-analytics',
    '5 0 * * *',
    $$SELECT public.aggregate_daily_analytics(CURRENT_DATE - INTERVAL '1 day')$$
);
