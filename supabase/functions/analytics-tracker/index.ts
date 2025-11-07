import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingPayload {
  page_path: string;
  page_title?: string;
  article_id?: string;
  referrer?: string;
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function createVisitorHash(ip: string, userAgent: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}-${userAgent}`);
  return crypto.subtle.digest('SHA-256', data)
    .then(hash => {
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TrackingPayload = await req.json();
    
    // Extrair informações do request
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Criar hash único do visitante (privacidade)
    const visitorHash = await createVisitorHash(ipAddress, userAgent);
    
    // Detectar tipo de dispositivo
    const deviceType = detectDeviceType(userAgent);
    
    // Gerar session_id
    const sessionId = crypto.randomUUID();
    
    // Verificar se é visita única do dia
    const today = new Date().toISOString().split('T')[0];
    const { data: existingVisit } = await supabase
      .from('site_analytics')
      .select('id')
      .eq('visitor_hash', visitorHash)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1)
      .maybeSingle();
    
    const isUniqueVisit = !existingVisit;
    
    // Inserir analytics
    const { error } = await supabase
      .from('site_analytics')
      .insert({
        page_path: payload.page_path,
        page_title: payload.page_title,
        article_id: payload.article_id || null,
        visitor_hash: visitorHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        is_unique_visit: isUniqueVisit,
        referrer: payload.referrer || null,
        device_type: deviceType,
      });

    if (error) {
      console.error('Error inserting analytics:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
