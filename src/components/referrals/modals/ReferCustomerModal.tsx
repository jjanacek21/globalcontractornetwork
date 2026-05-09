import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GreenButton3D, fmtMoney } from "@/components/referrals/ui/primitives";
import { X } from "lucide-react";

export function ReferCustomerModal({
  open, onClose, contractorId, prefilledPartner, partners,
}: {
  open: boolean; onClose: () => void; contractorId: string;
  prefilledPartner?: any; partners: any[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", trade: "",
    receivingId: "", contractValue: "", notes: "",
  });

  useEffect(() => {
    if (prefilledPartner) {
      setForm(f => ({ ...f, receivingId: prefilledPartner.id, trade: prefilledPartner.category ?? "" }));
    }
  }, [prefilledPartner]);

  if (!open) return null;

  const selectedPartner = partners.find(p => p.id === form.receivingId);
  const cv = Number(form.contractValue) || 0;
  const matchingTier = selectedPartner?.tiers?.find((t: any) =>
    cv >= Number(t.min_contract_value) && (!t.max_contract_value || cv <= Number(t.max_contract_value))
  ) ?? selectedPartner?.tiers?.[0];
  const bounty = matchingTier
    ? matchingTier.bounty_type === "percent" ? cv * Number(matchingTier.bounty_amount) / 100 : Number(matchingTier.bounty_amount)
    : 0;
  const referrerShare = bounty * 0.75;

  const submit = async () => {
    if (!form.name || !form.email || !form.receivingId || !form.trade) {
      toast({ title: "Missing fields", description: "Name, email, partner and trade are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
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
      const { error } = await supabase.from("referrals").insert({
        referring_contractor_id: contractorId,
        receiving_contractor_id: form.receivingId,
        customer_id: customerId,
        trade: form.trade,
        service_description: form.notes || null,
        contract_value: cv || null,
        bounty_amount: bounty || null,
        referrer_share: referrerShare || null,
        gcn_share: bounty * 0.25 || null,
        status: "in_progress",
      });
      if (error) throw error;
      toast({ title: "Referral sent", description: `${form.name} has been referred.` });
      qc.invalidateQueries({ queryKey: ["referrals"] });
      onClose();
      setForm({ name: "", email: "", phone: "", address: "", trade: "", receivingId: "", contractValue: "", notes: "" });
    } catch (err: any) {
      toast({ title: "Could not submit", description: err.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="brand-card max-w-lg w-full max-h-[90vh] overflow-y-auto referrals-dashboard" onClick={e => e.stopPropagation()}
        style={{ background: "var(--r-paper)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--r-line)" }}>
          <h3 className="font-serif-display text-xl font-semibold" style={{ color: "var(--r-green-deep)" }}>Refer a Customer</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Customer Name *"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email *"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Property Address"><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Refer To *">
              <select value={form.receivingId} onChange={e => setForm({ ...form, receivingId: e.target.value })} className={inputCls}>
                <option value="">Select partner…</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.company_name} — {p.category}</option>)}
              </select>
            </Field>
            <Field label="Trade *">
              <input value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} className={inputCls} placeholder="e.g. Roofing" />
            </Field>
          </div>
          <Field label="Estimated Contract Value">
            <input type="number" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} className={inputCls} placeholder="$" />
          </Field>
          <Field label="Notes"><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></Field>

          {bounty > 0 && (
            <div className="p-3 rounded-lg" style={{ background: "var(--r-cream-2)", border: "1px solid rgba(201,162,74,0.4)" }}>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>Estimated payout if closed</div>
              <div className="text-2xl font-bold gold-text-3d font-serif-display">{fmtMoney(referrerShare)}</div>
              <div className="text-xs" style={{ color: "var(--r-muted)" }}>75% of {fmtMoney(bounty)} bounty</div>
            </div>
          )}
        </div>
        <div className="p-5 border-t flex justify-end gap-2" style={{ borderColor: "var(--r-line)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-[10px]" style={{ color: "var(--r-muted)" }}>Cancel</button>
          <GreenButton3D onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Send Referral"}</GreenButton3D>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-[10px] text-sm";
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
