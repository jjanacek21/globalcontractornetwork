import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EquipmentCartProvider, useEquipmentCart } from "@/hooks/useEquipmentCart";
import { ProductCard, EquipmentProduct } from "@/components/equipment/ProductCard";
import { CartDrawer } from "@/components/equipment/CartDrawer";
import { PaymentCalculator } from "@/components/equipment/PaymentCalculator";
import { FAQ } from "@/components/equipment/FAQ";
import { FinancingModal } from "@/components/equipment/FinancingModal";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";
import "@/styles/equipment.css";

const TICKER = [
  { v: "7,200 PSI", l: "GH 933-class hydraulic power" },
  { v: "GX390", l: "Honda engines — not clones" },
  { v: "100%", l: "Graco-interchangeable wear parts" },
  { v: "50%", l: "Deposit locks your build slot" },
  { v: "6–8 WK", l: "Factory build + QC + freight" },
  { v: "SAME DAY", l: "US parts stock ships" },
];

function CartButton() {
  const { itemCount, open } = useEquipmentCart();
  return (
    <button
      onClick={open}
      className="relative eq-btn eq-btn-ghost !py-2 !px-3"
      aria-label={`Cart (${itemCount})`}
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="eq-mono text-sm">Cart</span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[var(--eq-orange)] text-black eq-mono text-[0.65rem] font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}

function EquipmentStoreInner() {
  const [products, setProducts] = useState<EquipmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [financingOpen, setFinancingOpen] = useState(false);
  const { isAdmin } = useIsEquipmentAdmin();

  useEffect(() => {
    (async () => {
      // Admins fetch cost_cents from the base table; public users read the public-safe view.
      const source = isAdmin ? "equipment_products" : "equipment_products_public";
      const { data, error } = await supabase
        .from(source)
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data) setProducts(data as EquipmentProduct[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  const rigs = products.filter((p) => p.type === "rig");
  const parts = products.filter((p) => p.type === "part");

  return (
    <div className="equipment-scope">
      {/* Announcement bar */}
      <div style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(152 45% 22%))" }} className="text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-2 eq-mono text-[0.72rem] md:text-xs font-semibold uppercase text-center leading-tight">
          Financing available — rigs from $149/mo · US parts stock ships same day · Built-to-order rigs 6–8 weeks
        </div>
      </div>

      {/* Header */}
      <header className="border-b eq-hairline sticky top-0 z-30 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="eq-heading text-2xl md:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">The GCN Store</span>
            <span className="eq-mono text-[0.6rem] eq-text-2 uppercase hidden sm:inline">
              Global Contractor Network
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6 eq-mono text-xs uppercase eq-text-2">
            <a href="#rigs" className="hover:text-primary transition-colors">Spray Rigs</a>
            <a href="#parts" className="hover:text-primary transition-colors">Parts & Guns</a>
            <a href="#how" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#financing" className="hover:text-primary transition-colors">Financing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>
          <CartButton />
        </div>
      </header>


      {/* Hero */}
      <section id="top" className="border-b eq-hairline">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <p className="eq-mono text-xs eq-orange uppercase tracking-widest">
            Commercial Spray Equipment · Silicone / SPF / Coatings
          </p>
          <h1 className="eq-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-4 max-w-5xl">
            Graco-class output.<br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">Half the invoice.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base md:text-lg eq-text-2 leading-relaxed">
            Honda GX power. Graco/Titan-interchangeable wear parts. Deposit-funded builds shipped in 6–8 weeks with US parts stock backing every serial number.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#rigs" className="eq-btn eq-btn-primary">
              Shop Spray Rigs <ArrowRight className="h-4 w-4" />
            </a>
            <button className="eq-btn eq-btn-ghost" onClick={() => setFinancingOpen(true)}>
              Get Monthly Pricing
            </button>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t eq-hairline bg-black/30 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex">
            {TICKER.map((t, i) => (
              <div key={i} className="eq-ticker-cell flex-1 min-w-[160px]">
                <div className="eq-mono text-lg md:text-xl font-bold eq-text">{t.v}</div>
                <div className="eq-mono text-[0.62rem] eq-text-2 uppercase mt-1 leading-tight">
                  {t.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rigs */}
      <section id="rigs" className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="eq-badge eq-badge-amber">Built to order · 6–8 weeks</span>
            <h2 className="eq-heading text-4xl md:text-5xl mt-3">Spray Rigs</h2>
          </div>
          <p className="eq-mono text-xs eq-text-2 uppercase max-w-sm text-right">
            Deposit locks your factory build slot
          </p>
        </div>
        {loading ? (
          <p className="eq-mono eq-text-2">Loading catalog…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rigs.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Parts */}
      <section id="parts" className="max-w-7xl mx-auto px-4 py-16 border-t eq-hairline">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="eq-badge eq-badge-green">In stock · ships today</span>
            <h2 className="eq-heading text-4xl md:text-5xl mt-3">Parts & Guns</h2>
          </div>
          <p className="eq-mono text-xs eq-text-2 uppercase max-w-sm text-right">
            US warehouse stock · same-day dispatch
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t eq-hairline bg-black/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="eq-heading text-4xl md:text-5xl mb-10">
            How Built-to-Order Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Lock your slot",
                d: "50% deposit — or pay in full for 3% off. Deposit funds the factory line so your rig hits the bench.",
              },
              {
                n: "02",
                t: "Build & QC",
                d: "Pressure-tested and serial-tagged. Build photos and test sheet sent to you before it ships.",
              },
              {
                n: "03",
                t: "Freight to your shop",
                d: "Balance due before dispatch. LTL with liftgate. Total lead time 6–8 weeks.",
              },
            ].map((s) => (
              <div key={s.n} className="eq-plate p-6">
                <div className="eq-mono text-4xl eq-orange font-bold">{s.n}</div>
                <div className="eq-heading text-xl mt-3">{s.t}</div>
                <p className="eq-text-2 text-sm mt-3 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financing */}
      <section id="financing" className="border-t eq-hairline">
        <div className="max-w-7xl mx-auto px-4 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <span className="eq-badge eq-badge-orange">Financing</span>
            <h2 className="eq-heading text-4xl md:text-5xl mt-3">
              App-only up to $150k. Lenders compete.
            </h2>
            <ul className="mt-6 space-y-3 eq-text-2 text-sm">
              <li className="flex gap-3">
                <span className="eq-orange eq-mono">›</span>
                Soft credit pull to see offers — does not affect your score.
              </li>
              <li className="flex gap-3">
                <span className="eq-orange eq-mono">›</span>
                Same-day decisions on most applications.
              </li>
              <li className="flex gap-3">
                <span className="eq-orange eq-mono">›</span>
                Section 179 eligible — talk to your CPA about writing it off this tax year.
              </li>
              <li className="flex gap-3">
                <span className="eq-orange eq-mono">›</span>
                Startups OK. Newer businesses have lender options too.
              </li>
            </ul>
            <button className="eq-btn eq-btn-primary mt-8" onClick={() => setFinancingOpen(true)}>
              Apply for Financing
            </button>
          </div>
          <PaymentCalculator />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t eq-hairline bg-black/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="eq-heading text-4xl md:text-5xl mb-10 text-center">FAQ</h2>
          <FAQ />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t eq-hairline">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 eq-mono text-xs eq-text-2 uppercase">
          <div>
            <div className="eq-heading text-lg eq-text">GCN Equipment</div>
            <div className="mt-1">Global Contractor Network · Pompano Beach, FL</div>
          </div>
          <a href="mailto:sales@globalcontractor.network" className="hover:eq-orange">
            sales@globalcontractor.network
          </a>
        </div>
      </footer>

      <CartDrawer />
      <FinancingModal open={financingOpen} onClose={() => setFinancingOpen(false)} />
    </div>
  );
}

export default function EquipmentStore() {
  return (
    <EquipmentCartProvider>
      <EquipmentStoreInner />
    </EquipmentCartProvider>
  );
}
