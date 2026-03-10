// Using built-in Deno.serve instead of remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  role: string;
  teamId?: string;
  teamName?: string;
  managerId?: string;
  jobTitle?: string;
  invitedByName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("invite-company-member function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body: InviteRequest = await req.json();
    console.log("Processing invitation for:", body.email);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === body.email);
    
    if (existingUser) {
      // Check if already a member of this company
      const { data: existingMember } = await supabaseAdmin
        .from('company_members')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('company_id', body.companyId)
        .single();
      
      if (existingMember) {
        throw new Error("This user is already a member of your company");
      }
      
      // Add existing user to company
      const { error: memberError } = await supabaseAdmin
        .from('company_members')
        .insert({
          user_id: existingUser.id,
          company_id: body.companyId,
          role: body.role,
          team_id: body.teamId || null,
          manager_id: body.managerId || null,
          job_title: body.jobTitle || null,
          is_active: true
        });

      if (memberError) throw new Error(`Failed to add member: ${memberError.message}`);

      // Send notification email
      await sendInvitationEmail(body, null, true);

      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: existingUser.id,
          message: `${body.email} has been added to your company`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

    // 1. Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        invited_to_company: body.companyId
      }
    });

    if (authError) throw new Error(`Failed to create user: ${authError.message}`);

    const userId = authData.user.id;
    console.log("Created user:", userId);

    // 2. Create/update profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // 3. Create company member record
    const { error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert({
        user_id: userId,
        company_id: body.companyId,
        role: body.role,
        team_id: body.teamId || null,
        manager_id: body.managerId || null,
        job_title: body.jobTitle || null,
        is_active: true
      });

    if (memberError) {
      console.error("Member creation failed, cleaning up user:", memberError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create company member: ${memberError.message}`);
    }

    // 4. Create contractor profile for contractor roles
    if (['sales_rep', 'manager', 'project_manager'].includes(body.role)) {
      const { error: contractorError } = await supabaseAdmin
        .from('contractor_profiles')
        .insert({
          user_id: userId,
          company_name: body.companyName,
          company_id: body.companyId,
          email: body.email,
          first_name: body.firstName,
          last_name: body.lastName,
          category: 'General Contractor',
          verification_status: 'approved',
          subscription_status: 'active',
          is_verified: true,
          contractor_type: body.role,
          team_id: body.teamId || null
        });

      if (contractorError) {
        console.error("Contractor profile creation error:", contractorError);
      }
    }

    // 5. Generate password reset link for first login
    let resetLink = 'https://globalcontractor.network/network-login';
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: body.email,
        options: {
          redirectTo: 'https://globalcontractor.network/member/dashboard'
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        resetLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.error("Failed to generate recovery link:", linkErr);
    }

    // 6. Send invitation email
    await sendInvitationEmail(body, resetLink, false);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: `Invitation sent to ${body.email}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Invitation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function sendInvitationEmail(body: InviteRequest, resetLink: string | null, isExistingUser: boolean) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return;
  }

  const roleDisplay: Record<string, string> = {
    'company_admin': 'Company Administrator',
    'manager': 'Team Manager',
    'project_manager': 'Project Manager',
    'sales_rep': 'Sales Representative',
    'crew': 'Crew Member'
  };

  const roleLabel = roleDisplay[body.role] || body.role;

  const buttonHtml = isExistingUser 
    ? `<a href="https://globalcontractor.network/member/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Go to Dashboard
      </a>`
    : `<a href="${resetLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Accept Invitation & Set Password
      </a>`;

  const noteHtml = isExistingUser
    ? `<p style="color: #1e40af; margin: 0; font-size: 14px;">
        You've been added to a new company. Log in with your existing credentials to access your updated dashboard.
      </p>`
    : `<p style="color: #1e40af; margin: 0; font-size: 14px;">
        Click the button above to set your password and access your dashboard. This link expires in 24 hours.
      </p>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [body.email],
        subject: `You've been invited to join ${body.companyName} on GCN`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Join ${body.companyName} on GCN</p>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #18181b;">Hi ${body.firstName},</p>
              <p style="color: #52525b; line-height: 1.6;">
                ${body.invitedByName} has invited you to join <strong>${body.companyName}</strong> as a <strong>${roleLabel}</strong> on the Global Contractor Network.
              </p>
              
              ${body.teamName ? `<p style="color: #52525b;"><strong>Team:</strong> ${body.teamName}</p>` : ''}
              ${body.jobTitle ? `<p style="color: #52525b;"><strong>Position:</strong> ${body.jobTitle}</p>` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                ${buttonHtml}
              </div>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
                ${noteHtml}
              </div>
              
              <h3 style="color: #18181b;">What you'll have access to:</h3>
              <ul style="color: #52525b; padding-left: 20px;">
                <li>Your team's referral dashboard</li>
                <li>Lead tracking and management</li>
                <li>Company resources and training</li>
                <li>Gamification and rewards</li>
              </ul>
            </div>
            <div style="text-align: center; padding: 24px; color: #71717a; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Global Contractor Network</p>
              <p>Questions? Contact us at <a href="mailto:jared@globalcontractor.network" style="color: #3b82f6;">jared@globalcontractor.network</a></p>
            </div>
          </div>
        `,
      }),
    });
    console.log("Invitation email sent to:", body.email);
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
  }
}

serve(handler);
