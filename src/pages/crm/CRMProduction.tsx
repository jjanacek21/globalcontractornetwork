import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCRMJobs, JOB_STAGES } from "@/hooks/useCRMJobs";
import { FileText, Clock, AlertTriangle, XCircle, Package, Ruler, PenTool, Camera, Search, RefreshCw, GripVertical, User, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const PRODUCTION_KANBAN = [
  { value: "submit_documents", label: "Submit Documents", color: "bg-blue-500" },
  { value: "permit", label: "Permit Processing", color: "bg-yellow-500" },
  { value: "material_order", label: "Materials and Labor", color: "bg-purple-500" },
  { value: "in_progress", label: "In Progress", color: "bg-green-500" },
];

export default function CRMProduction() {
  const { jobs, isLoading } = useCRMJobs();
  const [search, setSearch] = useState("");

  const productionJobs = jobs.filter(j => ["contract_signed", "permit", "material_order", "scheduled", "in_progress", "quality_check", "completed", "submit_documents"].includes(j.stage));

  const financialCards = [
    { label: "Financial Worksheets", count: 0, icon: FileText, color: "text-blue-500" },
    { label: "Pending Invoices", count: 0, icon: Clock, color: "text-yellow-500" },
    { label: "Overdue Invoices", count: 0, icon: AlertTriangle, color: "text-red-500" },
    { label: "Canceled Jobs w/Outstanding", count: 0, icon: XCircle, color: "text-gray-500" },
  ];

  const managementCards = [
    { label: "Material Orders to Place", count: 0, icon: Package, color: "text-purple-500" },
    { label: "Measurement Requests", count: 0, icon: Ruler, color: "text-indigo-500" },
    { label: "Pending Signatures", count: 0, icon: PenTool, color: "text-orange-500" },
    { label: "Photos Today", count: 0, icon: Camera, color: "text-green-500" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Production Tracking</h1>
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Production Tracking</h1>
          <p className="text-muted-foreground">Monitor and manage active construction projects</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Badge variant="secondary">{productionJobs.length} active projects</Badge>
        </div>
      </div>

      {/* Financial Section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {financialCards.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.count}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Management Section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {managementCards.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.count}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {PRODUCTION_KANBAN.map(stage => {
            const stageJobs = productionJobs.filter(j => j.stage === stage.value);
            const totalValue = stageJobs.reduce((sum, j) => sum + (Number(j.contract_amount) || 0), 0);
            return (
              <div key={stage.value} className="min-w-[280px] max-w-[300px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">{stageJobs.length} · ${totalValue.toLocaleString()}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                  {stageJobs.map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-[10px]">
                                {Math.floor((Date.now() - new Date(job.created_at || "").getTime()) / 86400000)}d
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">Assigned</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <p className="font-medium text-sm truncate">
                                {job.contact ? `${job.contact.first_name} ${job.contact.last_name}` : job.title}
                              </p>
                            </div>
                            {job.contract_amount && (
                              <div className="flex items-center gap-1 mt-1">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <span className="text-xs font-medium text-primary">${Number(job.contract_amount).toLocaleString()}</span>
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
