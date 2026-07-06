import { useState } from "react";
import { monthlyPayment, fmtUSDPrecise } from "@/lib/equipment/finance";
import { FinancingModal } from "./FinancingModal";

const TERMS = [24, 36, 48, 60];

export function PaymentCalculator() {
  const [amount, setAmount] = useState(15000);
  const [months, setMonths] = useState(60);
  const [showApp, setShowApp] = useState(false);

  const monthly = monthlyPayment(amount * 100, months);

  return (
    <div className="eq-plate p-6 md:p-8">
      <h3 className="eq-heading text-xl">Payment Calculator</h3>
      <p className="eq-mono text-xs eq-text-2 mt-1 uppercase">Estimate at 12.9% APR</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="eq-label" htmlFor="calc-amount">Equipment Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 eq-text-2 eq-mono">$</span>
            <input
              id="calc-amount"
              type="number"
              min={500}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="eq-input pl-7 text-lg"
            />
          </div>
        </div>

        <div>
          <span className="eq-label">Term</span>
          <div className="grid grid-cols-4 gap-2">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMonths(t)}
                className={`py-2 rounded eq-mono text-sm border transition-colors ${
                  months === t
                    ? "border-[var(--eq-orange)] bg-[var(--eq-orange)]/10 eq-orange"
                    : "border-[var(--eq-line)] eq-text-2 hover:border-[var(--eq-text-2)]"
                }`}
              >
                {t} mo
              </button>
            ))}
          </div>
        </div>

        <div className="eq-panel p-5 text-center">
          <div className="eq-mono text-xs eq-text-2 uppercase tracking-wider">Estimated Payment</div>
          <div className="eq-heading text-5xl md:text-6xl eq-orange mt-2">
            {fmtUSDPrecise(monthly)}
          </div>
          <div className="eq-mono text-xs eq-text-2 mt-1">per month</div>
        </div>

        <button className="eq-btn eq-btn-primary w-full" onClick={() => setShowApp(true)}>
          Apply for Financing
        </button>

        <p className="eq-mono text-[0.65rem] eq-text-2 text-center">
          *Estimate at 12.9% APR for illustration; actual rate set by lender.
        </p>
      </div>

      <FinancingModal
        open={showApp}
        onClose={() => setShowApp(false)}
        prefillAmount={amount}
      />
    </div>
  );
}
