import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Services that get auto-approved instantly
const AUTO_APPROVE_SERVICES = ['store_discounts'];

// Premium services requiring manual review
const PREMIUM_SERVICES = ['crm_access', 'supplement_kings', 'permit_queens', 'learning_platform'];

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

interface LoginRequestPayload {
  user_id: string;
  contractor_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  service_type: string;
  request_notes?: string;
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
  console.log("process-login-request function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: LoginRequestPayload = await req.json();
    console.log("Processing login request:", payload);

    const serviceLabel = SERVICE_LABELS[payload.service_type] || payload.service_type;
    const isAutoApprove = AUTO_APPROVE_SERVICES.includes(payload.service_type);
    const isPremium = PREMIUM_SERVICES.includes(payload.service_type);

    // Create the login request record
    const { data: loginRequest, error: insertError } = await supabase
      .from("login_requests")
      .insert({
        user_id: payload.user_id,
        contractor_id: payload.contractor_id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        company_name: payload.company_name,
        service_type: payload.service_type,
        request_notes: payload.request_notes,
        status: isAutoApprove ? "auto_approved" : "pending",
        is_auto_approved: isAutoApprove,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting login request:", insertError);
      throw insertError;
    }

    console.log("Login request created:", loginRequest.id);

    if (isAutoApprove && payload.contractor_id) {
      // Auto-approve: Grant feature access immediately
      const { error: featureError } = await supabase
        .from("contractor_feature_access")
        .upsert({
          contractor_id: payload.contractor_id,
          feature_name: payload.service_type,
          is_approved: true,
          approved_at: new Date().toISOString(),
        }, {
          onConflict: 'contractor_id,feature_name'
        });

      if (featureError) {
        console.error("Error granting feature access:", featureError);
      }

      // Send instant approval email
      const approvalResult = await sendEmail(
        [payload.email],
        `🎉 Instant Access Granted - ${serviceLabel}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Global Contractor Network</h1>
            </div>
            
            <h2 style="color: #16a34a;">🎉 Instant Access Granted!</h2>
            
            <p>Hi ${payload.first_name || 'there'},</p>
            
            <p>Great news! Your access to <strong>${serviceLabel}</strong> has been automatically approved.</p>
            
            <p>You can start using it right now from your dashboard.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://globalcontractor.network/member/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p>Enjoy your benefits!</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              — The GCN Team<br>
              Questions? Contact us at <a href="mailto:jared@globalcontractor.network">jared@globalcontractor.network</a>
            </p>
          </div>
        `
      );
      console.log("Auto-approval email sent:", approvalResult);

    } else {
      // Manual review required: Send confirmation to user
      const confirmationResult = await sendEmail(
        [payload.email],
        `Request Received - ${serviceLabel}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Global Contractor Network</h1>
            </div>
            
            <h2 style="color: #333;">Request Received ⏳</h2>
            
            <p>Hi ${payload.first_name || 'there'},</p>
            
            <p>Thank you for requesting access to <strong>${serviceLabel}</strong> on the Global Contractor Network.</p>
            
            <p>Our team will review your application and contact you shortly once your account has been verified.</p>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #666;"><strong>Current Status:</strong> ⏳ Under Review</p>
              <p style="margin: 10px 0 0 0; color: #666;"><strong>Typical Review Time:</strong> 24-48 hours</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Questions? Contact us at <a href="mailto:jared@globalcontractor.network">jared@globalcontractor.network</a><br><br>
              — The GCN Team
            </p>
          </div>
        `
      );
      console.log("Confirmation email sent:", confirmationResult);

      // Notify admin about new request
      const riskLevel = isPremium ? "🔴 Premium" : "🟡 Standard";
      const adminResult = await sendEmail(
        ["jared@globalcontractor.network"],
        `🔔 New Login Request - ${serviceLabel}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">New Login Request Requires Review</h2>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>User:</strong> ${payload.first_name || ''} ${payload.last_name || ''} (${payload.email})</p>
              <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${payload.company_name || 'N/A'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Service Requested:</strong> ${serviceLabel}</p>
              <p style="margin: 0 0 10px 0;"><strong>Risk Level:</strong> ${riskLevel}</p>
              ${payload.request_notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${payload.request_notes}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://globalcontractor.network/admin/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Review Now
              </a>
            </div>
          </div>
        `
      );
      console.log("Admin notification sent:", adminResult);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        request_id: loginRequest.id,
        auto_approved: isAutoApprove 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in process-login-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
