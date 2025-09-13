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
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createUser(supabaseClient: any, params: any) {
  const { email, password, username, name, role } = params

  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, name, role },
      email_confirm: true
    })

    if (authError) throw authError

    // Update profile with role and temp password
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        role,
        temp_password: password,
        is_active: true
      })
      .eq('id', authData.user.id)

    if (profileError) throw profileError

    // If role is columnist, ensure authors record exists
    if (role === 'colunista') {
      const { error: authorError } = await supabaseClient
        .from('authors')
        .upsert({
          id: authData.user.id,
          name,
          is_active: true
        })

      if (authorError) throw authorError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updatePassword(supabaseClient: any, params: any) {
  const { user_id, new_password } = params

  try {
    // Update password in auth
    const { error: authError } = await supabaseClient.auth.admin.updateUserById(user_id, {
      password: new_password
    })

    if (authError) throw authError

    // Update temp_password in profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ temp_password: new_password })
      .eq('id', user_id)

    if (profileError) throw profileError

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
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteUser(supabaseClient: any, params: any) {
  const { user_id } = params

  try {
    // Delete user from auth (cascades to profiles)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(user_id)

    if (authError) throw authError

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
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}