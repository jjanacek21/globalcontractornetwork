import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useHomeownerJobs } from '@/hooks/useHomeownerJobs';
import { CreateJobDialog } from './CreateJobDialog';
import { JobListingCard } from './JobListingCard';
import { JobResponsesList } from './JobResponsesList';

interface MyJobsSectionProps {
  userId: string;
}

export function MyJobsSection({ userId }: MyJobsSectionProps) {
  const { jobs, loading, creating, createJob, updateJobStatus, deleteJob } = useHomeownerJobs(userId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const openJobs = jobs.filter(j => j.status === 'open');
  const otherJobs = jobs.filter(j => j.status !== 'open');
  const displayedJobs = showAll ? jobs : jobs.slice(0, 3);

  const totalResponses = jobs.reduce((sum, job) => sum + (job.response_count || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-green-500" />
            My Job Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-500" />
                My Job Listings
              </CardTitle>
              {openJobs.length > 0 && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  {openJobs.length} Open
                </Badge>
              )}
              {totalResponses > 0 && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                  {totalResponses} Response{totalResponses !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium text-lg mb-1">No Jobs Posted Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Post your first job to get quotes from verified contractors
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Post Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedJobs.map((job) => (
                <div key={job.id}>
                  <JobListingCard
                    job={job}
                    isExpanded={expandedJobId === job.id}
                    onToggleExpand={() => setExpandedJobId(
                      expandedJobId === job.id ? null : job.id
                    )}
                    onClose={() => updateJobStatus(job.id, 'closed')}
                    onDelete={() => deleteJob(job.id)}
                  />
                  {expandedJobId === job.id && (
                    <div className="mt-2 ml-4 border-l-2 border-muted pl-4">
                      <JobResponsesList jobId={job.id} />
                    </div>
                  )}
                </div>
              ))}

              {jobs.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show All ({jobs.length} jobs)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createJob}
        creating={creating}
      />
    </>
  );
}
