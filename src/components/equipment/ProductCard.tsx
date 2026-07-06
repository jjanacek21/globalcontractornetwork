import { fmtUSD, monthlyPayment } from "@/lib/equipment/finance";
import { useEquipmentCart } from "@/hooks/useEquipmentCart";
import { toast } from "sonner";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";

export interface EquipmentProduct {
  id: string;
  slug: string;
  name: string;
  type: "rig" | "part";
  bto: boolean;
  cross_ref: string | null;
  specs: Record<string, string>;
  blurb: string | null;
  price_cents: number;
  compare_cents: number | null;
  cost_cents?: number;
}

export function ProductCard({ product }: { product: EquipmentProduct }) {
  const { add, open } = useEquipmentCart();
  const { isAdmin } = useIsEquipmentAdmin();

  const isRig = product.type === "rig";
  const savings =
    product.compare_cents && product.compare_cents > product.price_cents
      ? product.compare_cents - product.price_cents
      : 0;
  const isLaunchSale = product.slug === "gcn-933";
  const monthly60 = isRig && product.price_cents >= 300000
    ? Math.round(monthlyPayment(product.price_cents, 60))
    : null;

  const margin = product.cost_cents != null
    ? product.price_cents - product.cost_cents
    : null;
  const marginPct = margin != null && product.price_cents > 0
    ? Math.round((margin / product.price_cents) * 100)
    : null;

  return (
    <article className="eq-plate flex flex-col h-full">
      {/* Header strip */}
      <div className="px-5 py-4 border-b eq-hairline flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="eq-heading text-xl md:text-2xl leading-tight">{product.name}</h3>
          {product.cross_ref && (
            <p className="eq-mono text-[0.7rem] eq-text-2 mt-1.5 uppercase tracking-wide">
              Cross-refs: {product.cross_ref}
            </p>
          )}
        </div>
        <span className={`eq-badge ${product.bto ? "eq-badge-amber" : "eq-badge-green"} whitespace-nowrap`}>
          <span className={`h-1.5 w-1.5 rounded-full ${product.bto ? "bg-[var(--eq-amber)]" : "bg-[var(--eq-green)]"}`} />
          {product.bto ? "BTO · 6–8 wks" : "In stock"}
        </span>
      </div>

      {/* Blurb */}
      {product.blurb && (
        <p className="px-5 pt-4 text-sm eq-text-2 leading-relaxed">{product.blurb}</p>
      )}

      {/* Spec table */}
      <div className="px-5 py-4">
        <table className="eq-spec-table">
          <tbody>
            {Object.entries(product.specs).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price plate */}
      <div className="mt-auto px-5 pt-3 pb-5 border-t eq-hairline bg-muted/40">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="eq-mono text-3xl font-bold eq-text">{fmtUSD(product.price_cents)}</span>
          {product.compare_cents && product.compare_cents > product.price_cents && (
            <span className="eq-mono text-sm eq-text-2 line-through">
              {fmtUSD(product.compare_cents)}
            </span>
          )}
        </div>
        {isLaunchSale && (
          <div className="mt-2">
            <span className="eq-badge eq-badge-orange">Launch sale — $3,000 off</span>
          </div>
        )}
        {savings > 0 && !isLaunchSale && (
          <p className="eq-mono text-xs eq-orange mt-1">You save {fmtUSD(savings)}</p>
        )}
        {monthly60 != null && (
          <p className="eq-mono text-xs eq-text-2 mt-2">
            or <span className="eq-orange font-semibold">${monthly60.toLocaleString("en-US")}/mo</span> financed<span className="align-super">*</span>
          </p>
        )}


        <button
          className="eq-btn eq-btn-primary w-full mt-4"
          onClick={() => {
            add(
              {
                id: product.id,
                slug: product.slug,
                name: product.name,
                bto: product.bto,
                unit_price_cents: product.price_cents,
              },
              1
            );
            toast.success(`Added: ${product.name}`);
            open();
          }}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
