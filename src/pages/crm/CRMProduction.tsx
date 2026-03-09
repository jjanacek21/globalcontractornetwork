import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRMJobs, JOB_STAGES, CRMJob } from "@/hooks/useCRMJobs";
import { CrewManagementTab } from "@/components/crm/CrewManagementTab";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Clock, AlertTriangle, XCircle, Package, Ruler,
  PenTool, Camera, Search, RefreshCw, GripVertical, User,
  DollarSign, ChevronRight, Calendar, CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const PRODUCTION_COLUMNS = [
  { value: "material_order", label: "Ordered", color: "bg-purple-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "quality_check", label: "Quality Check", color: "bg-amber-500" },
  { value: "completed", label: "Complete", color: "bg-green-500" },
];

// Map which job stages fall into which production column
const STAGE_TO_COLUMN: Record<string, string> = {
  material_order: "material_order",
  scheduled: "in_progress",
  in_progress: "in_progress",
  quality_check: "quality_check",
  completed: "completed",
  invoiced: "completed",
};

function getJobProgress(stage: string): number {
  const map: Record<string, number> = {
    material_order: 15,
    scheduled: 30,
    in_progress: 55,
    quality_check: 80,
    completed: 100,
    invoiced: 100,
  };
  return map[stage] ?? 0;
}

export default function CRMProduction() {
  const { jobs, isLoading, updateJob, fetchJobs } = useCRMJobs();
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<CRMJob | null>(null);
  const [stageUpdate, setStageUpdate] = useState("");
  const [jobNotes, setJobNotes] = useState("");

  const productionJobs = jobs.filter((j) =>
    ["contract_signed", "permit", "material_order", "scheduled", "in_progress", "quality_check", "completed", "submit_documents", "invoiced"].includes(j.stage)
  );

  const filteredJobs = search
    ? productionJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.contact?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
          j.contact?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
          j.job_number?.toLowerCase().includes(search.toLowerCase())
      )
    : productionJobs;

  const totalValue = productionJobs.reduce((s, j) => s + (Number(j.contract_amount) || 0), 0);
  const collectedValue = productionJobs.reduce((s, j) => s + (Number(j.collected_amount) || 0), 0);
  const completedCount = productionJobs.filter((j) => j.stage === "completed" || j.stage === "invoiced").length;

  const financialCards = [
    { label: "Total Pipeline Value", count: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "Collected Amount", count: `$${collectedValue.toLocaleString()}`, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    { label: "Outstanding", count: `$${(totalValue - collectedValue).toLocaleString()}`, icon: AlertTriangle, color: "text-destructive" },
    { label: "Completed Jobs", count: `${completedCount}`, icon: FileText, color: "text-primary" },
  ];

  const managementCards = [
    { label: "Material Orders", count: productionJobs.filter((j) => j.stage === "material_order").length, icon: Package, color: "text-purple-600 dark:text-purple-400" },
    { label: "In Progress", count: productionJobs.filter((j) => j.stage === "in_progress").length, icon: Ruler, color: "text-blue-600 dark:text-blue-400" },
    { label: "Pending QC", count: productionJobs.filter((j) => j.stage === "quality_check").length, icon: PenTool, color: "text-orange-600 dark:text-orange-400" },
    { label: "Scheduled", count: productionJobs.filter((j) => j.stage === "scheduled").length, icon: Calendar, color: "text-green-600 dark:text-green-400" },
  ];

  const handleStageChange = async () => {
    if (!selectedJob || !stageUpdate) return;
    await updateJob(selectedJob.id, { stage: stageUpdate, notes: jobNotes || selectedJob.notes });
    setSelectedJob(null);
    setStageUpdate("");
    setJobNotes("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Production Tracking</h1>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchJobs()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="secondary">{productionJobs.length} active</Badge>
        </div>
      </div>

      {/* Overview Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pipeline Completion</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{productionJobs.length} jobs complete
            </span>
          </div>
          <Progress
            value={productionJobs.length > 0 ? (completedCount / productionJobs.length) * 100 : 0}
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Financial Section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {financialCards.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{c.count}</p>
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
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
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

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {PRODUCTION_COLUMNS.map((col) => {
            const colJobs = filteredJobs.filter((j) => STAGE_TO_COLUMN[j.stage] === col.value);
            const colValue = colJobs.reduce((sum, j) => sum + (Number(j.contract_amount) || 0), 0);
            return (
              <div key={col.value} className="min-w-[300px] max-w-[320px] flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {colJobs.length} · ${colValue.toLocaleString()}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                  {colJobs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No jobs</p>
                  )}
                  {colJobs.map((job) => {
                    const progress = getJobProgress(job.stage);
                    return (
                      <Card
                        key={job.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedJob(job);
                          setStageUpdate(job.stage);
                          setJobNotes(job.notes || "");
                        }}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Address */}
                          {job.property && (
                            <p className="text-xs font-medium text-foreground truncate">
                              {job.property.address_line1}{job.property.city ? `, ${job.property.city}` : ""}
                            </p>
                          )}

                          {/* Customer */}
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            <p className="text-sm font-semibold truncate">
                              {job.contact ? `${job.contact.first_name} ${job.contact.last_name}` : job.title}
                            </p>
                          </div>

                          {/* Crew & Start Date row */}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GripVertical className="w-3 h-3" />
                              {job.tags?.length ? job.tags[0] : "Unassigned"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {job.start_date ? format(new Date(job.start_date), "MMM d") : job.scheduled_date ? format(new Date(job.scheduled_date), "MMM d") : "TBD"}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-bold text-muted-foreground">{progress}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedJob?.contact
                ? `${selectedJob.contact.first_name} ${selectedJob.contact.last_name}`
                : selectedJob?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs">Job Number</label>
                  <p className="font-medium">{selectedJob.job_number || "—"}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Contract Amount</label>
                  <p className="font-medium">${Number(selectedJob.contract_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Collected</label>
                  <p className="font-medium">${Number(selectedJob.collected_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Scheduled</label>
                  <p className="font-medium">
                    {selectedJob.scheduled_date ? format(new Date(selectedJob.scheduled_date), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Update Stage</label>
                <Select value={stageUpdate} onValueChange={setStageUpdate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <Textarea
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder="Add production notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              Cancel
            </Button>
            <Button onClick={handleStageChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
