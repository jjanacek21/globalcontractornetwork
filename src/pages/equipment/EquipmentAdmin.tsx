import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsEquipmentAdmin } from "@/hooks/useIsEquipmentAdmin";
import { fmtUSD } from "@/lib/equipment/finance";
import { toast } from "sonner";
import "@/styles/equipment.css";

const STATUSES = [
  "pending_payment",
  "deposit_paid",
  "paid_full",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

interface Order {
  id: string;
  order_no: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  pay_mode: string;
  payment_method: string;
  subtotal_cents: number;
  deposit_due_cents: number;
  balance_cents: number;
  status: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  amount_cents: number;
  equipment: string | null;
  status: string;
  created_at: string;
}

export default function EquipmentAdmin() {
  const { isAdmin, loading } = useIsEquipmentAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: o }, { data: l }] = await Promise.all([
        supabase.from("equipment_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("financing_leads").select("*").order("created_at", { ascending: false }),
      ]);
      if (o) setOrders(o as Order[]);
      if (l) setLeads(l as Lead[]);
    })();
  }, [isAdmin]);

  if (loading) return <div className="equipment-scope p-10 eq-mono eq-text-2">Loading…</div>;
  if (!isAdmin) return <Navigate to="/equipment" replace />;

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("equipment_orders").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success("Status updated");
    }
  };

  return (
    <div className="equipment-scope">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="eq-heading text-4xl">Equipment Admin</h1>
        <p className="eq-mono text-xs eq-text-2 uppercase mt-1">Orders & financing leads</p>

        <section className="mt-10">
          <h2 className="eq-heading text-2xl mb-4">Orders ({orders.length})</h2>
          <div className="eq-plate overflow-x-auto">
            <table className="min-w-full eq-mono text-xs">
              <thead className="bg-black/30 eq-text-2 uppercase text-[0.65rem]">
                <tr>
                  <th className="text-left p-3">Order</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-right p-3">Due Today</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t eq-hairline">
                    <td className="p-3 font-bold">{o.order_no}</td>
                    <td className="p-3">
                      <div>{o.name}</div>
                      <div className="eq-text-2 text-[0.65rem]">{o.email}</div>
                    </td>
                    <td className="p-3 text-right eq-orange font-bold">{fmtUSD(o.deposit_due_cents)}</td>
                    <td className="p-3 text-right">{fmtUSD(o.balance_cents)}</td>
                    <td className="p-3 uppercase text-[0.65rem]">{o.payment_method}</td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="eq-input !py-1 !px-2 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center eq-text-2">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="eq-heading text-2xl mb-4">Financing Leads ({leads.length})</h2>
          <div className="eq-plate overflow-x-auto">
            <table className="min-w-full eq-mono text-xs">
              <thead className="bg-black/30 eq-text-2 uppercase text-[0.65rem]">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t eq-hairline">
                    <td className="p-3">
                      <div className="font-bold">{l.name}</div>
                      {l.company && <div className="eq-text-2 text-[0.65rem]">{l.company}</div>}
                    </td>
                    <td className="p-3">
                      <div>{l.email}</div>
                      <div className="eq-text-2 text-[0.65rem]">{l.phone}</div>
                    </td>
                    <td className="p-3 text-right eq-orange font-bold">{fmtUSD(l.amount_cents)}</td>
                    <td className="p-3 max-w-xs truncate">{l.equipment || "—"}</td>
                    <td className="p-3 eq-text-2 text-[0.65rem]">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center eq-text-2">No leads yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
