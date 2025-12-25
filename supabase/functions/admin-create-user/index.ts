import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: string;
  teamId?: string | null;
  managerId?: string | null;
  jobTitle?: string | null;
  isActive?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body: CreateUserRequest = await req.json();
    console.log('Creating user with data:', { ...body, email: body.email.substring(0, 3) + '***' });

    // Validate required fields
    if (!body.email || !body.companyId || !body.role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, company, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

    // Create the auth user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm since admin is creating
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Create profile record (the trigger should do this, but let's ensure it exists)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the whole operation, profile might be created by trigger
    }

    // Create company_members record
    const { error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert({
        user_id: authData.user.id,
        company_id: body.companyId,
        role: body.role,
        team_id: body.teamId || null,
        manager_id: body.managerId || null,
        job_title: body.jobTitle || null,
        is_active: body.isActive ?? true,
      });

    if (memberError) {
      console.error('Company member creation error:', memberError);
      // Try to clean up the auth user if member creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to add user to company: ${memberError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User successfully created and added to company');

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
    });

    if (resetError) {
      console.warn('Password reset email failed:', resetError);
      // Don't fail the operation, user was created successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        message: 'User created successfully. They can use "Forgot Password" to set their password.'
      }),
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
