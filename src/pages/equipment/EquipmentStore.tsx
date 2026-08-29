import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { EquipmentCartProvider, useEquipmentCart } from "@/hooks/useEquipmentCart";
import { ProductCard, EquipmentProduct } from "@/components/equipment/ProductCard";
import { CartDrawer } from "@/components/equipment/CartDrawer";
import { PaymentCalculator } from "@/components/equipment/PaymentCalculator";
import { FAQ } from "@/components/equipment/FAQ";
import { FinancingModal } from "@/components/equipment/FinancingModal";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";
import { StoreAuthBar } from "@/components/equipment/StoreAuthBar";
import { getStoreCanonicalUrl, getJoinNetworkUrl } from "@/lib/utils";
import { useMemberPricing } from "@/hooks/useMemberPricing";
import { ShieldCheck } from "lucide-react";
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
        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground eq-mono text-[0.65rem] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
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
  const { isMember, discountPct } = useMemberPricing();
  const { setMemberDiscountPct } = useEquipmentCart();

  useEffect(() => {
    setMemberDiscountPct(discountPct);
  }, [discountPct, setMemberDiscountPct]);

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

  const canonical = getStoreCanonicalUrl();
  const title = "The GCN Store — Commercial Spray Rigs, Guns & Coating Equipment";
  const description =
    "Graco-class spray rigs at half the invoice. Honda GX power, Graco/Titan-interchangeable wear parts, financing from $149/mo, US parts stock ships same day.";
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "The GCN Store",
    url: canonical,
    description,
    email: "Admin@gcn.support",
    parentOrganization: { "@type": "Organization", name: "Global Contractor Network" },
    address: { "@type": "PostalAddress", addressLocality: "Pompano Beach", addressRegion: "FL", addressCountry: "US" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Spray Rigs & Parts",
      itemListElement: products.slice(0, 20).map((p) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Product", name: p.name },
        price: (p.price_cents / 100).toFixed(2),
        priceCurrency: "USD",
        availability: p.type === "part" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      })),
    },
  };

  return (
    <div className="equipment-scope">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="The GCN Store" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
      </Helmet>

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
          <div className="flex items-center gap-3">
            {isMember ? (
              <span className="eq-badge eq-badge-green hidden sm:inline-flex">Member pricing active · 15% off</span>
            ) : (
              <a href={getJoinNetworkUrl()} className="eq-btn eq-btn-ghost !py-2 !px-3 hidden sm:inline-flex">
                Join for 15% off
              </a>
            )}
            <StoreAuthBar />
            <CartButton />
          </div>
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
          {isMember ? (
            <p className="mt-5 eq-mono text-xs text-primary uppercase tracking-wide">
              Member pricing active — 15% off every item, applied at checkout.
            </p>
          ) : (
            <p className="mt-5 eq-mono text-xs eq-text-2 uppercase tracking-wide">
              Buy with no account needed ·{" "}
              <a href={getJoinNetworkUrl()} className="text-primary font-semibold hover:underline">
                Join the network for member pricing — 15% off
              </a>
            </p>
          )}
        </div>

        {/* Ticker */}
        <div className="border-t eq-hairline bg-muted/40 overflow-x-auto">
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
      <section id="how" className="border-t eq-hairline bg-muted/40">
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
                <div className="eq-mono text-4xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">{s.n}</div>

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

      {/* Guarantee */}
      <section id="guarantee" className="border-t eq-hairline">
        <div className="max-w-7xl mx-auto px-4 py-16 grid gap-8 lg:grid-cols-[auto,1fr] items-start">
          <ShieldCheck className="h-14 w-14 text-primary" aria-hidden="true" />
          <div>
            <span className="eq-badge eq-badge-green">30-Day Money-Back Guarantee</span>
            <h2 className="eq-heading text-4xl md:text-5xl mt-3">
              If it doesn't perform, send it back.
            </h2>
            <p className="mt-5 max-w-3xl eq-text-2 leading-relaxed">
              You have 30 days from delivery. If the build quality or the published specs don't hold up —
              or the machine doesn't perform against its Graco or Titan counterpart the way we said it
              would — we refund you in full. Contact Admin@gcn.support with your order number and we'll
              arrange return freight.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3 eq-mono text-xs eq-text-2 uppercase">
              <li className="eq-plate p-4">30 days from delivery</li>
              <li className="eq-plate p-4">Full refund — no restocking fee</li>
              <li className="eq-plate p-4">Return freight arranged by us</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t eq-hairline bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="eq-heading text-4xl md:text-5xl mb-10 text-center">FAQ</h2>
          <FAQ />
        </div>
      </section>

      {/* Join band */}
      {!isMember && (
        <section className="border-t eq-hairline bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="eq-heading text-3xl md:text-4xl">Contractors save 15%</h2>
              <p className="eq-text-2 text-sm mt-2 max-w-xl">
                Join the Global Contractor Network for member pricing on every rig and part. Already a
                member? Sign in — or open the store from your dashboard and the discount applies
                automatically.
              </p>
            </div>
            <a href={getJoinNetworkUrl()} className="eq-btn eq-btn-primary whitespace-nowrap">
              Join Network — 15% Off <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t eq-hairline">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 eq-mono text-xs eq-text-2 uppercase">
          <div>
            <div className="eq-heading text-lg eq-text">The GCN Store</div>
            <div className="mt-1">Global Contractor Network · Pompano Beach, FL</div>
          </div>
          <a href="mailto:Admin@gcn.support" className="hover:text-primary transition-colors">
            Admin@gcn.support
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
