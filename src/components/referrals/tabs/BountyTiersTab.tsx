import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBountyTiers } from "@/hooks/referrals";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BrandCard, GreenButton3D, Pill, fmtMoney } from "@/components/referrals/ui/primitives";
import { Plus, Trash2 } from "lucide-react";

export function BountyTiersTab({ contractor }: { contractor: any }) {
  const { data: tiers, isLoading } = useBountyTiers(contractor?.id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTrade, setActiveTrade] = useState<string | null>(null);

  const trades = useMemo<string[]>(() => Array.from(new Set((tiers ?? []).map((t: any) => t.trade as string))), [tiers]);
  const current = activeTrade ?? trades[0] ?? null;
  const visible = (tiers ?? []).filter((t: any) => t.trade === current);

  const addTier = async () => {
    const trade = current ?? prompt("Trade name (e.g. Roofing)") ?? "";
    if (!trade) return;
    const { error } = await supabase.from("referral_partner_tiers").insert({
      contractor_id: contractor.id, trade, tier_name: `Tier ${visible.length + 1}`,
      min_contract_value: 0, bounty_type: "flat", bounty_amount: 250, status: "active",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["referrals", "bountyTiers"] });
  };

  const updateTier = async (id: string, patch: any) => {
    await supabase.from("referral_partner_tiers").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["referrals", "bountyTiers"] });
  };
  const removeTier = async (id: string) => {
    if (!confirm("Delete this tier?")) return;
    await supabase.from("referral_partner_tiers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["referrals", "bountyTiers"] });
  };

  return (
    <div className="space-y-6">
      <BrandCard cream className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-semibold" style={{ color: "var(--r-green-deep)" }}>My Referral Bounty Tiers</div>
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>Set what YOU pay other contractors when they refer customers to {contractor?.company_name ?? "you"}. <strong>GCN takes 30%</strong> off the top of every bounty paid out.</div>
        </div>
        <GreenButton3D onClick={addTier}><Plus className="w-4 h-4" /> Add Tier</GreenButton3D>
      </BrandCard>

      {trades.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {trades.map(t => (
            <button key={t} onClick={() => setActiveTrade(t)}
              className="px-4 py-2 rounded-[10px] text-sm font-semibold whitespace-nowrap"
              style={current === t
                ? { background: "var(--r-green-deep)", color: "var(--r-cream)" }
                : { background: "var(--r-paper)", color: "var(--r-green-deep)", border: "1px solid var(--r-line)" }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <BrandCard><div className="text-sm" style={{ color: "var(--r-muted)" }}>Loading…</div></BrandCard>
      ) : trades.length === 0 ? (
        <BrandCard className="text-center py-12">
          <div className="text-sm mb-4" style={{ color: "var(--r-muted)" }}>No tiers yet — add your first to publish your card to the partner directory.</div>
          <GreenButton3D onClick={addTier}><Plus className="w-4 h-4" /> Add First Tier</GreenButton3D>
        </BrandCard>
      ) : (
        <BrandCard className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-left" style={{ color: "var(--r-muted)" }}>
                <th className="py-2 pr-3">Tier</th><th className="py-2 pr-3">Min</th><th className="py-2 pr-3">Max</th>
                <th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Bounty</th>
                <th className="py-2 pr-3">Referrer 70%</th><th className="py-2 pr-3">GCN 30%</th>
                <th className="py-2 pr-3">Status</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--r-line)" }}>
              {visible.map((t: any) => {
                const ref = Number(t.bounty_amount) * 0.75;
                const gcn = Number(t.bounty_amount) * 0.25;
                return (
                  <tr key={t.id}>
                    <td className="py-2 pr-3"><input defaultValue={t.tier_name} onBlur={e => updateTier(t.id, { tier_name: e.target.value })} className="bg-transparent w-28" /></td>
                    <td className="py-2 pr-3"><input type="number" defaultValue={t.min_contract_value} onBlur={e => updateTier(t.id, { min_contract_value: Number(e.target.value) })} className="bg-transparent w-20" /></td>
                    <td className="py-2 pr-3"><input type="number" defaultValue={t.max_contract_value ?? ""} onBlur={e => updateTier(t.id, { max_contract_value: e.target.value ? Number(e.target.value) : null })} className="bg-transparent w-20" /></td>
                    <td className="py-2 pr-3">
                      <select defaultValue={t.bounty_type} onChange={e => updateTier(t.id, { bounty_type: e.target.value })} className="bg-transparent">
                        <option value="flat">flat</option><option value="percent">%</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3"><input type="number" defaultValue={t.bounty_amount} onBlur={e => updateTier(t.id, { bounty_amount: Number(e.target.value) })} className="bg-transparent w-20" /></td>
                    <td className="py-2 pr-3 gold-text-3d font-bold">{t.bounty_type === "percent" ? `${ref.toFixed(1)}%` : fmtMoney(ref)}</td>
                    <td className="py-2 pr-3" style={{ color: "var(--r-muted)" }}>{t.bounty_type === "percent" ? `${gcn.toFixed(1)}%` : fmtMoney(gcn)}</td>
                    <td className="py-2 pr-3">
                      <button onClick={() => updateTier(t.id, { status: t.status === "active" ? "paused" : "active" })}>
                        <Pill variant={t.status === "active" ? "green" : "muted"}>{t.status}</Pill>
                      </button>
                    </td>
                    <td className="py-2"><button onClick={() => removeTier(t.id)} style={{ color: "var(--r-rose)" }}><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BrandCard>
      )}

      <BrandCard cream>
        <div className="font-serif-display text-lg font-semibold mb-4" style={{ color: "var(--r-green-deep)" }}>How Bounty Splits Work</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Contractor → Contractor", body: "70% to the referring contractor, 30% to GCN.", chip: "70 / 30" },
            { title: "Customer → GCN Direct", body: "Walk-in customers routed by GCN — 100% of the finder's fee goes to GCN.", chip: "100% GCN" },
            { title: "Client Pool Residuals", body: "Earn a % of every contract your introduced clients sign with anyone in the network.", chip: "1.5–5%" },
          ].map(c => (
            <div key={c.title} className="brand-card p-4">
              <Pill variant="gold">{c.chip}</Pill>
              <div className="font-semibold mt-2" style={{ color: "var(--r-green-deep)" }}>{c.title}</div>
              <div className="text-xs mt-1" style={{ color: "var(--r-muted)" }}>{c.body}</div>
            </div>
          ))}
        </div>
      </BrandCard>
    </div>
  );
}
