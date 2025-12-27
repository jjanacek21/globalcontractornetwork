import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SERVICE_LABELS: Record<string, string> = {
  'store_discounts': 'Store Rewards & Discounts',
  'directory_listing': 'Directory Listing',
  'field_map': 'Field Map',
  'presentations': 'Presentations',
  'learning_platform': 'Learning Platform',
  'crm_access': 'CRM Portal',
  'supplement_kings': 'Supplement Kings',
  'permit_queens': 'Permit Queens',
};

const SERVICE_PATHS: Record<string, string> = {
  'store_discounts': '/member/dashboard',
  'directory_listing': '/contractor-directory',
  'field_map': '/field-map',
  'presentations': '/presentations',
  'learning_platform': '/student/dashboard',
  'crm_access': '/dashboard',
  'supplement_kings': '/supplement-kings/contractor/dashboard',
  'permit_queens': '/permit-queens/dashboard',
};

interface ApprovalPayload {
  request_id: string;
  admin_notes?: string;
}

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Global Contractor Network <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-login-approved function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ApprovalPayload = await req.json();
    console.log("Processing approval:", payload);

    // Get the login request details
    const { data: request, error: fetchError } = await supabase
      .from("login_requests")
      .select("*")
      .eq("id", payload.request_id)
      .single();

    if (fetchError || !request) {
      console.error("Error fetching login request:", fetchError);
      throw new Error("Login request not found");
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from("login_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        admin_notes: payload.admin_notes,
      })
      .eq("id", payload.request_id);

    if (updateError) {
      console.error("Error updating login request:", updateError);
      throw updateError;
    }

    // Grant feature access if contractor_id exists
    if (request.contractor_id) {
      const { error: featureError } = await supabase
        .from("contractor_feature_access")
        .upsert({
          contractor_id: request.contractor_id,
          feature_name: request.service_type,
          is_approved: true,
          approved_at: new Date().toISOString(),
        }, {
          onConflict: 'contractor_id,feature_name'
        });

      if (featureError) {
        console.error("Error granting feature access:", featureError);
      }
    }

    const serviceLabel = SERVICE_LABELS[request.service_type] || request.service_type;
    const servicePath = SERVICE_PATHS[request.service_type] || '/member/dashboard';

    // Send approval email to user
    const emailResult = await sendEmail(
      [request.email],
      `🎉 Your Access Has Been Approved! - ${serviceLabel}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Global Contractor Network</h1>
          </div>
          
          <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <h2 style="color: #16a34a; margin: 0;">🎉 Your Access Has Been Approved!</h2>
          </div>
          
          <p>Hi ${request.first_name || 'there'},</p>
          
          <p>Great news! Your access to <strong>${serviceLabel}</strong> has been approved.</p>
          
          <p>You can now log in using the credentials you created when signing up:</p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${request.email}</p>
            <p style="margin: 0;"><strong>Password:</strong> The password you created during signup</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://globalcontractor.network${servicePath}" 
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access ${serviceLabel}
            </a>
          </div>
          
          <p>Welcome to the Global Contractor Network!</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            — The GCN Team<br>
            Questions? Contact us at <a href="mailto:jared@globalcontractor.network">jared@globalcontractor.network</a>
          </p>
        </div>
      `
    );

    console.log("Approval email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-login-approved:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
