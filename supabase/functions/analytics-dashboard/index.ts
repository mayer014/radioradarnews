import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se usuário é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === CONSULTAS DE ANALYTICS ===

    // 1. Total de acessos de todos os tempos
    const { count: totalAllTime } = await supabase
      .from('site_analytics')
      .select('*', { count: 'exact', head: true });

    // 2. Acessos no mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: totalThisMonth } = await supabase
      .from('site_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    // 3. Visitantes únicos do mês
    const { data: uniqueVisitors } = await supabase
      .from('site_analytics')
      .select('visitor_hash')
      .gte('created_at', firstDayOfMonth.toISOString());
    
    const uniqueCount = new Set(uniqueVisitors?.map((v: any) => v.visitor_hash)).size;

    // 4. Acessos por mês (últimos 12 meses)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const { data: monthlyData } = await supabase
      .from('site_analytics_summary')
      .select('date, total_visits, unique_visitors')
      .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // 5. Páginas mais visitadas
    const { data: topPages } = await supabase
      .from('site_analytics')
      .select('page_path, page_title')
      .gte('created_at', firstDayOfMonth.toISOString())
      .limit(1000);

    const pageStats: Record<string, number> = {};
    topPages?.forEach((page: any) => {
      const path = page.page_path;
      pageStats[path] = (pageStats[path] || 0) + 1;
    });

    const topPagesList = Object.entries(pageStats)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 6. Dispositivos mais usados (mês atual)
    const { data: deviceData } = await supabase
      .from('site_analytics')
      .select('device_type')
      .gte('created_at', firstDayOfMonth.toISOString());

    const deviceStats: Record<string, number> = {};
    deviceData?.forEach((d: any) => {
      deviceStats[d.device_type] = (deviceStats[d.device_type] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total_all_time: totalAllTime || 0,
          total_this_month: totalThisMonth || 0,
          unique_visitors_this_month: uniqueCount,
          monthly_stats: monthlyData || [],
          top_pages: topPagesList,
          device_stats: deviceStats || {},
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
