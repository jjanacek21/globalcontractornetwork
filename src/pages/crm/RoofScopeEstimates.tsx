import { useNavigate } from "react-router-dom";
import { useRSCompany, useRSEstimates } from "@/hooks/useRoofScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400",
  accepted: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
};

export default function RoofScopeEstimates() {
  const navigate = useNavigate();
  const { company, loading: companyLoading } = useRSCompany();
  const { estimates, loading, deleteEstimate } = useRSEstimates(company?.id);
  const [search, setSearch] = useState("");

  if (companyLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  const filtered = estimates.filter(e => {
    const q = search.toLowerCase();
    return !q || e.estimate_number.toLowerCase().includes(q) ||
      e.property_address?.toLowerCase().includes(q) ||
      `${e.customer?.first_name || ""} ${e.customer?.last_name || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Estimates</h1>
          <p className="text-sm text-muted-foreground">{estimates.length} total estimates</p>
        </div>
        <Button onClick={() => navigate("/roofscope/estimate/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Estimate
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search estimates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {search ? "No estimates match your search" : "No estimates yet. Create your first one!"}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(est => (
                <div key={est.id} className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/roofscope/estimate/${est.id}`)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{est.estimate_number}</span>
                      <Badge className={`text-[10px] ${STATUS_COLORS[est.status] || ""}`}>{est.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {est.customer ? `${est.customer.first_name || ''} ${est.customer.last_name || ''}`.trim() : "—"}
                      {est.property_address ? ` • ${est.property_address}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(est.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold">${(est.grand_total || 0).toLocaleString()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteEstimate(est.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
