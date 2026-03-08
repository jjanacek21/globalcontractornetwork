import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, LEAD_STATUSES, type LeadWithDetails } from "@/hooks/useLeads";
import { User, MapPin, DollarSign, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CRMPipeline() {
  const { leads, isLoading, updateLeadStatus } = useLeads();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: string) => {
    if (draggedLead) {
      updateLeadStatus(draggedLead, status as any);
      setDraggedLead(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[280px]">
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop leads between stages</p>
        </div>
        <Badge variant="secondary" className="text-sm">{leads.length} total leads</Badge>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {LEAD_STATUSES.map((status) => {
            const columnLeads = leads.filter(l => l.status === status.value);
            return (
              <div
                key={status.value}
                className="min-w-[280px] max-w-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status.value)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <h3 className="font-semibold text-sm text-foreground">{status.label}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">{columnLeads.length}</Badge>
                </div>

                <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                  {columnLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <p className="font-medium text-sm truncate">
                                {lead.contact ? `${lead.contact.first_name} ${lead.contact.last_name}` : "Unknown"}
                              </p>
                            </div>
                            {lead.property && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground truncate">
                                  {lead.property.address_line1}
                                </p>
                              </div>
                            )}
                            {lead.expected_value && (
                              <div className="flex items-center gap-1 mt-2">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <span className="text-xs font-medium text-primary">
                                  {lead.expected_value.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
