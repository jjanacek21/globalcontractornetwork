import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") || Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      throw new Error("Email service not configured");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirectTo || "https://globalcontractor.network/reset-password" },
    });

    // Always respond success to prevent email enumeration
    if (error || !data?.properties?.action_link) {
      console.log("generateLink result:", error?.message);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const link = data.properties.action_link;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>We received a request to reset the password for <strong>${email}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#0a7d3b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset Password</a>
        </p>
        <p style="font-size:12px;color:#666">If the button doesn't work, paste this link in your browser:<br/>${link}</p>
        <p style="font-size:12px;color:#666">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>`;

    const resendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [email],
        subject: "Reset your password",
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendRes.status, resendData);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("send-password-reset error:", msg);
    return new Response(JSON.stringify({ success: false, error: "Unable to send reset email" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
