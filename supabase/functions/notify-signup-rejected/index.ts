import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REASON_LABELS: Record<string, string> = {
  missing_license: "License information missing or invalid",
  incomplete_documents: "Incomplete documents or credentials",
  duplicate_account: "Duplicate or existing account detected",
  credentials_unverifiable: "Credentials could not be verified",
  other: "Application did not meet requirements",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const { contractorId, reason, notes } = await req.json();
    if (!contractorId || typeof reason !== "string" || typeof notes !== "string" || notes.trim().length < 10) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: contractor, error } = await supabase
      .from("contractor_profiles")
      .select("email, company_name, first_name")
      .eq("id", contractorId)
      .single();
    if (error || !contractor?.email) throw new Error("Contractor not found or missing email");

    const reasonLabel = REASON_LABELS[reason] || REASON_LABELS.other;
    const ADMIN_EMAIL = "jared@globalcontractor.network";
    const safeTo = contractor.email === ADMIN_EMAIL ? contractor.email : ADMIN_EMAIL;
    const greeting = contractor.first_name || contractor.company_name || "there";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #475569, #334155); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #18181b;">Hi ${greeting},</p>
          <p style="color: #52525b; line-height: 1.6;">
            Thank you for applying to the Global Contractor Network. After reviewing your application
            for <strong>${contractor.company_name || "your account"}</strong>, we are unable to approve it at this time.
          </p>
          <div style="background: #f8fafc; border-left: 4px solid #475569; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #18181b; font-weight: 600;">Reason: ${reasonLabel}</p>
            <p style="margin: 0; color: #52525b; white-space: pre-wrap;">${notes.replace(/</g, "&lt;")}</p>
          </div>
          <p style="color: #52525b; line-height: 1.6;">
            You're welcome to address the items above and reapply, or reply to this email if you'd like to discuss.
          </p>
          <p style="color: #52525b; margin-top: 24px;">— The Global Contractor Network Team</p>
          ${safeTo !== contractor.email ? `<p style="font-size:11px;color:#aaa;margin-top:24px;">[Test mode] Original recipient: ${contractor.email}</p>` : ""}
        </div>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [safeTo],
        subject: "Update on your Global Contractor Network application",
        html,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || "Email send failed");

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-signup-rejected error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
