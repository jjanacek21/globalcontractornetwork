import { useState, useMemo } from "react";
import { usePartners } from "@/hooks/referrals";
import { BrandCard, GoldText3D, GreenButton3D, TierBadge, Pill, BrandSkeleton, fmtMoney } from "@/components/referrals/ui/primitives";
import { Search, Plus } from "lucide-react";
import { ReferCustomerModal } from "@/components/referrals/modals/ReferCustomerModal";

export function PartnersTab({ contractor }: { contractor: any }) {
  const { data: partners, isLoading } = usePartners(contractor?.id);
  const [search, setSearch] = useState("");
  const [trade, setTrade] = useState("all");
  const [referOpen, setReferOpen] = useState(false);
  const [prefilled, setPrefilled] = useState<any>(null);

  const trades = useMemo(() => {
    const set = new Set<string>();
    (partners ?? []).forEach((p: any) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [partners]);

  const filtered = useMemo(() => {
    return (partners ?? []).filter((p: any) => {
      if (trade !== "all" && p.category !== trade) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${p.company_name ?? ""} ${p.category ?? ""} ${p.service_area ?? ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [partners, search, trade]);

  return (
    <div className="space-y-6">
      <BrandCard cream className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-semibold" style={{ color: "var(--r-green-deep)" }}>Approved Referral Partners</div>
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>Send a customer to a vetted partner and earn 75% of their published bounty.</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--r-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search trade, company, ZIP..."
              className="pl-9 pr-3 py-2 rounded-[10px] text-sm w-full md:w-64 brand-card border-0"
              style={{ background: "var(--r-paper)" }} />
          </div>
          <select value={trade} onChange={e => setTrade(e.target.value)}
            className="px-3 py-2 rounded-[10px] text-sm brand-card border-0" style={{ background: "var(--r-paper)" }}>
            <option value="all">All Trades</option>
            {trades.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <GreenButton3D onClick={() => { setPrefilled(null); setReferOpen(true); }}>
            <Plus className="w-4 h-4" /> Refer Customer
          </GreenButton3D>
        </div>
      </BrandCard>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <BrandSkeleton key={i} className="h-72" />)}
        </div>
      ) : filtered.length === 0 ? (
        <BrandCard className="text-center py-12" >
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>No partners match your filters yet.</div>
        </BrandCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <BrandCard key={p.id} className="hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-base" style={{ color: "var(--r-green-deep)" }}>{p.company_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Pill variant="green">{p.category ?? "—"}</Pill>
                    <span className="text-xs" style={{ color: "var(--r-muted)" }}>{p.service_area ?? ""}</span>
                  </div>
                </div>
                <div className="text-right">
                  <GoldText3D className="text-2xl font-bold">{p.score?.score ?? "—"}</GoldText3D>
                  {p.score?.tier && <div className="mt-1"><TierBadge tier={p.score.tier} /></div>}
                </div>
              </div>
              <div className="my-3 space-y-1">
                {(p.tiers.slice(0, 3)).map((t: any, i: number) => (
                  <div key={t.id} className="flex justify-between text-xs px-2 py-1 rounded"
                    style={{ background: i === 0 ? "var(--r-cream-2)" : "transparent" }}>
                    <span style={{ color: "var(--r-muted)" }}>{t.tier_name} · {fmtMoney(t.min_contract_value)}–{t.max_contract_value ? fmtMoney(t.max_contract_value) : "∞"}</span>
                    <span className="font-semibold" style={{ color: "var(--r-green-deep)" }}>
                      {t.bounty_type === "percent" ? `${t.bounty_amount}%` : fmtMoney(t.bounty_amount)}
                    </span>
                  </div>
                ))}
                {p.tiers.length === 0 && <div className="text-xs italic" style={{ color: "var(--r-muted)" }}>No published bounties yet.</div>}
              </div>
              <div className="flex gap-2 mt-3">
                <GreenButton3D className="flex-1 text-xs" onClick={() => { setPrefilled(p); setReferOpen(true); }}>
                  Refer Customer
                </GreenButton3D>
                <button className="px-3 py-2 text-xs font-semibold rounded-[10px]"
                  style={{ background: "var(--r-cream-2)", color: "var(--r-green-deep)", border: "1px solid var(--r-line)" }}>
                  Profile →
                </button>
              </div>
            </BrandCard>
          ))}
        </div>
      )}

      <ReferCustomerModal open={referOpen} onClose={() => setReferOpen(false)}
        contractorId={contractor.id} prefilledPartner={prefilled} partners={partners ?? []} />
    </div>
  );
}
