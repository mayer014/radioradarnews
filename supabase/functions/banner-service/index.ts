import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BannerRequest {
  action: 'get_current_banner' | 'schedule_banner' | 'update_schedule' | 'get_schedule';
  slot_key?: string;
  banner_id?: string;
  starts_at?: string;
  ends_at?: string;
  priority?: number;
  schedule_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    const jwt = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const requestData: BannerRequest = await req.json();
    const { action, slot_key, banner_id, starts_at, ends_at, priority, schedule_id } = requestData;

    console.log(`Banner Service: ${action} by user ${user.id}`, { slot_key, banner_id });

    // Audit function
    const auditLog = async (event: string, entity_id: string, payload: any, level: 'info' | 'warn' | 'error' = 'info') => {
      await supabase.from('audit_log').insert({
        event,
        entity: 'banner',
        entity_id,
        payload_jsonb: payload,
        level,
        context: { user_id: user.id, action },
        user_id: user.id
      });
    };

    let result;

    switch (action) {
      case 'get_current_banner': {
        if (!slot_key) throw new Error('Slot key required');

        const now = new Date().toISOString();

        // Try to find active scheduled banner first
        const { data: scheduledBanners, error: scheduleError } = await supabase
          .from('banner_schedule')
          .select(`
            *,
            banner:banners_normalized(*),
            slot:banner_slots(*)
          `)
          .eq('slot_id', slot_key)
          .eq('is_active', true)
          .lte('starts_at', now)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('priority', { ascending: false })
          .order('starts_at', { ascending: false })
          .limit(1);

        if (scheduleError) throw scheduleError;

        let currentBanner = null;

        if (scheduledBanners && scheduledBanners.length > 0) {
          currentBanner = scheduledBanners[0];
        } else {
          // Fallback to default banner for slot
          const { data: slotData, error: slotError } = await supabase
            .from('banner_slots')
            .select(`
              *,
              default_banner:banners_normalized(*)
            `)
            .eq('slot_key', slot_key)
            .eq('is_active', true)
            .single();

          if (slotError) throw slotError;

          if (slotData && slotData.default_banner) {
            currentBanner = {
              ...slotData,
              banner: slotData.default_banner,
              is_default: true
            };
          }
        }

        result = { success: true, data: currentBanner };
        break;
      }

      case 'schedule_banner': {
        if (!slot_key || !banner_id || !starts_at) {
          throw new Error('Slot key, banner ID and start time required');
        }

        // Get slot ID from slot_key
        const { data: slotData, error: slotError } = await supabase
          .from('banner_slots')
          .select('id')
          .eq('slot_key', slot_key)
          .single();

        if (slotError) throw slotError;

        const { data: schedule, error: scheduleError } = await supabase
          .from('banner_schedule')
          .insert({
            slot_id: slotData.id,
            banner_id,
            starts_at,
            ends_at,
            priority: priority || 0,
            is_active: true
          })
          .select(`
            *,
            banner:banners_normalized(*),
            slot:banner_slots(*)
          `)
          .single();

        if (scheduleError) throw scheduleError;

        await auditLog('banner_scheduled', schedule.id, {
          slot_key,
          banner_id,
          starts_at,
          ends_at,
          priority
        });

        result = { success: true, data: schedule };
        break;
      }

      case 'update_schedule': {
        if (!schedule_id) throw new Error('Schedule ID required');

        const updateData: any = {};
        if (starts_at) updateData.starts_at = starts_at;
        if (ends_at) updateData.ends_at = ends_at;
        if (priority !== undefined) updateData.priority = priority;

        const { data: updatedSchedule, error: updateError } = await supabase
          .from('banner_schedule')
          .update(updateData)
          .eq('id', schedule_id)
          .select(`
            *,
            banner:banners_normalized(*),
            slot:banner_slots(*)
          `)
          .single();

        if (updateError) throw updateError;

        await auditLog('banner_schedule_updated', schedule_id, updateData);

        result = { success: true, data: updatedSchedule };
        break;
      }

      case 'get_schedule': {
        let query = supabase
          .from('banner_schedule')
          .select(`
            *,
            banner:banners_normalized(*),
            slot:banner_slots(*)
          `)
          .order('starts_at', { ascending: false });

        if (slot_key) {
          // Get slot ID first
          const { data: slotData } = await supabase
            .from('banner_slots')
            .select('id')
            .eq('slot_key', slot_key)
            .single();

          if (slotData) {
            query = query.eq('slot_id', slotData.id);
          }
        }

        const { data: schedules, error: scheduleError } = await query;

        if (scheduleError) throw scheduleError;

        result = { success: true, data: schedules };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Banner Service Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});