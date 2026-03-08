import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstimates, ESTIMATE_STATUSES } from "@/hooks/useEstimates";
import { Plus, Search, FileText, DollarSign, Eye, History, Download, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function CRMEstimates() {
  const { estimates, isLoading } = useEstimates();
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = estimates.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = e.estimate_number?.toLowerCase().includes(q) || e.customer?.name?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground">View all company estimates</p>
        </div>
        <Button className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white">
          <FileText className="mr-2 h-4 w-4" />Create Estimate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={repFilter} onValueChange={setRepFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sales Rep" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Reps</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Locations</SelectItem></SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ESTIMATE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-[160px]" />
        <Input type="date" className="w-[160px]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(est => {
                const statusInfo = ESTIMATE_STATUSES.find(s => s.value === est.status) || ESTIMATE_STATUSES[0];
                return (
                  <TableRow key={est.id}>
                    <TableCell className="font-medium">{est.estimate_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{est.customer?.name || "No customer"}</p>
                        <p className="text-xs text-muted-foreground">{est.customer?.address || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-green-600 font-semibold">${Number(est.total || 0).toLocaleString()}</TableCell>
                    <TableCell><Badge className={`text-xs text-white ${statusInfo.color}`}>{statusInfo.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(est.created_at || ""), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><History className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No estimates found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-3 border-t">
            <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Add Lead</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
