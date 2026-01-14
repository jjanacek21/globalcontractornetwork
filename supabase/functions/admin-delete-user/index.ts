import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (!caller) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is super admin
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', caller.id)
      .single();

    if (!superAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deleting yourself
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete related records first to avoid foreign key constraints
    // These may fail if tables don't exist or user has no records - that's ok
    console.log(`Deleting related records for user ${userId}...`);
    
    // Lead-related tables
    await supabaseAdmin.from('coating_leads').delete().eq('user_id', userId);
    await supabaseAdmin.from('window_leads').delete().eq('user_id', userId);
    await supabaseAdmin.from('contact_requests').delete().eq('user_id', userId);
    await supabaseAdmin.from('service_requests').delete().eq('user_id', userId);
    await supabaseAdmin.from('marketing_leads').delete().eq('user_id', userId);
    await supabaseAdmin.from('roofing_consultations').delete().eq('user_id', userId);
    await supabaseAdmin.from('roofing_quiz_responses').delete().eq('user_id', userId);
    
    // Homeowner-related tables
    await supabaseAdmin.from('homeowner_notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('homeowner_photos').delete().eq('user_id', userId);
    await supabaseAdmin.from('homeowner_appointments').delete().eq('homeowner_id', userId);
    
    // Network and company membership
    await supabaseAdmin.from('network_members').delete().eq('user_id', userId);
    await supabaseAdmin.from('company_members').delete().eq('user_id', userId);
    
    // User roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    
    // Gamification
    await supabaseAdmin.from('user_gamification').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_badges').delete().eq('user_id', userId);
    
    console.log(`Related records deleted, now deleting auth user...`);

    // Delete from auth.users (this should cascade to profiles via trigger)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also manually delete from profiles in case cascade didn't work
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    console.log(`User ${userId} deleted successfully by super admin ${caller.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
