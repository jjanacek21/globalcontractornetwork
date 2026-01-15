import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  companyId: string;
  companyName: string;
  adminEmail: string;
  adminName: string;
  approvedFeatures: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-company-approved function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: ApprovalRequest = await req.json();
    console.log("Sending approval notification to:", data.adminEmail);

    const featuresList = data.approvedFeatures
      .map(f => `<li style="margin-bottom: 8px;">✓ ${f}</li>`)
      .join('');

    // Note: Until domain is verified at resend.com/domains, emails can only go to jared@globalcontractor.network
    const ADMIN_EMAIL = "jared@globalcontractor.network";
    const isTestMode = data.adminEmail !== ADMIN_EMAIL;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your company has been approved</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #18181b;">Hi ${data.adminName},</p>
          <p style="color: #52525b; line-height: 1.6;">
            Great news! <strong>${data.companyName}</strong> has been approved and you now have full access to the Global Contractor Network.
          </p>
          
          ${featuresList ? `
          <h3 style="color: #18181b;">Your approved features:</h3>
          <ul style="color: #059669; padding-left: 20px;">
            ${featuresList}
          </ul>
          ` : ''}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://globalcontractor.network/member/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Go to Dashboard
            </a>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px;">
            <p style="color: #166534; margin: 0;">
              <strong>Pro tip:</strong> Set up your company profile and invite your team members to start maximizing your network benefits.
            </p>
          </div>
        </div>
        <div style="text-align: center; padding: 24px; color: #71717a; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Global Contractor Network</p>
          <p>Questions? Contact us at <a href="mailto:jared@globalcontractor.network" style="color: #059669;">jared@globalcontractor.network</a></p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: isTestMode 
          ? `[FOR: ${data.adminEmail}] 🎉 ${data.companyName} Has Been Approved!`
          : `🎉 ${data.companyName} Has Been Approved!`,
        html: isTestMode 
          ? `<div style="background: #fef3c7; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <strong>⚠️ Test Mode:</strong> This email was meant for <strong>${data.adminEmail}</strong>. 
              Verify your domain at resend.com/domains to send to external recipients.
            </div>${emailHtml}`
          : emailHtml,
      }),
    });

    const result = await response.json();
    console.log("Email sent result:", result, isTestMode ? `(intended for: ${data.adminEmail})` : "");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-company-approved:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
