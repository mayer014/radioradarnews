import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Bootstrap Admin: Starting...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 1: Clean up any existing admin users
    console.log('Bootstrap Admin: Cleaning up existing admin users...');
    
    // Find any users with the incorrect email
    const { data: incorrectUsers } = await supabase.auth.admin.listUsers();
    
    if (incorrectUsers?.users) {
      for (const user of incorrectUsers.users) {
        if (user.email === 'admin@radioradar.news') {
          console.log(`Bootstrap Admin: Deleting incorrect admin user ${user.id}`);
          await supabase.auth.admin.deleteUser(user.id);
        }
      }
    }

    // Step 2: Check if correct admin exists
    const { data: existingAdmin } = await supabase.auth.admin.listUsers();
    const correctAdmin = existingAdmin?.users?.find(user => user.email === 'adm@radioradar.news');

    if (correctAdmin) {
      console.log('Bootstrap Admin: Correct admin user already exists');
      return new Response(JSON.stringify({
        success: true,
        message: 'Admin user already exists',
        email: 'adm@radioradar.news'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Create the correct admin user
    console.log('Bootstrap Admin: Creating admin user...');
    
    const { data: newAdmin, error: createError } = await supabase.auth.admin.createUser({
      email: 'adm@radioradar.news',
      password: '25896589Ba@23479612',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        name: 'Administrador'
      }
    });

    if (createError) {
      console.error('Bootstrap Admin: Error creating admin user:', createError);
      throw createError;
    }

    console.log('Bootstrap Admin: Admin user created successfully:', newAdmin.user?.id);

    // Step 4: Ensure profile is created (trigger should handle this, but let's verify)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newAdmin.user!.id)
      .single();

    if (!profile) {
      console.log('Bootstrap Admin: Creating profile manually...');
      await supabase
        .from('profiles')
        .insert({
          id: newAdmin.user!.id,
          username: 'admin',
          name: 'Administrador',
          role: 'admin',
          is_active: true
        });
    }

    // Step 5: Clean up profiles table of any orphaned profiles
    console.log('Bootstrap Admin: Cleaning up orphaned profiles...');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id');
    
    if (allProfiles) {
      for (const profile of allProfiles) {
        // Check if user still exists
        const { data: user } = await supabase.auth.admin.getUserById(profile.id);
        if (!user.user) {
          console.log(`Bootstrap Admin: Removing orphaned profile ${profile.id}`);
          await supabase
            .from('profiles')
            .delete()
            .eq('id', profile.id);
        }
      }
    }

    console.log('Bootstrap Admin: Bootstrap completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user created successfully',
      email: 'adm@radioradar.news',
      user_id: newAdmin.user?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bootstrap Admin Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});