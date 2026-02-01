
-- 1. Agregar todos os dados faltantes de janeiro (11-31 janeiro 2026)
DO $$
DECLARE
    target_date DATE;
BEGIN
    FOR target_date IN 
        SELECT generate_series('2026-01-11'::date, '2026-01-31'::date, '1 day'::interval)::date
    LOOP
        PERFORM public.aggregate_daily_analytics(target_date);
    END LOOP;
END $$;

-- 2. Criar o cron job para agregação automática diária
SELECT cron.schedule(
    'aggregate-daily-analytics',
    '5 0 * * *',  -- Executar às 00:05 todos os dias
    $$SELECT public.aggregate_daily_analytics()$$
);

-- 3. Verificar resultado
SELECT 
  date_trunc('month', date) as month,
  SUM(total_visits) as total_visits,
  COUNT(*) as days_recorded
FROM site_analytics_summary
GROUP BY date_trunc('month', date)
ORDER BY month DESC;
