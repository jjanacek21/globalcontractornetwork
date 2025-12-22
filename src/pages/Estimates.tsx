import { useState } from "react";
import { useEstimates, ESTIMATE_STATUSES } from "@/hooks/useEstimates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Search, MoreVertical, Eye, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { CreateEstimateDialog } from "@/components/estimates/CreateEstimateDialog";
import { EstimateDetailSheet } from "@/components/estimates/EstimateDetailSheet";
import type { EstimateWithDetails } from "@/hooks/useEstimates";

const Estimates = () => {
  const { estimates, isLoading, deleteEstimate, updateEstimate } = useEstimates();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateWithDetails | null>(null);

  const filteredEstimates = estimates.filter((estimate) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      estimate.estimate_number?.toLowerCase().includes(searchLower) ||
      estimate.customer?.name?.toLowerCase().includes(searchLower) ||
      estimate.status?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string | null) => {
    const statusConfig = ESTIMATE_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-500"}>
        {statusConfig?.label || status || "Unknown"}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground mt-1">Create and manage project estimates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Estimate
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              All Estimates
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search estimates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEstimates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">
                {searchQuery ? "No estimates match your search" : "No estimates yet. Create your first one!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((estimate) => (
                  <TableRow
                    key={estimate.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEstimate(estimate)}
                  >
                    <TableCell className="font-medium">
                      {estimate.estimate_number || "—"}
                    </TableCell>
                    <TableCell>{estimate.customer?.name || "Unknown"}</TableCell>
                    <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(estimate.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {estimate.created_at
                        ? format(new Date(estimate.created_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEstimate(estimate);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            updateEstimate(estimate.id, { status: "sent" });
                          }}>
                            <Send className="mr-2 h-4 w-4" />
                            Mark as Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEstimate(estimate.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEstimateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EstimateDetailSheet
        estimate={selectedEstimate}
        open={!!selectedEstimate}
        onOpenChange={(open) => !open && setSelectedEstimate(null)}
      />
    </div>
  );
};

export default Estimates;
