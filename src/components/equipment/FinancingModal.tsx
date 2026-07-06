import { useState, FormEvent, useEffect } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Set this to your financing partner's URL to auto-redirect on submit. */
export const FINANCING_PARTNER_URL = "";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255),
  time_in_business: z.string().min(1),
  amount: z.coerce.number().min(500).max(500000),
  equipment: z.string().trim().max(500).optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  prefillAmount?: number;
  prefillEquipment?: string;
}

export function FinancingModal({ open, onClose, prefillAmount, prefillEquipment }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const amountCents = Math.round(parsed.data.amount * 100);
      const { error } = await supabase.from("financing_leads").insert({
        name: parsed.data.name,
        company: parsed.data.company || null,
        phone: parsed.data.phone,
        email: parsed.data.email,
        time_in_business: parsed.data.time_in_business,
        amount_cents: amountCents,
        equipment: parsed.data.equipment || null,
        source: "modal",
      });
      if (error) throw error;
      toast.success("Application received — a financing specialist will call you within one business hour.");
      if (FINANCING_PARTNER_URL) {
        window.location.href = `${FINANCING_PARTNER_URL}?amount=${parsed.data.amount}`;
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not submit application. Please try again.");
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
          <h2 className="eq-heading text-xl">Apply for Financing</h2>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="eq-panel p-3 text-xs eq-text-2 leading-relaxed">
            Soft credit pull to see offers — <span className="eq-text font-semibold">does not affect your score.</span>
            Lenders compete; most decisions same day.
          </div>

          <FField label="Name" name="name" error={errors.name} />
          <FField label="Company" name="company" error={errors.company} />
          <div className="grid grid-cols-2 gap-3">
            <FField label="Phone" name="phone" type="tel" error={errors.phone} />
            <FField label="Email" name="email" type="email" error={errors.email} />
          </div>

          <div>
            <label className="eq-label" htmlFor="time_in_business">Time in Business</label>
            <select id="time_in_business" name="time_in_business" className="eq-input" defaultValue="">
              <option value="" disabled>Select…</option>
              <option>Startup (&lt;1 yr)</option>
              <option>1–2 years</option>
              <option>2–5 years</option>
              <option>5+ years</option>
            </select>
            {errors.time_in_business && <p className="eq-mono text-xs text-red-400 mt-1">{errors.time_in_business}</p>}
          </div>

          <FField label="Equipment Amount ($)" name="amount" type="number" defaultValue={prefillAmount?.toString()} error={errors.amount} />
          <FField label="Financing (equipment / order)" name="equipment" defaultValue={prefillEquipment} error={errors.equipment} />

          <button type="submit" className="eq-btn eq-btn-primary w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FField({
  label, name, type = "text", error, defaultValue,
}: { label: string; name: string; type?: string; error?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="eq-label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className="eq-input" />
      {error && <p className="eq-mono text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
