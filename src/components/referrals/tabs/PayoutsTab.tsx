import { usePayouts } from "@/hooks/referrals";
import { useToast } from "@/hooks/use-toast";
import { BrandCard, KPICard, GreenButton3D, fmtMoney } from "@/components/referrals/ui/primitives";
import { Wallet, Lock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const TYPE_LABELS: Record<string, string> = {
  outbound_bounty: "Outbound Bounty",
  residual: "Residual",
  gcn_fee: "GCN Finder's Fee",
  withdrawal: "Withdrawal",
};

export function PayoutsTab({ contractor }: { contractor: any }) {
  const { data, isLoading } = usePayouts(contractor?.id);
  const { toast } = useToast();
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrandCard className="relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--r-muted)" }}>Available to Withdraw</div>
          <div className="text-3xl font-bold gold-text-3d font-serif-display mt-2">{fmtMoney(data?.available ?? 0)}</div>
          <GreenButton3D className="mt-3 w-full" onClick={() =>
            toast({ title: "Coming soon", description: "Withdrawals will be enabled when ACH integration ships. Reach out to support to request manual withdrawal." })
          }><Wallet className="w-4 h-4" /> Withdraw to Bank</GreenButton3D>
        </BrandCard>
        <KPICard label="In Escrow" value={fmtMoney(data?.escrow ?? 0)}
          sublabel="Released when receiving contractor marks job complete + 7-day review window."
          icon={<Lock className="w-5 h-5" />} delay={0.5} />
        <KPICard label="GCN's Lifetime Cut" value={fmtMoney(data?.gcnCut ?? 0)}
          sublabel="25% of every bounty + 100% of unattributed leads routed to you."
          icon={<TrendingUp className="w-5 h-5" />} delay={1} />
      </div>

      <BrandCard className="overflow-x-auto">
        <div className="font-serif-display text-lg font-semibold mb-3" style={{ color: "var(--r-green-deep)" }}>Payout History</div>
        {isLoading ? <div className="text-sm py-8 text-center" style={{ color: "var(--r-muted)" }}>Loading…</div>
          : rows.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "var(--r-muted)" }}>No payouts yet. Refer a customer or add a client to start earning.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-left" style={{ color: "var(--r-muted)" }}>
                <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3 text-right">Gross</th><th className="py-2 pr-3 text-right">GCN Fee</th>
                <th className="py-2 pr-3 text-right">Net</th><th className="py-2 pr-3">Method</th>
              </tr></thead>
              <tbody className="divide-y" style={{ borderColor: "var(--r-line)" }}>
                {rows.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 text-xs">{format(new Date(p.created_at), "MMM dd, yyyy")}</td>
                    <td className="py-2 pr-3">{TYPE_LABELS[p.type] ?? p.type}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: "var(--r-muted)" }}>{p.description ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(p.gross_amount)}</td>
                    <td className="py-2 pr-3 text-right" style={{ color: "var(--r-muted)" }}>{fmtMoney(p.gcn_fee)}</td>
                    <td className="py-2 pr-3 text-right gold-text-3d font-bold">{fmtMoney(p.net_amount)}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: "var(--r-muted)" }}>{p.method ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </BrandCard>
    </div>
  );
}
