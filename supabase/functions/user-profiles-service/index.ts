import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔵 user-profiles-service: Iniciando...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Usuário não autenticado:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Usuário autenticado:', user.id);

    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('🎭 Role do usuário:', userRole?.role);

    if (!userRole || userRole.role !== 'admin') {
      console.error('❌ Acesso negado - não é admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Buscando profiles...');

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    console.log('📋 Profiles encontrados:', profiles?.length || 0);

    // Get user roles
    const profileIds = (profiles || []).map(p => p.id);
    const { data: rolesData, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profileIds);

    if (rolesError) {
      console.error('⚠️ Erro ao buscar roles:', rolesError);
    }

    console.log('🎭 Roles encontradas:', rolesData?.length || 0);

    // Get user emails from auth.users using admin privileges
    const { data: users, error: usersError } = await supabaseClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('⚠️ Erro ao buscar emails:', usersError);
    }

    console.log('📧 Emails encontrados:', users?.users?.length || 0);

    // Merge profile data with email information and roles
    const profilesWithData = (profiles || []).map(profile => {
      const authUser = users?.users?.find((u: any) => u.id === profile.id);
      const userRole = rolesData?.find(r => r.user_id === profile.id);
      return {
        ...profile,
        email: authUser?.email || '',
        role: userRole?.role || 'colunista'
      }
    });

    console.log('✅ Profiles enriquecidos:', profilesWithData.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profiles: profilesWithData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Erro fatal em user-profiles-service:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})