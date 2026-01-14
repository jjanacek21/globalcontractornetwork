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
    console.log(`Starting deletion of related records for user ${userId}...`);
    
    // Lead-related tables - FK constraints now SET NULL on delete, but we clean up anyway
    // Tables to delete records from (user-owned data)
    const tablesToDelete = [
      { table: 'coating_leads', column: 'user_id' },
      { table: 'window_leads', column: 'user_id' },
      { table: 'contact_requests', column: 'user_id' },
      { table: 'service_requests', column: 'user_id' },
      { table: 'marketing_leads', column: 'user_id' },
      { table: 'roofing_consultations', column: 'user_id' },
      { table: 'roofing_quiz_responses', column: 'user_id' },
      { table: 'homeowner_notifications', column: 'user_id' },
      { table: 'homeowner_photos', column: 'user_id' },
      { table: 'homeowner_appointments', column: 'homeowner_id' },
      { table: 'network_members', column: 'user_id' },
      { table: 'company_members', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
      { table: 'user_gamification', column: 'user_id' },
      { table: 'user_badges', column: 'user_id' },
      { table: 'activities', column: 'user_id' },
      { table: 'favorite_contractors', column: 'user_id' },
    ];

    // Tables to nullify references (preserve the records but remove user link)
    const tablesToNullify = [
      { table: 'customers', column: 'assigned_rep_id' },
    ];

    for (const { table, column } of tablesToDelete) {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
      if (error) {
        console.log(`Note: Could not delete from ${table}: ${error.message}`);
      } else {
        console.log(`Deleted from ${table}`);
      }
    }

    // Nullify references in tables that should preserve records
    for (const { table, column } of tablesToNullify) {
      const { error } = await supabaseAdmin.from(table).update({ [column]: null }).eq(column, userId);
      if (error) {
        console.log(`Note: Could not nullify ${column} in ${table}: ${error.message}`);
      } else {
        console.log(`Nullified ${column} in ${table}`);
      }
    }
    
    console.log(`Related records cleaned up, now deleting profile...`);

    // Delete the profile FIRST (before auth.users) to avoid trigger issues
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Profile delete error:', profileDeleteError);
      // Continue anyway - the auth delete might still work
    } else {
      console.log(`Profile deleted successfully`);
    }

    // Now delete from auth.users
    console.log(`Deleting auth user...`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // If user not found in auth, that's okay - they may have been an orphan profile
      if (deleteError.message?.includes('not found') || (deleteError as any).code === 'user_not_found') {
        console.log(`Auth user not found (orphan profile) - deletion successful`);
      } else {
        console.error('Delete auth user error:', deleteError);
        return new Response(
          JSON.stringify({ success: false, error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
