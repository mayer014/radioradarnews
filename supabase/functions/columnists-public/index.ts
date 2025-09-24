import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      // Service role to bypass RLS inside Edge Functions (do NOT expose in client)
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch only safe, public fields for ACTIVE columnists
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar, bio, specialty, allowed_categories, is_active, role")
      .eq("role", "colunista")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    // Sanitize payload (avoid leaking unexpected fields)
    const columnists = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar ?? null,
      bio: p.bio ?? "Colunista do Portal RRN",
      specialty: p.specialty ?? "Jornalismo",
      allowed_categories: p.allowed_categories ?? [],
      is_active: Boolean(p.is_active),
      role: "colunista",
    }));

    return new Response(
      JSON.stringify({ success: true, columnists }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("columnists-public error", e);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});