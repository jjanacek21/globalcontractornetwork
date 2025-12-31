import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Calendar, DollarSign, Clock, Phone, 
  CheckCircle, Play, Pause, MoreVertical
} from "lucide-react";
import { ContractorJob } from "@/hooks/useContractorDashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobPipelineProps {
  jobs: ContractorJob[];
  onUpdateStatus: (jobId: string, status: string, collectedAmount?: number) => void;
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-800", icon: Clock },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800", icon: Calendar },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-800", icon: Play },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Pause },
};

export const JobPipeline = ({ jobs, onUpdateStatus }: JobPipelineProps) => {
  const columns = [
    { status: "pending", title: "Pending" },
    { status: "scheduled", title: "Scheduled" },
    { status: "in_progress", title: "In Progress" },
    { status: "completed", title: "Completed" },
  ];

  const getJobsByStatus = (status: string) => jobs.filter(j => j.status === status);

  const renderJobCard = (job: ContractorJob) => {
    const config = statusConfig[job.status as keyof typeof statusConfig];
    
    return (
      <Card key={job.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{job.homeowner_name}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {job.service_type}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {job.status === "pending" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(job.id, "scheduled")}>
                    Schedule Job
                  </DropdownMenuItem>
                )}
                {job.status === "scheduled" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(job.id, "in_progress")}>
                    Start Job
                  </DropdownMenuItem>
                )}
                {job.status === "in_progress" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(job.id, "completed", job.quoted_amount || 0)}>
                    Complete Job
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onUpdateStatus(job.id, "cancelled")}
                >
                  Cancel Job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.property_address}</span>
            </div>
            {job.homeowner_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{job.homeowner_phone}</span>
              </div>
            )}
            {job.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(job.scheduled_date).toLocaleDateString()}
                  {job.scheduled_time && ` at ${job.scheduled_time}`}
                </span>
              </div>
            )}
          </div>

          {job.quoted_amount && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Quote</span>
              <span className="font-semibold text-primary">
                ${job.quoted_amount.toLocaleString()}
              </span>
            </div>
          )}

          {job.status === "completed" && job.collected_amount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Collected</span>
              <span className="font-semibold text-green-600">
                ${job.collected_amount.toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnJobs = getJobsByStatus(column.status);
        const config = statusConfig[column.status as keyof typeof statusConfig];
        
        return (
          <div key={column.status} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <config.icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{column.title}</h3>
              </div>
              <Badge variant="secondary">{columnJobs.length}</Badge>
            </div>
            
            <div className="space-y-3 min-h-[200px] p-3 bg-muted/30 rounded-lg">
              {columnJobs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No jobs
                </p>
              ) : (
                columnJobs.map(renderJobCard)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
