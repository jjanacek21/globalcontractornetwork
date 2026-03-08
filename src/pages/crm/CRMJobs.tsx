import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCRMJobs, JOB_STAGES } from "@/hooks/useCRMJobs";
import { Plus, Search, Briefcase, MapPin, DollarSign, Calendar, Clock, MapPinned, CheckCircle, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function CRMJobs() {
  const { jobs, isLoading, createJob } = useCRMJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", job_type: "roofing", stage: "new_lead", description: "" });

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchesSearch = j.title.toLowerCase().includes(q) ||
      j.job_number?.toLowerCase().includes(q) ||
      j.contact?.first_name?.toLowerCase().includes(q) ||
      j.contact?.last_name?.toLowerCase().includes(q) ||
      j.property?.address_line1?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || j.stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!form.title) return;
    await createJob(form);
    setForm({ title: "", job_type: "roofing", stage: "new_lead", description: "" });
    setShowAdd(false);
  };

  const pendingCount = jobs.filter(j => ["new_lead", "contacted", "qualified"].includes(j.stage)).length;
  const inProgressCount = jobs.filter(j => ["in_progress", "scheduled"].includes(j.stage)).length;
  const completedCount = jobs.filter(j => j.stage === "completed").length;

  const stats = [
    { label: "Total Jobs", value: jobs.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "In Progress", value: inProgressCount, icon: MapPinned, color: "text-red-500", bg: "bg-red-50" },
    { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">{jobs.length} total jobs</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"><Plus className="mr-2 h-4 w-4" />New Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Job</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Job Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Roof Replacement - Smith" /></div>
              <div><Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roofing">Roofing</SelectItem>
                    <SelectItem value="coating">Coating</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="gutters">Gutters</SelectItem>
                    <SelectItem value="windows">Windows & Doors</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create Job</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs, job numbers, or customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {JOB_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const stageInfo = JOB_STAGES.find(s => s.value === job.stage) || JOB_STAGES[0];
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <Badge variant="outline" className="text-xs">{job.job_number}</Badge>
                          <Badge className={`text-xs text-white ${stageInfo.color}`}>{stageInfo.label}</Badge>
                        </div>
                        {job.contact && <p className="text-sm text-muted-foreground">{job.contact.first_name} {job.contact.last_name}</p>}
                        {job.property && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />{job.property.address_line1}, {job.property.city}
                          </div>
                        )}
                        {job.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{job.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Created: {format(new Date(job.created_at || ""), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.contract_amount && (
                        <div className="flex items-center gap-1 text-sm font-medium text-primary">
                          <DollarSign className="w-3 h-3" />{Number(job.contract_amount).toLocaleString()}
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Job</DropdownMenuItem>
                          <DropdownMenuItem>Change Stage</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No jobs found. Create your first job to start tracking work.</div>
          )}
        </div>
      )}
    </div>
  );
}
