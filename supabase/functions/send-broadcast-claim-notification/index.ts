import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://globalcontractor.network";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) {
      return json({ error: "conversation_id required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: conv, error: convErr } = await admin
      .from("broadcast_conversations")
      .select(`
        id, customer_id, contractor_id, broadcast_id, customer_consent,
        gcn_customers!inner(name, email, property_address),
        contractor_profiles!inner(company_name, phone, email, user_id),
        referral_broadcasts!inner(trade, notes, service_area)
      `)
      .eq("id", conversation_id)
      .single();
    if (convErr || !conv) return json({ error: convErr?.message ?? "Not found" }, 404);

    const customer: any = conv.gcn_customers;
    const contractor: any = conv.contractor_profiles;
    const broadcast: any = conv.referral_broadcasts;

    if (!customer?.email) return json({ error: "Customer has no email" }, 400);

    // Generate accept/decline tokens
    const { data: tokens, error: tokErr } = await admin
      .from("broadcast_consent_tokens")
      .insert([
        { conversation_id, action: "accept" },
        { conversation_id, action: "decline" },
      ])
      .select("token, action");
    if (tokErr) return json({ error: tokErr.message }, 500);

    const acceptToken = tokens.find((t) => t.action === "accept")!.token;
    const declineToken = tokens.find((t) => t.action === "decline")!.token;
    const acceptUrl = `${APP_URL}/r/consent?token=${acceptToken}`;
    const declineUrl = `${APP_URL}/r/consent?token=${declineToken}`;

    // Pull the contractor's first message
    const { data: msgs } = await admin
      .from("broadcast_messages")
      .select("content, created_at")
      .eq("conversation_id", conversation_id)
      .eq("sender_type", "contractor")
      .order("created_at", { ascending: true })
      .limit(1);
    const introMessage = msgs?.[0]?.content ?? "Hi! I'd love to help with your project.";

    const customerFirstName = (customer.name ?? "there").split(" ")[0];
    const trade = broadcast.trade ?? "your project";

    const html = `
<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2e22;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px 24px;">
    <h1 style="font-size:22px;color:#0f3d2c;margin:0 0 8px;">A contractor wants to help with your ${trade}</h1>
    <p style="color:#5a6b62;margin:0 0 24px;">Hi ${customerFirstName}, your referral was matched. Here's who reached out:</p>
    <div style="border:1px solid #e5e0d4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-weight:700;font-size:16px;color:#0f3d2c;">${escapeHtml(contractor.company_name ?? "A vetted GCN contractor")}</div>
      <div style="color:#5a6b62;font-size:13px;margin-top:4px;">Trade: ${escapeHtml(trade)}</div>
      <div style="margin-top:14px;padding:12px;background:#f4f1ea;border-radius:8px;font-style:italic;font-size:14px;">
        "${escapeHtml(introMessage)}"
      </div>
    </div>
    <p style="color:#5a6b62;font-size:14px;">Up to 3 contractors may reach out. You're in control — accept to start the conversation, or decline to stop further messages from this contractor.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${acceptUrl}" style="display:inline-block;background:#0f3d2c;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;margin-right:8px;">Accept &amp; Reply</a>
      <a href="${declineUrl}" style="display:inline-block;background:#fff;color:#5a6b62;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;border:1px solid #e5e0d4;">Not interested</a>
    </div>
    <p style="color:#9aa6a0;font-size:12px;text-align:center;">Powered by Global Contractor Network</p>
  </div>
</body></html>`;

    if (RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Global Contractor Network <onboarding@resend.dev>",
          to: [customer.email],
          subject: `${contractor.company_name ?? "A contractor"} wants to help with your ${trade}`,
          html,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        console.error("Resend error", txt);
      }
    } else {
      console.warn("RESEND_API_KEY not set — skipping email send");
    }

    // In-app notification if customer has an account
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", customer.email)
      .maybeSingle();
    if (profile?.id) {
      await admin.from("homeowner_notifications").insert({
        user_id: profile.id,
        type: "broadcast_message",
        title: "New contractor message",
        message: `${contractor.company_name ?? "A contractor"} reached out about your ${trade} request.`,
        related_table: "broadcast_conversations",
        related_id: conversation_id,
      });
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return json({ error: e.message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}
