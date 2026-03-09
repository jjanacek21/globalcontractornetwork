import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Eye, History, Download, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "sent", label: "Sent", color: "bg-blue-500/10 text-blue-600" },
  { value: "approved", label: "Approved", color: "bg-green-500/10 text-green-600" },
  { value: "declined", label: "Declined", color: "bg-destructive/10 text-destructive" },
];

export default function CRMEstimates() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("estimates")
        .select(`
          *,
          customer:customers(id, name, address)
        `)
        .order("created_at", { ascending: false });
      setEstimates(data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = estimates.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      e.estimate_number?.toLowerCase().includes(q) ||
      e.customer?.name?.toLowerCase().includes(q) ||
      e.customer?.address?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesFrom = !dateFrom || (e.created_at && e.created_at >= dateFrom);
    const matchesTo = !dateTo || (e.created_at && e.created_at <= dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const getMargin = (est: any) => {
    if (!est.total || est.total === 0) return 0;
    const directCost = (est.materials_cost || 0) + (est.labor_cost || 0);
    return Math.round(((est.total - directCost) / est.total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground">Manage all company estimates</p>
        </div>
        <Button onClick={() => navigate("/member/crm/estimates/new")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <FileText className="mr-2 h-4 w-4" /> Create Estimate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by number, customer, address..."
          className="w-[280px]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-[150px]" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
        <Input type="date" className="w-[150px]" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: estimates.length },
          { label: "Draft", value: estimates.filter(e => e.status === "draft").length },
          { label: "Sent", value: estimates.filter(e => e.status === "sent").length },
          { label: "Approved", value: estimates.filter(e => e.status === "approved").length },
        ].map((s, i) => (
          <Card key={i}>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Labor</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(est => {
                const statusInfo = STATUS_OPTIONS.find(s => s.value === est.status) || STATUS_OPTIONS[0];
                const margin = getMargin(est);
                return (
                  <TableRow key={est.id}>
                    <TableCell className="font-medium">{est.estimate_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{est.customer?.name || "No customer"}</p>
                        <p className="text-xs text-muted-foreground">{est.customer?.address || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{fmt(est.materials_cost || 0)}</TableCell>
                    <TableCell className="text-sm">{fmt(est.labor_cost || 0)}</TableCell>
                    <TableCell className="font-semibold text-primary">{fmt(est.total || 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={margin >= 30 ? "text-green-600" : margin >= 20 ? "text-amber-600" : "text-destructive"}>
                        {margin}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {est.created_at ? format(new Date(est.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No estimates found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
