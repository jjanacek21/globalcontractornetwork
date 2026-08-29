import { useState } from "react";
import { useEquipmentCart, PayMode } from "@/hooks/useEquipmentCart";
import { fmtUSD } from "@/lib/equipment/finance";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { CheckoutDialog } from "./CheckoutDialog";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotalCents, listSubtotalCents, memberDiscountCents, isMember, dueTodayCents, balanceCents, btoSubtotalCents } = useEquipmentCart();
  const [payMode, setPayMode] = useState<PayMode>("deposit");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const hasBto = btoSubtotalCents > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isOpen}
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Cart"
        aria-modal="true"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[var(--eq-carbon)] border-l eq-hairline transform transition-transform duration-200 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b eq-hairline">
          <h2 className="eq-heading text-xl">Your Order</h2>
          <button onClick={close} aria-label="Close cart" className="p-2 rounded hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center eq-text-2">
              <p className="eq-mono text-sm uppercase tracking-wider">Cart is empty</p>
            </div>
          ) : (
            <ul className="divide-y eq-hairline">
              {items.map((it) => (
                <li key={it.id} className="p-4">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="eq-heading text-base leading-tight">{it.name}</p>
                      {it.bto && <span className="eq-badge eq-badge-amber mt-2">BTO · 6–8 wks</span>}
                    </div>
                    <button
                      onClick={() => remove(it.id)}
                      aria-label={`Remove ${it.name}`}
                      className="p-1 eq-text-2 hover:eq-orange"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center gap-0 border eq-hairline rounded overflow-hidden">
                      <button
                        onClick={() => setQty(it.id, it.qty - 1)}
                        className="px-2 py-1 hover:bg-white/5"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="eq-mono px-3 text-sm">{it.qty}</span>
                      <button
                        onClick={() => setQty(it.id, it.qty + 1)}
                        className="px-2 py-1 hover:bg-white/5"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="eq-mono font-semibold">
                      {fmtUSD(it.unit_price_cents * it.qty)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t eq-hairline p-5 space-y-4">
            {/* Pay mode */}
            {hasBto && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayMode("deposit")}
                  className={`text-left p-3 rounded border transition-colors ${
                    payMode === "deposit"
                      ? "border-[var(--eq-orange)] bg-[var(--eq-orange)]/5"
                      : "border-[var(--eq-line)] hover:border-[var(--eq-text-2)]"
                  }`}
                >
                  <div className="eq-heading text-xs">50% Deposit</div>
                  <div className="eq-mono text-base font-bold mt-1">
                    {fmtUSD(dueTodayCents("deposit"))}
                  </div>
                  <div className="eq-mono text-[0.65rem] eq-text-2 uppercase mt-1">today</div>
                </button>
                <button
                  onClick={() => setPayMode("full")}
                  className={`text-left p-3 rounded border transition-colors ${
                    payMode === "full"
                      ? "border-[var(--eq-orange)] bg-[var(--eq-orange)]/5"
                      : "border-[var(--eq-line)] hover:border-[var(--eq-text-2)]"
                  }`}
                >
                  <div className="eq-heading text-xs">Pay Full · −3%</div>
                  <div className="eq-mono text-base font-bold mt-1">
                    {fmtUSD(dueTodayCents("full"))}
                  </div>
                  <div className="eq-mono text-[0.65rem] eq-text-2 uppercase mt-1">today</div>
                </button>
              </div>
            )}

            <div className="eq-panel p-4 space-y-2 eq-mono text-sm">
              <div className="flex justify-between">
                <span className="eq-text-2 uppercase text-xs">Subtotal</span>
                <span>{fmtUSD(listSubtotalCents)}</span>
              </div>
              {isMember && memberDiscountCents > 0 && (
                <div className="flex justify-between text-primary">
                  <span className="uppercase text-xs">Member discount −15%</span>
                  <span>−{fmtUSD(memberDiscountCents)}</span>
                </div>
              )}
              {isMember && (
                <div className="flex justify-between">
                  <span className="eq-text-2 uppercase text-xs">Member total</span>
                  <span>{fmtUSD(subtotalCents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="eq-text-2 uppercase text-xs">Freight</span>
                <span className="text-xs eq-text-2">Quoted by ZIP at confirmation</span>
              </div>

              <div className="border-t eq-hairline my-2" />
              <div className="flex justify-between">
                <span className="eq-heading text-sm">Due today</span>
                <span className="text-lg font-bold eq-orange">{fmtUSD(dueTodayCents(payMode))}</span>
              </div>
              {payMode === "deposit" && balanceCents("deposit") > 0 && (
                <div className="flex justify-between text-xs eq-text-2">
                  <span>Balance before dispatch</span>
                  <span>{fmtUSD(balanceCents("deposit"))}</span>
                </div>
              )}
              {payMode === "full" && (
                <div className="text-xs eq-green text-right">−3% discount applied</div>
              )}
            </div>

            <button
              className="eq-btn eq-btn-primary w-full"
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout
            </button>
            <p className="eq-mono text-[0.65rem] eq-text-2 text-center uppercase">
              30-day money-back guarantee
            </p>
          </footer>
        )}

      </aside>

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        payMode={payMode}
      />
    </>
  );
}
