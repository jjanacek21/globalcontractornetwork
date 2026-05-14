import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    if (!token && (req.method === "POST")) {
      const body = await req.json().catch(() => ({}));
      token = body.token;
    }
    if (!token) return json({ error: "token required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: t, error } = await admin
      .from("broadcast_consent_tokens")
      .select("token, conversation_id, action, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (error || !t) return json({ error: "Invalid token" }, 404);
    if (t.used_at) return json({ ok: true, action: t.action, already: true });
    if (new Date(t.expires_at).getTime() < Date.now()) return json({ error: "Token expired" }, 410);

    const updates: Record<string, unknown> =
      t.action === "accept"
        ? { customer_consent: true, consent_at: new Date().toISOString(), customer_declined: false }
        : { customer_declined: true };

    await admin.from("broadcast_conversations").update(updates).eq("id", t.conversation_id);
    await admin.from("broadcast_consent_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);

    // Drop a system message in the thread
    await admin.from("broadcast_messages").insert({
      conversation_id: t.conversation_id,
      sender_type: "system",
      sender_id: null,
      content:
        t.action === "accept"
          ? "Customer accepted contact. Contact details unlocked."
          : "Customer declined further messages.",
    });

    return json({ ok: true, action: t.action });
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
