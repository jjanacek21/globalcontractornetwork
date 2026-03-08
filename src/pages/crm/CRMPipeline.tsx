import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, LEAD_STATUSES, type LeadWithDetails } from "@/hooks/useLeads";
import { User, MapPin, DollarSign, GripVertical, BarChart3, Plus, Search, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PIPELINE_STAGES = [
  { value: "new", label: "New Lead", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-purple-500" },
  { value: "proposal_sent", label: "Proposal Sent", color: "bg-indigo-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-500" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
];

export default function CRMPipeline() {
  const { leads, isLoading, updateLeadStatus } = useLeads();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (status: string) => {
    if (draggedLead) {
      updateLeadStatus(draggedLead, status as any);
      setDraggedLead(null);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = l.contact ? `${l.contact.first_name} ${l.contact.last_name}` : "";
    const addr = l.property?.address_line1 || "";
    return name.toLowerCase().includes(q) || addr.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Job Pipeline</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Job Pipeline</h1>
          <p className="text-muted-foreground">Track and manage jobs through their lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />View Analytics
          </Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white">
            <Plus className="mr-2 h-4 w-4" />Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={repFilter} onValueChange={setRepFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Reps" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-[160px]" placeholder="Date From" />
        <Input type="date" className="w-[160px]" placeholder="Date To" />
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads by name, CLJ number, or address..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <CheckSquare className="mr-2 h-4 w-4" />Select Jobs
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const columnLeads = filteredLeads.filter(l => l.status === stage.value);
            const totalValue = columnLeads.reduce((sum, l) => sum + (l.expected_value || 0), 0);
            return (
              <div
                key={stage.value}
                className="min-w-[280px] max-w-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.value)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-sm text-foreground">{stage.label}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {columnLeads.length} ~&gt; ${totalValue.toLocaleString()}
                  </Badge>
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
                                <p className="text-xs text-muted-foreground truncate">{lead.property.address_line1}</p>
                              </div>
                            )}
                            {lead.expected_value && (
                              <div className="flex items-center gap-1 mt-2">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <span className="text-xs font-medium text-primary">{lead.expected_value.toLocaleString()}</span>
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
