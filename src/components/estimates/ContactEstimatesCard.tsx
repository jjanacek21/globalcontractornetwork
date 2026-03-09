import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Eye, Trash2, Send, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { CRMEstimate } from "@/hooks/useEstimateBuilderV2";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  approved: "bg-green-500/10 text-green-600",
  declined: "bg-destructive/10 text-destructive",
};

interface ContactEstimatesCardProps {
  estimates: CRMEstimate[];
  isLoading: boolean;
  onCreateNew: () => void;
}

export function ContactEstimatesCard({ estimates, isLoading, onCreateNew }: ContactEstimatesCardProps) {
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Estimates ({estimates.length})
          </CardTitle>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="mr-1 h-4 w-4" /> New Estimate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {estimates.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No estimates yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {estimates.map(est => {
              const margin = est.total && est.materials_cost
                ? Math.round(((est.total - (est.materials_cost + est.labor_cost)) / est.total) * 100)
                : 0;
              return (
                <div key={est.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{est.estimate_number}</p>
                        <Badge variant="outline" className={STATUS_COLORS[est.status || "draft"]}>
                          {est.status || "draft"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {est.created_at ? format(new Date(est.created_at), "MMM d, yyyy") : "—"}
                        {margin > 0 && ` · ${margin}% margin`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{fmt(est.total || 0)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
