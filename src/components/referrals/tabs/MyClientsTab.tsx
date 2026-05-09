import { useState } from "react";
import { useMyClients } from "@/hooks/referrals";
import { BrandCard, GoldText3D, GreenButton3D, Pill, fmtMoney } from "@/components/referrals/ui/primitives";
import { Plus } from "lucide-react";
import { AddClientModal } from "@/components/referrals/modals/AddClientModal";
import { format } from "date-fns";

const TIERS: { name: string; rate: number }[] = [
  { name: "Bronze", rate: 1.5 }, { name: "Silver", rate: 2.5 },
  { name: "Gold", rate: 4.0 }, { name: "Platinum", rate: 5.0 },
];

export function MyClientsTab({ contractor }: { contractor: any }) {
  const { data: clients, isLoading } = useMyClients(contractor?.id);
  const [open, setOpen] = useState(false);
  const myRate = 4.0; // Could be derived from contractor_scores

  return (
    <div className="space-y-6">
      <BrandCard cream className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-semibold" style={{ color: "var(--r-green-deep)" }}>My Client Pool</div>
          <div className="text-sm" style={{ color: "var(--r-muted)" }}>Customers you brought in earn you residuals on every job they sign with the network.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>Your Rate</div>
            <GoldText3D className="text-2xl font-bold">{myRate}%</GoldText3D>
          </div>
          <GreenButton3D onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Client</GreenButton3D>
        </div>
      </BrandCard>

      <BrandCard>
        <div className="font-serif-display text-lg font-semibold mb-3" style={{ color: "var(--r-green-deep)" }}>Residual % by Contractor Score</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIERS.map(t => {
            const isMe = Math.abs(t.rate - myRate) < 0.01;
            return (
              <div key={t.name} className="p-4 rounded-[12px] text-center"
                style={isMe
                  ? { background: "var(--r-cream-2)", border: "2px solid var(--r-gold)" }
                  : { background: "var(--r-cream-2)", border: "1px solid var(--r-line)" }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: "var(--r-muted)" }}>{t.name}</div>
                <GoldText3D className="text-2xl font-bold">{t.rate}%</GoldText3D>
                {isMe && <div className="text-xs mt-1" style={{ color: "var(--r-gold-deep)" }}>← You</div>}
              </div>
            );
          })}
        </div>
      </BrandCard>

      <BrandCard className="overflow-x-auto">
        {isLoading ? (
          <div className="text-sm py-8 text-center" style={{ color: "var(--r-muted)" }}>Loading…</div>
        ) : (clients ?? []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-sm mb-4" style={{ color: "var(--r-muted)" }}>Your client pool is empty.</div>
            <GreenButton3D onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Client</GreenButton3D>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase tracking-wider text-left" style={{ color: "var(--r-muted)" }}>
              <th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Property</th><th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3">Jobs</th><th className="py-2 pr-3 text-right">Spent</th>
              <th className="py-2 pr-3 text-right">Your Residuals</th><th className="py-2 pr-3">Status</th>
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: "var(--r-line)" }}>
              {(clients ?? []).map((c: any) => {
                const cust = c.gcn_customers ?? {};
                const status = c.churned_at ? "churned" : c.invitation_status === "accepted" ? "active" : "invited";
                return (
                  <tr key={c.id}>
                    <td className="py-2 pr-3"><div className="font-semibold" style={{ color: "var(--r-green-deep)" }}>{cust.name ?? "—"}</div><div className="text-xs" style={{ color: "var(--r-muted)" }}>{cust.email}</div></td>
                    <td className="py-2 pr-3 text-xs" style={{ color: "var(--r-muted)" }}>{cust.property_address?.street ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{c.invitation_sent_at ? format(new Date(c.invitation_sent_at), "MMM d, yyyy") : "—"}</td>
                    <td className="py-2 pr-3">{c.jobs}</td>
                    <td className="py-2 pr-3 text-right">{fmtMoney(c.spent)}</td>
                    <td className="py-2 pr-3 text-right gold-text-3d font-bold">{fmtMoney(c.residuals)}</td>
                    <td className="py-2 pr-3"><Pill variant={status === "active" ? "green" : status === "churned" ? "rose" : "amber"}>{status}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </BrandCard>

      <AddClientModal open={open} onClose={() => setOpen(false)} contractorId={contractor.id} />
    </div>
  );
}
