import { useReferralsSent } from "@/hooks/referrals";
import { BrandCard, KPICard, StatusPill, fmtMoney } from "@/components/referrals/ui/primitives";
import { Send, CheckCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";

export function SentTab({ contractor }: { contractor: any }) {
  const { data: rows = [], isLoading } = useReferralsSent(contractor?.id);
  const active = rows.filter((r: any) => r.status === "in_progress").length;
  const closed = rows.filter((r: any) => r.status === "won").length;
  const earned = rows.filter((r: any) => r.status === "won").reduce((s: number, r: any) => s + Number(r.referrer_share ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Active" value={active} icon={<Send className="w-5 h-5" />} delay={0} />
        <KPICard label="Closed" value={closed} icon={<CheckCircle className="w-5 h-5" />} delay={0.5} />
        <KPICard label="Lifetime Earned" value={fmtMoney(earned)} goldValue icon={<DollarSign className="w-5 h-5" />} delay={1} />
      </div>
      <BrandCard className="overflow-x-auto">
        {isLoading ? <div className="text-sm py-8 text-center" style={{ color: "var(--r-muted)" }}>Loading…</div>
          : rows.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "var(--r-muted)" }}>You haven't referred anyone yet — find a partner →</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-left" style={{ color: "var(--r-muted)" }}>
                <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Referred To</th>
                <th className="py-2 pr-3">Trade</th><th className="py-2 pr-3 text-right">Contract</th>
                <th className="py-2 pr-3 text-right">Bounty</th><th className="py-2 pr-3 text-right">Your Cut (75%)</th><th className="py-2 pr-3">Status</th>
              </tr></thead>
              <tbody className="divide-y" style={{ borderColor: "var(--r-line)" }}>
                {rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 text-xs">{format(new Date(r.created_at), "MMM dd, yyyy")}</td>
                    <td className="py-2 pr-3">{r.gcn_customers?.name ?? r.gcn_customers?.email}</td>
                    <td className="py-2 pr-3">{r.receiver?.company_name ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{r.trade}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(r.contract_value)}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(r.bounty_amount)}</td>
                    <td className="py-2 pr-3 text-right gold-text-3d font-bold">{fmtMoney(r.referrer_share)}</td>
                    <td className="py-2 pr-3"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </BrandCard>
    </div>
  );
}
