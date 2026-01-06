// Supabase Edge Function: user-service
// - Creates users in Supabase Auth (admin only)
// - Upserts corresponding public.profiles row
// - Creates user_roles entry for role management
// - Creates authors row (id = user id) for columnists, enabling article ownership
// CORS enabled

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';

    // Client bound to caller (to read current user & role)
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for privileged operations
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Authenticate caller
    const { data: { user: caller }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !caller) {
      return jsonResponse(401, { ok: false, error: 'Not authenticated' });
    }

    console.log('User authenticated:', caller.id, caller.email);

    // Authorize admin using user_roles table (NOT profiles.role)
    const { data: userRole, error: roleErr } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    console.log('Role check:', userRole, roleErr);

    if (roleErr || !userRole || userRole.role !== 'admin') {
      return jsonResponse(403, { ok: false, error: 'Forbidden: admin only' });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'create_user') {
      return jsonResponse(400, { ok: false, error: 'Invalid action' });
    }

    const payload = body?.payload || {};
    const { email, password, name, username, role } = payload as {
      email: string; password: string; name: string; username: string; role: 'admin' | 'colunista';
    };

    if (!email || !password || !name || !username || !role) {
      return jsonResponse(400, { ok: false, error: 'Missing fields: email, password, name, username, role' });
    }

    if (!['admin', 'colunista'].includes(role)) {
      return jsonResponse(400, { ok: false, error: 'Invalid role' });
    }

    console.log('Creating user:', { email, username, name, role });

    // 1) Try to create Auth user OR find existing user
    let newUserId: string;
    let userExists = false;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { name, username, role },
    });

    if (createErr) {
      // Check if user already exists
      if (createErr.message?.includes('already been registered') || createErr.message?.includes('email_exists')) {
        console.log(`User with email ${email} already exists, will update their profile`);
        userExists = true;
        
        // Find existing user by email
        const { data: existingUsers, error: listErr } = await admin.auth.admin.listUsers({});
        if (listErr || !existingUsers?.users) {
          return jsonResponse(400, { ok: false, error: 'Failed to find existing user' });
        }
        
        const existingUser = existingUsers.users.find(u => u.email === email);
        if (!existingUser) {
          return jsonResponse(400, { ok: false, error: 'User exists but could not be found' });
        }
        
        newUserId = existingUser.id;
        
        // Update existing user's metadata
        const { error: updateErr } = await admin.auth.admin.updateUserById(newUserId, {
          password,
          email_confirm: true,
          user_metadata: { name, username, role },
        });
        
        if (updateErr) {
          return jsonResponse(400, { ok: false, error: `Failed to update existing user: ${updateErr.message}` });
        }
      } else {
        console.error('Auth create error:', createErr);
        return jsonResponse(400, { ok: false, error: createErr.message || 'Failed to create auth user' });
      }
    } else if (created?.user) {
      newUserId = created.user.id;
      console.log('Auth user created:', newUserId);
    } else {
      return jsonResponse(400, { ok: false, error: 'Failed to create auth user' });
    }

    // 2) Upsert profile row (NO role column in profiles table)
    const profileRow = {
      id: newUserId,
      username,
      name,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertProfileErr } = await admin.from('profiles').upsert(profileRow);
    if (upsertProfileErr) {
      console.error('Profile upsert error:', upsertProfileErr);
      return jsonResponse(400, { ok: false, error: upsertProfileErr.message || 'Failed to upsert profile' });
    }

    console.log('Profile upserted');

    // 3) Upsert user role in user_roles table
    const { error: upsertRoleErr } = await admin.from('user_roles').upsert({
      user_id: newUserId,
      role: role,
      updated_at: new Date().toISOString(),
    });

    if (upsertRoleErr) {
      console.error('Role upsert error:', upsertRoleErr);
      return jsonResponse(400, { ok: false, error: upsertRoleErr.message || 'Failed to upsert role' });
    }

    console.log('Role assigned:', role);

    // 4) Ensure an authors row exists and matches the user id (important for articles_normalized policies)
    if (role === 'colunista') {
      const authorRow = {
        id: newUserId,
        name,
        is_active: true,
        social_jsonb: {},
        avatar_url: null,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertAuthorErr } = await admin.from('authors').upsert(authorRow);
      if (upsertAuthorErr) {
        console.error('Author upsert error:', upsertAuthorErr);
        return jsonResponse(400, { ok: false, error: upsertAuthorErr.message || 'Failed to upsert author' });
      }
      console.log('Author record created');
    }

    return jsonResponse(200, {
      ok: true,
      userId: newUserId,
      email,
      role,
      userExists,
      profile: { id: newUserId, name, username },
      message: userExists ? 'User updated successfully' : 'User created successfully'
    });
  } catch (e: any) {
    console.error('user-service error', e);
    return jsonResponse(500, { ok: false, error: e?.message || 'Internal error' });
  }
});
