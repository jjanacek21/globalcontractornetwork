import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CRMJob } from "@/hooks/useCRMJobs";

interface MaterialOrder {
  id: string;
  job_id: string;
  material_name: string;
  quantity: number;
  unit: string | null;
  supplier: string | null;
  status: string;
  expected_date: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  job?: { title: string; property?: { address_line1: string; city: string | null } | null };
}

const STATUS_OPTIONS = [
  { value: "ordered", label: "Ordered", color: "bg-blue-500" },
  { value: "shipped", label: "Shipped", color: "bg-amber-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
];

interface MaterialOrdersTabProps {
  jobs: CRMJob[];
}

export function MaterialOrdersTab({ jobs }: MaterialOrdersTabProps) {
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formJobId, setFormJobId] = useState("");
  const [formMaterial, setFormMaterial] = useState("");
  const [formQuantity, setFormQuantity] = useState("1");
  const [formUnit, setFormUnit] = useState("units");
  const [formSupplier, setFormSupplier] = useState("");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formCost, setFormCost] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("material_orders")
        .select("*, job:crm_jobs(title, property:properties(address_line1, city))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err: any) {
      toast({ title: "Error loading orders", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreate = async () => {
    if (!formJobId || !formMaterial.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("material_orders").insert({
        job_id: formJobId,
        material_name: formMaterial.trim(),
        quantity: Number(formQuantity) || 1,
        unit: formUnit || "units",
        supplier: formSupplier.trim() || null,
        expected_date: formExpectedDate || null,
        cost: formCost ? Number(formCost) : null,
        created_by: session?.user?.id || null,
      } as any);

      if (error) throw error;
      toast({ title: "Material order created" });
      resetForm();
      setShowNewOrder(false);
      await fetchOrders();
    } catch (err: any) {
      toast({ title: "Error creating order", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("material_orders")
        .update({ status: newStatus } as any)
        .eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast({ title: "Status updated" });
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormJobId("");
    setFormMaterial("");
    setFormQuantity("1");
    setFormUnit("units");
    setFormSupplier("");
    setFormExpectedDate("");
    setFormCost("");
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_OPTIONS.find((s) => s.value === status);
    const Icon = status === "delivered" ? CheckCircle2 : status === "shipped" ? Truck : Clock;
    return (
      <Badge variant="outline" className="gap-1">
        <span className={`h-2 w-2 rounded-full ${cfg?.color || "bg-muted-foreground"}`} />
        <Icon className="h-3 w-3" />
        {cfg?.label || status}
      </Badge>
    );
  };

  const getJobAddress = (order: MaterialOrder) => {
    if (order.job?.property) {
      return `${order.job.property.address_line1}${order.job.property.city ? `, ${order.job.property.city}` : ""}`;
    }
    return order.job?.title || "—";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{orders.length} orders</span>
        </div>
        <Button size="sm" onClick={() => setShowNewOrder(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No material orders yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Address</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-xs max-w-[180px] truncate">
                    {getJobAddress(order)}
                  </TableCell>
                  <TableCell className="text-sm">{order.material_name}</TableCell>
                  <TableCell className="text-right text-sm">
                    {order.quantity} {order.unit}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.supplier || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className="h-7 w-[130px] text-xs border-0 p-0">
                        <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.expected_date ? format(new Date(order.expected_date), "MMM d") : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {order.cost ? `$${Number(order.cost).toLocaleString()}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Material Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Job</label>
              <Select value={formJobId} onValueChange={setFormJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.job_number || j.title} — {j.contact ? `${j.contact.first_name} ${j.contact.last_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Material</label>
              <Input value={formMaterial} onChange={(e) => setFormMaterial(e.target.value)} placeholder="e.g. GAF Timberline HDZ Shingles" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <Input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} min="1" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit</label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="squares">Squares</SelectItem>
                    <SelectItem value="bundles">Bundles</SelectItem>
                    <SelectItem value="rolls">Rolls</SelectItem>
                    <SelectItem value="sheets">Sheets</SelectItem>
                    <SelectItem value="lf">Linear Ft</SelectItem>
                    <SelectItem value="pallets">Pallets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Supplier</label>
              <Input value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="e.g. ABC Supply" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Expected Date</label>
                <Input type="date" value={formExpectedDate} onChange={(e) => setFormExpectedDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cost</label>
                <Input type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowNewOrder(false); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formJobId || !formMaterial.trim()}>
              {saving ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
