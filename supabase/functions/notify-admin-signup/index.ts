import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractorSignupRequest {
  companyName: string;
  email: string;
  phone: string | null;
  category: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContractorSignupRequest = await req.json();
    console.log("Received contractor signup notification request:", data);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: superAdmins } = await supabase.from("super_admins").select("user_id");
    const adminUserIds = superAdmins?.map(a => a.user_id) || [];
    
    if (adminUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: adminProfiles } = await supabase.from("profiles").select("email").in("id", adminUserIds);
    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No admin emails found" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GCN Notifications <onboarding@resend.dev>",
        to: adminEmails,
        subject: `🚀 New Contractor Application: ${data.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">🏗️ New Contractor Application</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
              <p><strong>Company:</strong> ${data.companyName}</p>
              <p><strong>Contact:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
              <p><strong>Category:</strong> ${data.category}</p>
            </div>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
