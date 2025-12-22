import { useState } from "react";
import { useLeads, LEAD_STATUSES } from "@/hooks/useLeads";
import { LeadCard } from "@/components/crm/LeadCard";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { LeadWithDetails } from "@/hooks/useLeads";

export default function LeadPipeline() {
  const { leads, isLoading, updateLeadStatus, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleStatusChange = async (status: string) => {
    if (selectedLead) {
      await updateLeadStatus(selectedLead.id, status as any);
      setSelectedLead({ ...selectedLead, status: status as any });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
        <p className="text-muted-foreground">Track and manage your sales pipeline</p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[300px] space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((status) => {
            const statusLeads = getLeadsByStatus(status.value);
            return (
              <div key={status.value} className="min-w-[300px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <h3 className="font-medium text-foreground">{status.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {statusLeads.length}
                  </Badge>
                </div>
                <div className="space-y-3 bg-muted/30 rounded-lg p-3 min-h-[200px]">
                  {statusLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No leads
                    </p>
                  ) : (
                    statusLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedLead(lead)}
                        onDelete={() => deleteLead(lead.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
