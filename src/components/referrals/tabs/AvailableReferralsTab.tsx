import { useState, useMemo } from "react";
import { useAvailableBroadcasts, useClaimBroadcast } from "@/hooks/referrals";
import { BrandCard, GreenButton3D, Pill, BrandSkeleton, fmtMoney } from "@/components/referrals/ui/primitives";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";
import { MessageClientDialog } from "@/components/referrals/modals/MessageClientDialog";

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 36e5);
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

export function AvailableReferralsTab({ contractor }: { contractor: any }) {
  const [trade, setTrade] = useState("all");
  const { data: broadcasts, isLoading } = useAvailableBroadcasts(contractor?.id);
  const claim = useClaimBroadcast();
  const { toast } = useToast();
  const [active, setActive] = useState<{ broadcast: any; claimId: string } | null>(null);

  const trades = useMemo(() => {
    const set = new Set<string>();
    (broadcasts ?? []).forEach((b: any) => b.trade && set.add(b.trade));
    return Array.from(set).sort();
  }, [broadcasts]);

  const filtered = useMemo(() => {
    if (trade === "all") return broadcasts ?? [];
    return (broadcasts ?? []).filter((b: any) => b.trade === trade);
  }, [broadcasts, trade]);

  const onClaimAndMessage = async (b: any) => {
    try {
      const { claimId } = await claim.mutateAsync({ broadcastId: b.id, contractorId: contractor.id });
      setActive({ broadcast: b, claimId });
    } catch (err: any) {
      toast({
        title: "Couldn't claim",
        description: err.message ?? "This broadcast may already be full.",
        variant: "destructive",
      });
    }
  };

  const onOpenExisting = async (b: any) => {
    // Already claimed — just look up our claim id and open the dialog
    try {
      const { claimId } = await claim.mutateAsync({ broadcastId: b.id, contractorId: contractor.id });
      setActive({ broadcast: b, claimId });
    } catch (err: any) {
      toast({ title: "Couldn't open conversation", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <BrandCard cream className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-semibold" style={{ color: "var(--r-green-deep)" }}>
            Available Referrals
          </div>
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>
            Open leads broadcast to the network. First 3 contractors to claim and message the customer can engage. GCN takes 30% of every bounty paid.
          </div>
        </div>
        <select
          value={trade}
          onChange={e => setTrade(e.target.value)}
          className="px-3 py-2 rounded-[10px] text-sm brand-card border-0"
          style={{ background: "var(--r-paper)" }}
        >
          <option value="all">All Trades</option>
          {trades.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </BrandCard>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <BrandSkeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <BrandCard className="text-center py-12">
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>
            No open referrals right now. Check back soon.
          </div>
        </BrandCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b: any) => {
            const yourCut = Number(b.estimated_bounty ?? 0) * 0.70;
            return (
              <BrandCard key={b.id} className="hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Pill variant="green">{b.trade}</Pill>
                    <div className="font-bold mt-2" style={{ color: "var(--r-green-deep)" }}>
                      {b.gcn_customers?.name ?? "New customer"}
                    </div>
                    <div className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--r-muted)" }}>
                      <MapPin className="w-3 h-3" /> {b.service_area ?? "Area not specified"}
                    </div>
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--r-muted)" }}>
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {timeLeft(b.expires_at)}
                    </div>
                    <div className="mt-1 italic">via {b.referrer?.company_name ?? "GCN"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs my-3 p-2 rounded-[8px]"
                  style={{ background: "var(--r-cream-2)" }}>
                  <div>
                    <div style={{ color: "var(--r-muted)" }}>Est. value</div>
                    <div className="font-semibold">{b.contract_value ? fmtMoney(b.contract_value) : "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--r-muted)" }}>You'd earn</div>
                    <div className="font-semibold">{fmtMoney(yourCut)}</div>
                  </div>
                </div>

                {b.notes && (
                  <div className="text-xs italic mb-3" style={{ color: "var(--r-muted)" }}>
                    "{b.notes}"
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs flex items-center gap-1" style={{ color: "var(--r-muted)" }}>
                    <Users className="w-3 h-3" />
                    {b.claim_count}/{b.max_claims} claimed
                    <span className="ml-1 font-semibold" style={{ color: b.claims_remaining > 0 ? "var(--r-green-deep)" : "#b00" }}>
                      ({b.claims_remaining} left)
                    </span>
                  </div>
                  {b.claimed_by_me ? (
                    <button
                      disabled
                      className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-[10px]"
                      style={{ background: "var(--r-cream-2)", color: "var(--r-green-deep)", border: "1px solid var(--r-line)" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Claimed
                    </button>
                  ) : (
                    <GreenButton3D
                      className="text-xs"
                      onClick={() => onClaim(b)}
                      disabled={claim.isPending || b.claims_remaining === 0}
                    >
                      <MessageSquare className="w-4 h-4" /> Message Customer
                    </GreenButton3D>
                  )}
                </div>
              </BrandCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
