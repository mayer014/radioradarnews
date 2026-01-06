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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id, user.email)

    // Check if user is admin using user_roles table (not profiles.role)
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('User role check:', userRole, roleError)

    if (roleError || !userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()
    console.log('Action:', action, 'Params:', params)

    switch (action) {
      case 'create_user':
        return await createUser(supabaseClient, params)
      case 'update_password':
        return await updatePassword(supabaseClient, params)
      case 'delete_user':
        return await deleteUser(supabaseClient, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in enhanced-user-service:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createUser(supabaseClient: any, params: any) {
  const { email, password, username, name, role } = params
  
  console.log('Creating user:', { email, username, name, role })

  if (!email || !password || !username || !name || !role) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: email, password, username, name, role' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // 1. Create user in auth with email confirmed
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, name, role },
      email_confirm: true
    })

    if (authError) {
      console.error('Auth create error:', authError)
      throw authError
    }

    console.log('Auth user created:', authData.user.id)

    // 2. Create/update profile (profiles table doesn't have role column)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username,
        name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      throw profileError
    }

    console.log('Profile created/updated')

    // 3. Create user role in user_roles table
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (roleError) {
      console.error('Role insert error:', roleError)
      throw roleError
    }

    console.log('Role assigned:', role)

    // 4. If role is columnist, ensure authors record exists
    if (role === 'colunista') {
      const { error: authorError } = await supabaseClient
        .from('authors')
        .upsert({
          id: authData.user.id,
          name,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (authorError) {
        console.error('Author upsert error:', authorError)
        throw authorError
      }

      console.log('Author record created')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username,
          name,
          role
        },
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error creating user' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updatePassword(supabaseClient: any, params: any) {
  const { user_id, new_password } = params

  if (!user_id || !new_password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: user_id, new_password' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Update password in auth
    const { error: authError } = await supabaseClient.auth.admin.updateUserById(user_id, {
      password: new_password
    })

    if (authError) throw authError

    console.log('Password updated for user:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating password:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteUser(supabaseClient: any, params: any) {
  const { user_id } = params

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: 'Missing required field: user_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Delete user from auth (cascades to profiles due to FK constraint)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(user_id)

    if (authError) throw authError

    console.log('User deleted:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
