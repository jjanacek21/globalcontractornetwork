import { useReferralsReceived } from "@/hooks/referrals";
import { BrandCard, KPICard, StatusPill, fmtMoney } from "@/components/referrals/ui/primitives";
import { Inbox, CheckCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";

export function ReceivedTab({ contractor }: { contractor: any }) {
  const { data: rows = [], isLoading } = useReferralsReceived(contractor?.id);
  const active = rows.filter((r: any) => r.status === "in_progress").length;
  const won = rows.filter((r: any) => r.status === "won").length;
  const owed = rows.filter((r: any) => r.status === "won" && !r.paid_out_at).reduce((s: number, r: any) => s + Number(r.bounty_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Active" value={active} icon={<Inbox className="w-5 h-5" />} delay={0} />
        <KPICard label="Won" value={won} icon={<CheckCircle className="w-5 h-5" />} delay={0.5} />
        <KPICard label="Bounties Owed" value={fmtMoney(owed)} goldValue icon={<DollarSign className="w-5 h-5" />} delay={1} />
      </div>
      <BrandCard className="overflow-x-auto">
        {isLoading ? <div className="text-sm py-8 text-center" style={{ color: "var(--r-muted)" }}>Loading…</div>
          : rows.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "var(--r-muted)" }}>No referrals received yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-left" style={{ color: "var(--r-muted)" }}>
                <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">From</th>
                <th className="py-2 pr-3">Trade</th><th className="py-2 pr-3 text-right">Contract</th>
                <th className="py-2 pr-3 text-right">Bounty</th><th className="py-2 pr-3 text-right">GCN 30%</th>
                <th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Actions</th>
              </tr></thead>
              <tbody className="divide-y" style={{ borderColor: "var(--r-line)" }}>
                {rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 text-xs">{format(new Date(r.created_at), "MMM dd, yyyy")}</td>
                    <td className="py-2 pr-3">{r.gcn_customers?.name ?? r.gcn_customers?.email}</td>
                    <td className="py-2 pr-3">{r.referrer?.company_name ?? "GCN Direct"}</td>
                    <td className="py-2 pr-3 text-xs">{r.trade}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(r.contract_value)}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(r.bounty_amount)}</td>
                    <td className="py-2 pr-3 text-right" style={{ color: "var(--r-muted)" }}>{fmtMoney(r.gcn_share)}</td>
                    <td className="py-2 pr-3"><StatusPill status={r.status} /></td>
                    <td className="py-2 pr-3">
                      <button disabled title="Coming soon — backend logic in progress"
                        className="px-3 py-1 text-xs rounded-[8px] cursor-not-allowed opacity-50"
                        style={{ background: "var(--r-cream-3)", color: "var(--r-muted)" }}>
                        Mark Won
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </BrandCard>
    </div>
  );
}
