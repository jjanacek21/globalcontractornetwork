import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEATURE_INFO: Record<string, { label: string; description: string; path: string }> = {
  directory_listing: {
    label: "Directory Listing",
    description: "Get listed in the public contractor directory",
    path: "/directory",
  },
  supplement_kings: {
    label: "Supplement Kings",
    description: "Access insurance supplement tools",
    path: "/supplement-kings/contractor",
  },
  permit_queens: {
    label: "Permit Queens",
    description: "Access permit expediting dashboard",
    path: "/permit-queens/dashboard",
  },
  crm_access: {
    label: "CRM Access",
    description: "Full lead management and CRM tools",
    path: "/lead-pipeline",
  },
  presentations: {
    label: "Presentations",
    description: "Sales presentation tools",
    path: "/presentations",
  },
  field_map: {
    label: "Field Map",
    description: "Satellite measurement tools",
    path: "/field-map",
  },
  learning_platform: {
    label: "Learning Platform",
    description: "Training courses access",
    path: "/learning",
  },
  store_discounts: {
    label: "Store Discounts",
    description: "Wholesale pricing on merchandise",
    path: "/store",
  },
};

interface NotifyRequest {
  contractor_id: string;
  approved_features: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-contractor-access function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contractor_id, approved_features }: NotifyRequest = await req.json();

    console.log("Processing notification for contractor:", contractor_id);
    console.log("Approved features:", approved_features);

    // Get contractor info
    const { data: contractor, error: contractorError } = await supabase
      .from("contractor_profiles")
      .select("company_name, email")
      .eq("id", contractor_id)
      .single();

    if (contractorError || !contractor) {
      console.error("Error fetching contractor:", contractorError);
      return new Response(
        JSON.stringify({ error: "Contractor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contractor.email) {
      console.log("Contractor has no email, skipping notification");
      return new Response(
        JSON.stringify({ message: "No email to send to" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the base URL - use environment variable or default
    const baseUrl = Deno.env.get("APP_URL") || "https://gcn.lovable.app";

    // Build the feature list HTML
    const featureListHtml = approved_features
      .filter((f) => FEATURE_INFO[f])
      .map((featureKey) => {
        const feature = FEATURE_INFO[featureKey];
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-weight: 600; color: #111827;">✅ ${feature.label}</div>
              <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${feature.description}</div>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <a href="${baseUrl}${feature.path}" style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                Access Now →
              </a>
            </td>
          </tr>
        `;
      })
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                  🎉 Access Approved!
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 16px;">
                  Great news for your business
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0; line-height: 1.6;">
                  Hi <strong>${contractor.company_name}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0; line-height: 1.6;">
                  Your access to the following Global Contractor Network services has been approved:
                </p>

                <!-- Feature Table -->
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                  <tbody>
                    ${featureListHtml}
                  </tbody>
                </table>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${baseUrl}/contractor" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                    Go to My Dashboard
                  </a>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0 0; line-height: 1.6;">
                  Questions? Contact us at <a href="mailto:support@gcn.com" style="color: #2563eb;">support@gcn.com</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                  — The Global Contractor Network Team
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GCN <onboarding@resend.dev>",
        to: [contractor.email],
        subject: "🎉 Your GCN Feature Access Has Been Approved!",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email send result:", emailResult);

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully to:", contractor.email);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-contractor-access:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
