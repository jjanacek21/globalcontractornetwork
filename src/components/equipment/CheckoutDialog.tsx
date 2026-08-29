import { useState, useEffect, FormEvent } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useEquipmentCart, PayMode } from "@/hooks/useEquipmentCart";
import { fmtUSD } from "@/lib/equipment/finance";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().min(7, "Required").max(30),
  email: z.string().trim().email().max(255),
  address: z.string().trim().min(1, "Required").max(255),
  zip: z.string().trim().min(3).max(12),
  payment_method: z.enum(["card", "ach_wire", "financing"]),
});

interface Props {
  open: boolean;
  onClose: () => void;
  payMode: PayMode;
}

export function CheckoutDialog({ open, onClose, payMode }: Props) {
  const { items, subtotalCents, memberDiscountCents, isMember, dueTodayCents, balanceCents, clear } = useEquipmentCart();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNo: string; due: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setSuccess(null);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const due = dueTodayCents(payMode);
      const balance = balanceCents(payMode);
      const { data: order, error: orderErr } = await supabase
        .from("equipment_orders")
        .insert({
          name: parsed.data.name,
          company: parsed.data.company || null,
          phone: parsed.data.phone,
          email: parsed.data.email,
          address: parsed.data.address,
          zip: parsed.data.zip,
          pay_mode: payMode,
          payment_method: parsed.data.payment_method,
          subtotal_cents: subtotalCents,
          is_member_order: isMember,
          member_discount_cents: memberDiscountCents,
          deposit_due_cents: due,
          balance_cents: balance,
        })
        .select("id, order_no")
        .single();

      if (orderErr || !order) throw orderErr || new Error("Order failed");

      const { error: itemsErr } = await supabase.from("equipment_order_items").insert(
        items.map((it) => ({
          order_id: order.id,
          product_id: it.id,
          qty: it.qty,
  unit_price_cents: isMember
            ? Math.round(it.unit_price_cents * 0.85)
            : it.unit_price_cents,
        }))
      );
      if (itemsErr) throw itemsErr;

      // If financing, also drop a financing lead
      if (parsed.data.payment_method === "financing") {
        await supabase.from("financing_leads").insert({
          name: parsed.data.name,
          company: parsed.data.company || null,
          phone: parsed.data.phone,
          email: parsed.data.email,
          amount_cents: due,
          equipment: items.map((i) => `${i.qty}× ${i.name}`).join(", "),
          source: "checkout",
        });
      }

      setSuccess({ orderNo: order.order_no, due });
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Could not submit order. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--eq-card)] border eq-hairline rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b eq-hairline sticky top-0 bg-[var(--eq-card)]">
          <h2 className="eq-heading text-xl">
            {success ? "Order Received" : "Complete Order"}
          </h2>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </header>

        {success ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 eq-green" />
              <div>
                <p className="eq-heading text-lg">Order {success.orderNo}</p>
                <p className="eq-mono text-sm eq-text-2">Amount due today: {fmtUSD(success.due)}</p>
              </div>
            </div>
            <div className="eq-panel p-4 text-sm eq-text-2 leading-relaxed">
              A written sales order with build spec, serials, and ship window follows within 24 hours.
              Payment and freight quote instructions will be emailed shortly. Covered by our 30-day
              money-back guarantee: if quality or specs don't match what we published or the Graco/Titan
              counterpart, return it for a full refund.
            </div>
            <button className="eq-btn eq-btn-primary w-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <Field label="Name" name="name" error={errors.name} />
            <Field label="Company" name="company" error={errors.company} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" name="phone" type="tel" error={errors.phone} />
              <Field label="Email" name="email" type="email" error={errors.email} />
            </div>
            <Field label="Delivery Address" name="address" error={errors.address} />
            <Field label="ZIP" name="zip" error={errors.zip} />

            <div>
              <label className="eq-label" htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                className="eq-input"
                defaultValue="ach_wire"
              >
                <option value="card">Card</option>
                <option value="ach_wire">ACH / Wire</option>
                <option value="financing">Financing — apply after order</option>
              </select>
            </div>

            {isMember && memberDiscountCents > 0 && (
              <div className="eq-panel p-3 flex justify-between eq-mono text-sm text-primary">
                <span className="uppercase text-xs">Member discount −15%</span>
                <span className="font-bold">−{fmtUSD(memberDiscountCents)}</span>
              </div>
            )}
            <div className="eq-panel p-3 flex justify-between eq-mono text-sm">
              <span className="eq-text-2 uppercase text-xs">Due today</span>
              <span className="font-bold eq-orange">{fmtUSD(dueTodayCents(payMode))}</span>
            </div>

            <button type="submit" className="eq-btn eq-btn-primary w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Place Order"}
            </button>
            <p className="eq-mono text-[0.65rem] text-primary text-center uppercase">
              30-day money-back guarantee — full refund if quality or specs don't match
            </p>
            <p className="eq-mono text-[0.65rem] eq-text-2 text-center uppercase">
              Written sales order with build spec, serials & ship window follows within 24 hrs.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: { label: string; name: string; type?: string; error?: string }) {
  return (
    <div>
      <label className="eq-label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="eq-input" autoComplete="on" />
      {error && <p className="eq-mono text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
