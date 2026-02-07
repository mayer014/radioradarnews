import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useClickTracking() {
  const trackClick = useCallback(async (entityType: 'service_provider' | 'job_listing', entityId: string, action = 'whatsapp_click') => {
    try {
      await supabase.from('utility_click_tracking').insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (e) {
      console.error('Click tracking error:', e);
    }
  }, []);

  const getStats = useCallback(async (daysBack = 30) => {
    const { data, error } = await supabase.rpc('get_utility_click_stats', { days_back: daysBack });
    return { data: data || [], error };
  }, []);

  return { trackClick, getStats };
}
