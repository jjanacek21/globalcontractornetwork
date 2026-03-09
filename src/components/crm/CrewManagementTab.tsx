import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Users, Briefcase, UserCheck, UserX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CRMJob } from "@/hooks/useCRMJobs";

interface CrewMember {
  id: string;
  user_id: string;
  job_title: string | null;
  role: string;
  is_active: boolean | null;
  team_id: string | null;
  profile?: { first_name: string | null; last_name: string | null; email: string | null };
  team?: { name: string } | null;
}

type AvailabilityStatus = "available" | "on_job" | "off";

const statusConfig: Record<AvailabilityStatus, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: "Available", color: "bg-green-500", icon: UserCheck },
  on_job: { label: "On Job", color: "bg-amber-500", icon: Briefcase },
  off: { label: "Off", color: "bg-muted-foreground", icon: UserX },
};

interface CrewManagementTabProps {
  jobs: CRMJob[];
  onAssignCrew: (jobId: string, crewMemberId: string) => Promise<void>;
}

export function CrewManagementTab({ jobs, onAssignCrew }: CrewManagementTabProps) {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const { toast } = useToast();

  // Track which crew members are assigned to active jobs
  const assignedCrewIds = new Set(
    jobs
      .filter((j) => ["in_progress", "scheduled", "material_order", "quality_check"].includes(j.stage))
      .map((j) => (j as any).assigned_crew_id)
      .filter(Boolean)
  );

  const getStatus = (member: CrewMember): AvailabilityStatus => {
    if (!member.is_active) return "off";
    if (assignedCrewIds.has(member.id)) return "on_job";
    return "available";
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_members")
        .select("id, user_id, job_title, role, is_active, team_id, profile:profiles(first_name, last_name, email), team:teams(name)")
        .eq("is_active", true)
        .order("role");

      if (error) throw error;
      setMembers((data as any) || []);
    } catch (err: any) {
      toast({ title: "Error loading crew", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const getAssignedJobs = (memberId: string) =>
    jobs.filter((j) => (j as any).assigned_crew_id === memberId || j.assigned_rep_id === memberId);

  const handleDispatch = async () => {
    if (!selectedMemberId || !selectedJobId) return;
    setDispatching(true);
    try {
      await onAssignCrew(selectedJobId, selectedMemberId);
      toast({ title: "Crew dispatched successfully" });
      setDispatchOpen(false);
      setSelectedMemberId(null);
      setSelectedJobId("");
    } catch (err: any) {
      toast({ title: "Error dispatching crew", description: err.message, variant: "destructive" });
    } finally {
      setDispatching(false);
    }
  };

  const unassignedJobs = jobs.filter(
    (j) => ["scheduled", "in_progress", "material_order"].includes(j.stage) && !(j as any).assigned_crew_id
  );

  const availableCount = members.filter((m) => getStatus(m) === "available").length;
  const onJobCount = members.filter((m) => getStatus(m) === "on_job").length;
  const offCount = members.filter((m) => getStatus(m) === "off").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableCount}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onJobCount}</p>
              <p className="text-xs text-muted-foreground">On Job</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <UserX className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{offCount}</p>
              <p className="text-xs text-muted-foreground">Off</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crew List */}
      <div className="space-y-3">
        {members.map((member) => {
          const status = getStatus(member);
          const cfg = statusConfig[status];
          const StatusIcon = cfg.icon;
          const assignedJobs = getAssignedJobs(member.id);
          const name = member.profile
            ? `${member.profile.first_name || ""} ${member.profile.last_name || ""}`.trim()
            : "Unknown";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <Card key={member.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {member.job_title || member.role}
                      </Badge>
                      {member.team && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Users className="w-3 h-3 mr-1" />
                          {member.team.name}
                        </Badge>
                      )}
                    </div>

                    {/* Assigned jobs */}
                    {assignedJobs.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assignedJobs.map((j) => (
                          <span key={j.id} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {j.job_number || j.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">No assigned jobs</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </div>
                  </div>

                  {/* Dispatch button */}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={status === "off"}
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setSelectedJobId("");
                      setDispatchOpen(true);
                    }}
                  >
                    Dispatch
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {members.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No crew members found. Add team members to your company first.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dispatch Modal */}
      <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dispatch Crew Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign{" "}
              <strong>
                {(() => {
                  const m = members.find((m) => m.id === selectedMemberId);
                  return m?.profile ? `${m.profile.first_name} ${m.profile.last_name}` : "crew member";
                })()}
              </strong>{" "}
              to a job:
            </p>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                {unassignedJobs.length === 0 && (
                  <SelectItem value="none" disabled>
                    No unassigned jobs
                  </SelectItem>
                )}
                {unassignedJobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.job_number || j.title} — {j.contact ? `${j.contact.first_name} ${j.contact.last_name}` : ""}
                  </SelectItem>
                ))}
                {/* Also allow assigning to any active job */}
                {jobs
                  .filter((j) => ["scheduled", "in_progress", "material_order"].includes(j.stage))
                  .filter((j) => !unassignedJobs.find((u) => u.id === j.id))
                  .map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.job_number || j.title} — {j.contact ? `${j.contact.first_name} ${j.contact.last_name}` : ""} (has crew)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispatch} disabled={!selectedJobId || dispatching}>
              {dispatching ? "Dispatching..." : "Dispatch Crew"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
