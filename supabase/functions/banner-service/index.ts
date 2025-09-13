import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BannerRequest {
  action: 'get_current_banner' | 'add_to_queue' | 'update_queue' | 'remove_from_queue' | 'get_queue' | 'set_pilot' | 'cleanup_expired';
  slot_key?: string;
  banner_id?: string;
  starts_at?: string;
  ends_at?: string;
  priority?: number;
  queue_id?: string;
  is_pilot?: boolean;
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
    
    // Para chamadas do frontend, não requer autenticação
    const isPublicCall = !authorization || authorization.includes('anon');
    
    let user = null;
    if (!isPublicCall) {
      const jwt = authorization.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(jwt);
      
      if (authError || !authUser) {
        throw new Error('Invalid authentication');
      }
      user = authUser;
    }

    const requestData: BannerRequest = await req.json();
    const { action, slot_key, banner_id, starts_at, ends_at, priority, queue_id, is_pilot } = requestData;

    console.log(`Banner Service: ${action}`, { slot_key, banner_id, user_id: user?.id || 'anonymous' });

    // Audit function
    const auditLog = async (event: string, entity_id: string, payload: any, level: 'info' | 'warn' | 'error' = 'info') => {
      await supabase.from('audit_log').insert({
        event,
        entity: 'banner',
        entity_id,
        payload_jsonb: payload,
        level,
        context: { user_id: user?.id || 'anonymous', action },
        user_id: user?.id
      });
    };

    let result;

    switch (action) {
      case 'get_current_banner': {
        if (!slot_key) throw new Error('Slot key required');

        // Primeiro, limpa banners expirados
        await supabase.rpc('cleanup_expired_banners');

        // Usa a função do banco para obter o banner atual
        const { data: currentBannerData, error: bannerError } = await supabase
          .rpc('get_current_banner', { slot_key_param: slot_key });

        if (bannerError) throw bannerError;

        let currentBanner = null;
        if (currentBannerData && currentBannerData.length > 0) {
          const bannerInfo = currentBannerData[0];
          
          // Buscar dados completos do banner
          const { data: fullBanner, error: fullBannerError } = await supabase
            .from('banners_normalized')
            .select('*')
            .eq('id', bannerInfo.banner_id)
            .single();

          if (fullBannerError) throw fullBannerError;

          currentBanner = {
            ...fullBanner,
            is_pilot: bannerInfo.is_pilot,
            queue_priority: bannerInfo.queue_priority,
            queue_ends_at: bannerInfo.queue_ends_at
          };
        }

        result = { success: true, data: currentBanner };
        break;
      }

      case 'add_to_queue': {
        if (!slot_key || !banner_id) {
          throw new Error('Slot key and banner ID required');
        }

        const { data: queueEntry, error: queueError } = await supabase
          .from('banner_queue')
          .insert({
            slot_key,
            banner_id,
            starts_at,
            ends_at,
            priority: priority || 0,
            is_active: true
          })
          .select(`
            *,
            banner:banners_normalized(*)
          `)
          .single();

        if (queueError) throw queueError;

        await auditLog('banner_added_to_queue', queueEntry.id, {
          slot_key,
          banner_id,
          starts_at,
          ends_at,
          priority
        });

        result = { success: true, data: queueEntry };
        break;
      }

      case 'update_queue': {
        if (!queue_id) throw new Error('Queue ID required');

        const updateData: any = {};
        if (starts_at) updateData.starts_at = starts_at;
        if (ends_at) updateData.ends_at = ends_at;
        if (priority !== undefined) updateData.priority = priority;

        const { data: updatedQueue, error: updateError } = await supabase
          .from('banner_queue')
          .update(updateData)
          .eq('id', queue_id)
          .select(`
            *,
            banner:banners_normalized(*)
          `)
          .single();

        if (updateError) throw updateError;

        await auditLog('banner_queue_updated', queue_id, updateData);

        result = { success: true, data: updatedQueue };
        break;
      }

      case 'remove_from_queue': {
        if (!queue_id) throw new Error('Queue ID required');

        const { data: removedEntry, error: removeError } = await supabase
          .from('banner_queue')
          .update({ is_active: false })
          .eq('id', queue_id)
          .select()
          .single();

        if (removeError) throw removeError;

        await auditLog('banner_removed_from_queue', queue_id, { queue_id });

        result = { success: true, data: removedEntry };
        break;
      }

      case 'get_queue': {
        let query = supabase
          .from('banner_queue')
          .select(`
            *,
            banner:banners_normalized(*)
          `)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (slot_key) {
          query = query.eq('slot_key', slot_key);
        }

        const { data: queue, error: queueError } = await query;

        if (queueError) throw queueError;

        result = { success: true, data: queue };
        break;
      }

      case 'set_pilot': {
        if (!banner_id || is_pilot === undefined) {
          throw new Error('Banner ID and pilot status required');
        }

        // Primeiro, remove piloto de outros banners
        if (is_pilot) {
          await supabase
            .from('banners_normalized')
            .update({ is_pilot: false })
            .eq('is_pilot', true);
        }

        // Atualiza o banner atual
        const { data: updatedBanner, error: updateError } = await supabase
          .from('banners_normalized')
          .update({ is_pilot })
          .eq('id', banner_id)
          .select()
          .single();

        if (updateError) throw updateError;

        await auditLog('banner_pilot_updated', banner_id, { is_pilot });

        result = { success: true, data: updatedBanner };
        break;
      }

      case 'cleanup_expired': {
        await supabase.rpc('cleanup_expired_banners');

        await auditLog('banner_cleanup', 'system', { action: 'cleanup_expired' });

        result = { success: true, message: 'Expired banners cleaned up' };
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