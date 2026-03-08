import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstimates, ESTIMATE_STATUSES } from "@/hooks/useEstimates";
import { Plus, Search, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function CRMEstimates() {
  const { estimates, isLoading } = useEstimates();
  const [search, setSearch] = useState("");

  const filtered = estimates.filter(e => {
    const q = search.toLowerCase();
    return e.estimate_number?.toLowerCase().includes(q) ||
      e.customer?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground">{estimates.length} total estimates</p>
        </div>
        <Button onClick={() => window.location.href = "/crm/estimates"}>
          <Plus className="mr-2 h-4 w-4" />New Estimate
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search estimates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => {
            const statusInfo = ESTIMATE_STATUSES.find(s => s.value === est.status) || ESTIMATE_STATUSES[0];
            return (
              <Card key={est.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{est.estimate_number}</h3>
                        <Badge className={`text-xs text-white ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{est.customer?.name || "No customer"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                      <DollarSign className="w-4 h-4" />{Number(est.total || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(est.created_at || ""), "MMM d, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No estimates found.</div>
          )}
        </div>
      )}
    </div>
  );
}
