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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Authorization header não encontrado');
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token recebido:', token.substring(0, 20) + '...');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Usuário autenticado:', user.id, user.email);

    // Check if user is admin - usando RPC para garantir que funciona
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('❌ Erro ao buscar role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error checking user role', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎭 Role encontrada:', userRole);

    if (!userRole || userRole.role !== 'admin') {
      console.error('❌ Acesso negado - Role:', userRole?.role || 'nenhuma');
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - Admin access required',
          userRole: userRole?.role || 'none',
          userId: user.id
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Usuário é admin - prosseguindo...');
    console.log('🔍 Buscando profiles...');

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching profiles', details: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
    const { data: usersData, error: usersError } = await supabaseClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('⚠️ Erro ao buscar emails:', usersError);
    }

    console.log('📧 Emails encontrados:', usersData?.users?.length || 0);

    // Merge profile data with email information and roles
    const profilesWithData = (profiles || []).map(profile => {
      const authUser = usersData?.users?.find((u: any) => u.id === profile.id);
      const userRoleData = rolesData?.find(r => r.user_id === profile.id);
      return {
        ...profile,
        email: authUser?.email || '',
        role: userRoleData?.role || 'colunista'
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
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})