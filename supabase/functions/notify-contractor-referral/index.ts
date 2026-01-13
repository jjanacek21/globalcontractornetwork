import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralNotificationRequest {
  contractorId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  serviceType: string;
  propertyAddress: string;
  leadSource: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      contractorId,
      leadName,
      leadEmail,
      leadPhone,
      serviceType,
      propertyAddress,
      leadSource,
    }: ReferralNotificationRequest = await req.json();

    if (!contractorId) {
      return new Response(
        JSON.stringify({ error: "Contractor ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contractor details
    const { data: contractor, error: contractorError } = await supabase
      .from("contractor_profiles")
      .select("id, company_name, email")
      .eq("id", contractorId)
      .single();

    if (contractorError || !contractor) {
      console.error("Error fetching contractor:", contractorError);
      return new Response(
        JSON.stringify({ error: "Contractor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create referral record
    const { error: referralError } = await supabase
      .from("contractor_referrals")
      .insert({
        referring_contractor_id: contractorId,
        referred_customer_name: leadName,
        referred_customer_email: leadEmail,
        referred_customer_phone: leadPhone,
        referred_service_type: serviceType,
        property_address: propertyAddress || "N/A",
        referral_source_context: `Customer selected ${contractor.company_name} as referral source on ${leadSource}`,
        status: "pending",
      });

    if (referralError) {
      console.error("Error creating referral:", referralError);
      // Continue to send email even if referral record fails (might be duplicate)
    }

    // Send email notification if contractor has an email
    if (contractor.email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (resendApiKey) {
        const formattedDate = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .details-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
              .details-table td:first-child { font-weight: bold; color: #6b7280; width: 120px; }
              .cta-button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 New Referral Received!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${contractor.company_name}</strong>,</p>
                <p>Great news! A customer mentioned you as their referral source when requesting a quote.</p>
                
                <table class="details-table">
                  <tr>
                    <td>Customer</td>
                    <td>${leadName}</td>
                  </tr>
                  <tr>
                    <td>Email</td>
                    <td>${leadEmail || "Not provided"}</td>
                  </tr>
                  <tr>
                    <td>Phone</td>
                    <td>${leadPhone || "Not provided"}</td>
                  </tr>
                  <tr>
                    <td>Service</td>
                    <td>${serviceType}</td>
                  </tr>
                  <tr>
                    <td>Property</td>
                    <td>${propertyAddress || "Not provided"}</td>
                  </tr>
                  <tr>
                    <td>Source</td>
                    <td>${leadSource}</td>
                  </tr>
                  <tr>
                    <td>Submitted</td>
                    <td>${formattedDate}</td>
                  </tr>
                </table>
                
                <p>Log in to your contractor dashboard to view and manage this referral.</p>
                
                <center>
                  <a href="https://globalcontractornetwork.com/contractor-dashboard" class="cta-button">
                    View My Referrals →
                  </a>
                </center>
              </div>
              <div class="footer">
                <p>Thank you for being part of the Global Contractor Network!</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "GCN Referrals <onboarding@resend.dev>",
            to: [contractor.email],
            subject: "🎉 New Referral Received!",
            html: emailHtml,
          }),
        });

        const emailResult = await emailRes.json();
        console.log("Referral notification email sent:", emailResult);
      } else {
        console.log("RESEND_API_KEY not configured, skipping email notification");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Referral notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-contractor-referral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
