import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GreenButton3D } from "@/components/referrals/ui/primitives";
import { X, AlertTriangle } from "lucide-react";

export function AddClientModal({ open, onClose, contractorId }: { open: boolean; onClose: () => void; contractorId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  if (!open) return null;

  const submit = async () => {
    if (!form.name || !form.email) {
      toast({ title: "Missing fields", description: "Name and email required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: existing } = await supabase.from("gcn_customers").select("id").eq("email", form.email).maybeSingle();
      let customerId = existing?.id;
      if (!customerId) {
        const { data: created, error } = await supabase.from("gcn_customers")
          .insert({ email: form.email, name: form.name, phone: form.phone, property_address: form.address ? { street: form.address } : null })
          .select("id").single();
        if (error) throw error;
        customerId = created.id;
      }
      const { error: poolErr } = await supabase.from("client_pool").insert({
        customer_id: customerId, introducing_contractor_id: contractorId,
        invitation_status: "pending", invitation_sent_at: new Date().toISOString(),
      });
      if (poolErr) throw poolErr;
      toast({ title: "Invite sent", description: `Invite sent to ${form.email} — they'll appear in your pool when they accept.` });
      qc.invalidateQueries({ queryKey: ["referrals"] });
      onClose();
      setForm({ name: "", email: "", phone: "", address: "" });
    } catch (err: any) {
      toast({ title: "Could not add client", description: err.message ?? "Try again.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="brand-card max-w-md w-full referrals-dashboard" onClick={e => e.stopPropagation()} style={{ background: "var(--r-paper)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--r-line)" }}>
          <h3 className="font-serif-display text-xl font-semibold" style={{ color: "var(--r-green-deep)" }}>Add Client to Pool</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {(["name","email","phone","address"] as const).map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>
                {k === "name" ? "Name *" : k === "email" ? "Email *" : k === "phone" ? "Phone" : "Property Address"}
              </label>
              <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] text-sm"
                style={{ background: "var(--r-cream-2)", border: "1px solid var(--r-line)" }} />
            </div>
          ))}
          <div className="p-3 rounded-lg flex gap-2 text-xs" style={{ background: "rgba(183,131,28,0.12)", color: "var(--r-amber)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Customer receives an invite email and must accept to confirm attribution. Until then, no residuals are tracked.
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2" style={{ borderColor: "var(--r-line)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-[10px]" style={{ color: "var(--r-muted)" }}>Cancel</button>
          <GreenButton3D onClick={submit} disabled={submitting}>{submitting ? "Sending…" : "Send Invite"}</GreenButton3D>
        </div>
      </div>
    </div>
  );
}
