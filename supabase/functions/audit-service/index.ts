import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  action: 'get_logs' | 'get_dashboard';
  filters?: {
    entity?: string;
    level?: 'info' | 'warn' | 'error';
    start_date?: string;
    end_date?: string;
    limit?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: AuditRequest = await req.json();
    const { action, filters = {} } = requestData;

    console.log(`Audit Service: ${action}`, filters);

    let result;

    switch (action) {
      case 'get_logs': {
        let query = supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.entity) {
          query = query.eq('entity', filters.entity);
        }

        if (filters.level) {
          query = query.eq('level', filters.level);
        }

        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }

        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }

        const limit = filters.limit || 100;
        query = query.limit(limit);

        const { data: logs, error: logsError } = await query;

        if (logsError) throw logsError;

        result = { success: true, data: logs };
        break;
      }

      case 'get_dashboard': {
        // Get error counts by entity (last 24h)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: errorCounts, error: errorCountsError } = await supabase
          .from('audit_log')
          .select('entity, level')
          .gte('created_at', last24h)
          .eq('level', 'error');

        if (errorCountsError) throw errorCountsError;

        // Group by entity
        const errorsByEntity = errorCounts.reduce((acc: any, log: any) => {
          acc[log.entity] = (acc[log.entity] || 0) + 1;
          return acc;
        }, {});

        // Get recent critical events (last 100)
        const { data: recentEvents, error: recentEventsError } = await supabase
          .from('audit_log')
          .select('*')
          .in('level', ['warn', 'error'])
          .order('created_at', { ascending: false })
          .limit(100);

        if (recentEventsError) throw recentEventsError;

        // Get activity summary
        const { data: activitySummary, error: activityError } = await supabase
          .from('audit_log')
          .select('entity, level')
          .gte('created_at', last24h);

        if (activityError) throw activityError;

        const summary = activitySummary.reduce((acc: any, log: any) => {
          const key = `${log.entity}_${log.level}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        // Database health check
        const { data: tableStats, error: statsError } = await supabase
          .rpc('get_table_stats') // Custom function needed
          .then(() => null) // Fallback if function doesn't exist
          .catch(() => null);

        result = {
          success: true,
          data: {
            error_counts: errorsByEntity,
            recent_events: recentEvents,
            activity_summary: summary,
            last_updated: new Date().toISOString(),
            total_errors_24h: errorCounts.length,
            system_status: errorCounts.length === 0 ? 'healthy' : 'needs_attention'
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audit Service Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});