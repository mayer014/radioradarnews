import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Try to read radio stream URL from settings table (publicly readable policy for radio/stream_url)
    let radioStreamUrl = '';
    const { data, error } = await supabase
      .from('settings')
      .select('value, updated_at')
      .eq('category', 'radio')
      .eq('key', 'stream_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.value && typeof data.value === 'object' && 'url' in (data.value as any)) {
      radioStreamUrl = (data.value as { url: string }).url || '';
    }

    // Fallback to function env (non-secret) if provided via Supabase secrets (optional)
    if (!radioStreamUrl) {
      radioStreamUrl = Deno.env.get('VITE_RADIO_STREAM_URL') || '';
    }

    // Whether GROQ secret is configured (without exposing it)
    const groqConfigured = Boolean(Deno.env.get('GROQ_API_KEY'));

    return new Response(
      JSON.stringify({ radioStreamUrl, groqConfigured }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('public-config error', e);
    return new Response(
      JSON.stringify({ radioStreamUrl: '', groqConfigured: false, error: 'config_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
