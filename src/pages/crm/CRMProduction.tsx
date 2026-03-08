import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCRMJobs, JOB_STAGES } from "@/hooks/useCRMJobs";
import { Factory, Calendar, User } from "lucide-react";
import { format } from "date-fns";

const PRODUCTION_STAGES = ["contract_signed", "permit", "material_order", "scheduled", "in_progress", "quality_check", "completed"];

export default function CRMProduction() {
  const { jobs, isLoading } = useCRMJobs();

  const productionJobs = jobs.filter(j => PRODUCTION_STAGES.includes(j.stage));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Production</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Production</h1>
        <p className="text-muted-foreground">{productionJobs.length} jobs in production</p>
      </div>

      {/* Stage Summary */}
      <div className="flex flex-wrap gap-3">
        {JOB_STAGES.filter(s => PRODUCTION_STAGES.includes(s.value)).map(stage => {
          const count = productionJobs.filter(j => j.stage === stage.value).length;
          return (
            <div key={stage.value} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className="text-sm font-medium">{stage.label}</span>
              <Badge variant="secondary" className="text-xs">{count}</Badge>
            </div>
          );
        })}
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {productionJobs.map(job => {
          const stageInfo = JOB_STAGES.find(s => s.value === job.stage) || JOB_STAGES[0];
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Factory className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      {job.contact && <p className="text-sm text-muted-foreground">{job.contact.first_name} {job.contact.last_name}</p>}
                      {job.scheduled_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />Scheduled: {format(new Date(job.scheduled_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs text-white ${stageInfo.color}`}>{stageInfo.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {productionJobs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No jobs in production yet. Move jobs through the pipeline to see them here.</div>
        )}
      </div>
    </div>
  );
}
