import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GreenButton3D, fmtMoney, TierBadge, GoldText3D } from "@/components/referrals/ui/primitives";
import { X, Users, User } from "lucide-react";

const REFERRER_SHARE = 0.70; // 70% to referrer
const GCN_SHARE = 0.30;      // 30% to GCN

type Mode = "single" | "broadcast";

export function ReferCustomerModal({
  open, onClose, contractorId, prefilledPartner, partners,
}: {
  open: boolean; onClose: () => void; contractorId: string;
  prefilledPartner?: any; partners: any[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("single");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", trade: "",
    receivingId: "", contractValue: "", notes: "",
  });

  useEffect(() => {
    if (prefilledPartner) {
      setMode("single");
      setForm(f => ({ ...f, receivingId: prefilledPartner.id, trade: prefilledPartner.category ?? "" }));
    }
  }, [prefilledPartner]);

  // Trades available across the partner network
  const allTrades = useMemo(() => {
    const set = new Set<string>();
    (partners ?? []).forEach((p: any) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [partners]);

  const cv = Number(form.contractValue) || 0;

  // Helper: best matching tier and bounty for a partner at the entered contract value
  const partnerBounty = (p: any) => {
    const t = p?.tiers?.find((t: any) =>
      cv >= Number(t.min_contract_value) && (!t.max_contract_value || cv <= Number(t.max_contract_value))
    ) ?? p?.tiers?.[0];
    if (!t) return 0;
    return t.bounty_type === "percent" ? cv * Number(t.bounty_amount) / 100 : Number(t.bounty_amount);
  };

  // Filter + rank partners that perform the selected trade
  const trade = form.trade.trim().toLowerCase();
  const tradeMatched = useMemo(() => {
    if (!trade) return [] as any[];
    const matches = (partners ?? []).filter((p: any) =>
      (p.category ?? "").toLowerCase().includes(trade) ||
      (p.tiers ?? []).some((t: any) => (t.trade ?? "").toLowerCase().includes(trade))
    );
    return matches
      .map((p: any) => ({ ...p, _bounty: partnerBounty(p), _score: Number(p.score?.score ?? 0) }))
      .sort((a: any, b: any) => (b._score - a._score) || (b._bounty - a._bounty));
  }, [partners, trade, cv]);

  if (!open) return null;

  const selectedPartner = tradeMatched.find((p: any) => p.id === form.receivingId);
  const singleBounty = selectedPartner?._bounty ?? 0;
  const referrerShareSingle = singleBounty * REFERRER_SHARE;

  // For broadcast: top 3 estimated bounty (use median of top 3 as the headline number)
  const top3 = tradeMatched.slice(0, 3);
  const broadcastBounty = top3.length > 0 ? top3.reduce((s, p) => s + p._bounty, 0) / top3.length : 0;
  const referrerShareBroadcast = broadcastBounty * REFERRER_SHARE;

  const submit = async () => {
    if (!form.name || !form.email || !form.trade) {
      toast({ title: "Missing fields", description: "Customer name, email and trade are required.", variant: "destructive" });
      return;
    }
    if (mode === "single" && !form.receivingId) {
      toast({ title: "Pick a partner", description: "Select a partner to refer to, or switch to Broadcast mode.", variant: "destructive" });
      return;
    }
    if (mode === "broadcast" && top3.length === 0) {
      toast({ title: "No partners", description: "No partners match this trade yet. Try Single mode or a different trade.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Find or create the customer
      const { data: existing } = await supabase
        .from("gcn_customers").select("id").eq("email", form.email).maybeSingle();
      let customerId = existing?.id;
      if (!customerId) {
        const { data: created, error: cErr } = await supabase
          .from("gcn_customers")
          .insert({ email: form.email, name: form.name, phone: form.phone, property_address: form.address ? { street: form.address } : null })
          .select("id").single();
        if (cErr) throw cErr;
        customerId = created.id;
      }

      if (mode === "single") {
        const { error } = await supabase.from("referrals").insert({
          referring_contractor_id: contractorId,
          receiving_contractor_id: form.receivingId,
          customer_id: customerId,
          trade: form.trade,
          service_description: form.notes || null,
          contract_value: cv || null,
          bounty_amount: singleBounty || null,
          referrer_share: referrerShareSingle || null,
          gcn_share: singleBounty * GCN_SHARE || null,
          status: "in_progress",
        });
        if (error) throw error;
        toast({ title: "Referral sent", description: `${form.name} has been referred.` });
      } else {
        const { error } = await supabase.from("referral_broadcasts").insert({
          referring_contractor_id: contractorId,
          customer_id: customerId,
          trade: form.trade,
          service_area: form.address || null,
          contract_value: cv || null,
          estimated_bounty: broadcastBounty || null,
          notes: form.notes || null,
          max_claims: 3,
          status: "open",
        });
        if (error) throw error;
        // Lifetime binding: trigger pay_introducer_residual fires off referrals.status='won',
        // but bind_customer_to_introducer only fires on referrals insert. For broadcasts
        // (no referral row yet), we bind manually so the customer is locked to this contractor.
        await supabase.from("client_pool").upsert(
          { customer_id: customerId, introducing_contractor_id: contractorId, invitation_status: "pending" as any, last_activity_at: new Date().toISOString() },
          { onConflict: "customer_id", ignoreDuplicates: true } as any,
        );
        toast({ title: "Broadcast sent", description: `Top 3 ${form.trade} contractors will see this lead.` });
      }

      qc.invalidateQueries({ queryKey: ["referrals"] });
      onClose();
      setForm({ name: "", email: "", phone: "", address: "", trade: "", receivingId: "", contractValue: "", notes: "" });
      setMode("single");
    } catch (err: any) {
      toast({ title: "Could not submit", description: err.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="brand-card max-w-xl w-full max-h-[90vh] overflow-y-auto referrals-dashboard" onClick={e => e.stopPropagation()}
        style={{ background: "var(--r-paper)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--r-line)" }}>
          <h3 className="font-serif-display text-xl font-semibold" style={{ color: "var(--r-green-deep)" }}>Refer a Customer</h3>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-[10px]" style={{ background: "var(--r-cream-2)", border: "1px solid var(--r-line)" }}>
            <button
              type="button"
              onClick={() => setMode("single")}
              className="flex items-center justify-center gap-2 py-2 rounded-[8px] text-sm font-semibold transition-colors"
              style={mode === "single"
                ? { background: "var(--r-green-deep)", color: "var(--r-cream)" }
                : { color: "var(--r-green-deep)" }}
            >
              <User className="w-4 h-4" /> Send to one partner
            </button>
            <button
              type="button"
              onClick={() => setMode("broadcast")}
              className="flex items-center justify-center gap-2 py-2 rounded-[8px] text-sm font-semibold transition-colors"
              style={mode === "broadcast"
                ? { background: "var(--r-green-deep)", color: "var(--r-cream)" }
                : { color: "var(--r-green-deep)" }}
            >
              <Users className="w-4 h-4" /> Broadcast to top 3
            </button>
          </div>

          <Field label="Customer Name *"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email *"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Property Address"><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Trade Needed *">
              <input
                list="all-trades"
                value={form.trade}
                onChange={e => setForm({ ...form, trade: e.target.value, receivingId: "" })}
                className={inputCls}
                placeholder="e.g. Roofing"
              />
              <datalist id="all-trades">
                {allTrades.map(t => <option key={t} value={t} />)}
              </datalist>
            </Field>
            <Field label="Estimated Contract Value">
              <input type="number" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} className={inputCls} placeholder="$" />
            </Field>
          </div>

          {/* Trade-matched partner picker (single mode only) */}
          {mode === "single" && form.trade && (
            <div>
              <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>
                Choose a partner — sorted by rating &amp; bounty
              </div>
              {tradeMatched.length === 0 ? (
                <div className="p-4 rounded-[10px] text-sm" style={{ background: "var(--r-cream-2)", color: "var(--r-muted)" }}>
                  No verified contractors match "{form.trade}" yet. Try Broadcast mode or refine the trade.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tradeMatched.map((p: any) => {
                    const selected = form.receivingId === p.id;
                    const yourCut = p._bounty * REFERRER_SHARE;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setForm({ ...form, receivingId: p.id })}
                        className="w-full text-left p-3 rounded-[10px] transition-colors"
                        style={{
                          background: selected ? "var(--r-green-deep)" : "var(--r-cream-2)",
                          color: selected ? "var(--r-cream)" : "inherit",
                          border: `1px solid ${selected ? "var(--r-green-deep)" : "var(--r-line)"}`,
                        }}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{p.company_name}</div>
                            <div className="text-xs opacity-80 truncate">{p.category} · {p.service_area ?? "—"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-80">Rating</div>
                            <div className="font-bold">{p.score?.score ?? "—"}</div>
                            {p.score?.tier && !selected && <div className="mt-1"><TierBadge tier={p.score.tier} /></div>}
                          </div>
                        </div>
                        {p._bounty > 0 && (
                          <div className="mt-2 text-xs flex justify-between" style={{ opacity: 0.9 }}>
                            <span>Pays {fmtMoney(p._bounty)}</span>
                            <span className="font-semibold">You keep {fmtMoney(yourCut)}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Broadcast preview */}
          {mode === "broadcast" && form.trade && (
            <div className="p-3 rounded-[10px]" style={{ background: "var(--r-cream-2)", border: "1px solid var(--r-line)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--r-muted)" }}>
                Top 3 will see this lead — first to message wins
              </div>
              {top3.length === 0 ? (
                <div className="text-sm" style={{ color: "var(--r-muted)" }}>No partners match yet.</div>
              ) : (
                <ul className="space-y-1">
                  {top3.map((p: any) => (
                    <li key={p.id} className="flex justify-between text-xs">
                      <span className="font-semibold" style={{ color: "var(--r-green-deep)" }}>{p.company_name}</span>
                      <span style={{ color: "var(--r-muted)" }}>Rating {p.score?.score ?? "—"} · {p._bounty > 0 ? fmtMoney(p._bounty) : "no published bounty"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Field label="Notes"><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></Field>

          {/* Estimated payout */}
          {((mode === "single" && singleBounty > 0) || (mode === "broadcast" && broadcastBounty > 0)) && (
            <div className="p-3 rounded-lg" style={{ background: "var(--r-cream-2)", border: "1px solid rgba(201,162,74,0.4)" }}>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>
                Estimated payout if closed
              </div>
              <GoldText3D className="text-2xl font-bold font-serif-display block mt-1">
                {fmtMoney(mode === "single" ? referrerShareSingle : referrerShareBroadcast)}
              </GoldText3D>
              <div className="text-xs" style={{ color: "var(--r-muted)" }}>
                70% of {fmtMoney(mode === "single" ? singleBounty : broadcastBounty)} bounty · GCN takes 30%
              </div>
            </div>
          )}

          <div className="text-xs italic" style={{ color: "var(--r-muted)" }}>
            This customer will be tied to you forever. Any future job they do on the network earns you a residual.
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-2" style={{ borderColor: "var(--r-line)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-[10px]" style={{ color: "var(--r-muted)" }}>Cancel</button>
          <GreenButton3D onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : mode === "single" ? "Send Referral" : "Broadcast to Top 3"}
          </GreenButton3D>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-[10px] text-sm bg-transparent outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>{label}</label>
      <div style={{ background: "var(--r-cream-2)", border: "1px solid var(--r-line)", borderRadius: 10 }}>
        {children}
      </div>
    </div>
  );
}
