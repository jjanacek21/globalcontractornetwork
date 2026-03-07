import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CrawlJob {
  id: string;
  job_type: string;
  target_department: string;
  status: string;
  documents_found: number;
  documents_downloaded: number;
  documents_converted: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  running: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
  cancelled: 'bg-muted text-muted-foreground',
};

const jobTypeLabels: Record<string, string> = {
  noa_search: 'NOA Search',
  permit_docs_crawl: 'Permit Docs Crawl',
  building_dept_map: 'Building Dept Map',
};

const CrawlJobsTab = () => {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('firecrawl_crawl_jobs')
      .select('id, job_type, target_department, status, documents_found, documents_downloaded, documents_converted, error_message, started_at, completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const getDuration = (job: CrawlJob) => {
    if (!job.started_at) return '—';
    const start = new Date(job.started_at);
    const end = job.completed_at ? new Date(job.completed_at) : new Date();
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Crawl Job History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Found</TableHead>
              <TableHead>Downloaded</TableHead>
              <TableHead>Converted</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell><Badge variant="outline">{jobTypeLabels[job.job_type] || job.job_type}</Badge></TableCell>
                <TableCell>{job.target_department || '—'}</TableCell>
                <TableCell>
                  <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                </TableCell>
                <TableCell>{job.documents_found}</TableCell>
                <TableCell>{job.documents_downloaded}</TableCell>
                <TableCell>{job.documents_converted}</TableCell>
                <TableCell className="font-mono text-sm">{getDuration(job)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && !loading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No crawl jobs yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {jobs.some(j => j.error_message) && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-destructive">Recent Errors:</p>
            {jobs.filter(j => j.error_message).slice(0, 3).map(j => (
              <p key={j.id} className="text-xs text-muted-foreground bg-destructive/5 p-2 rounded">{j.target_department}: {j.error_message}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrawlJobsTab;
