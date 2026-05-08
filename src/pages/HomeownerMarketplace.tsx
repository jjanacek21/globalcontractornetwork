import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Briefcase, Loader2, Search, List, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useHomeownerJobs, JobRequest } from '@/hooks/useHomeownerJobs';
import { CreateJobDialog } from '@/components/homeowner/CreateJobDialog';
import { JobResponsesList } from '@/components/homeowner/JobResponsesList';
import { MyListingMiniCard } from '@/components/homeowner/MyListingMiniCard';
import { PublicJobCard } from '@/components/homeowner/PublicJobCard';
import { PublicMarketplaceMap } from '@/components/homeowner/PublicMarketplaceMap';
import { toast } from 'sonner';

interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  service_category: string;
  urgency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  photos: string[];
  created_at: string | null;
  lat: number | null;
  lng: number | null;
}

export default function HomeownerMarketplace() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobRequest | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publicJobs, setPublicJobs] = useState<PublicJob[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [browseView, setBrowseView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/network-login');
        return;
      }
      setUserId(data.user.id);
      setAuthLoading(false);
    })();
  }, [navigate]);

  const { jobs, loading, creating, createJob, updateJobStatus, deleteJob, refresh } =
    useHomeownerJobs(userId);

  // Fetch public marketplace listings (other homeowners' open jobs, address-redacted)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setPublicLoading(true);
      const { data, error } = await supabase
        .from('job_requests')
        .select('id,title,description,service_category,urgency,budget_min,budget_max,timeline,photos,created_at,homeowner_id,status,lat,lng')
        .eq('status', 'open')
        .neq('homeowner_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        console.error(error);
      } else {
        const sanitized = (data || []).map((j: any) => {
          let photos: string[] = [];
          if (j.photos) {
            try {
              photos = Array.isArray(j.photos) ? j.photos : JSON.parse(j.photos);
            } catch {
              photos = [];
            }
          }
          return {
            id: j.id,
            title: j.title,
            description: j.description,
            service_category: j.service_category,
            urgency: j.urgency,
            budget_min: j.budget_min,
            budget_max: j.budget_max,
            timeline: j.timeline,
            photos,
            created_at: j.created_at,
            lat: j.lat !== null && j.lat !== undefined ? Number(j.lat) : null,
            lng: j.lng !== null && j.lng !== undefined ? Number(j.lng) : null,
          } as PublicJob;
        });
        setPublicJobs(sanitized);
      }
      setPublicLoading(false);
    })();
  }, [userId]);

  const handleEditJob = (job: JobRequest) => {
    // For v1: open create dialog. Editing wires future enhancement.
    setEditingJob(job);
    toast.info('Editing coming soon — for now you can close and repost.');
  };

  const filteredPublic = publicJobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.service_category.toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Job Marketplace | Property Owner</title>
        <meta name="description" content="Post jobs and browse listings from other property owners" />
      </Helmet>

      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/member/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Job Marketplace</h1>
          </div>
          <Button onClick={() => { setEditingJob(null); setCreateOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Post a Job
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-10">
        {/* My Listings */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold">My Listings</h2>
            <span className="text-sm text-muted-foreground">{jobs.length} total</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 gap-3">
                <Briefcase className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Post Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <MyListingMiniCard
                    key={job.id}
                    job={job}
                    isExpanded={expandedId === job.id}
                    onEdit={() => handleEditJob(job)}
                    onViewResponses={() =>
                      setExpandedId(expandedId === job.id ? null : job.id)
                    }
                    onClose={() => updateJobStatus(job.id, 'closed')}
                    onDelete={() => deleteJob(job.id)}
                  />
                ))}
              </div>
              {expandedId && (
                <Card>
                  <CardContent className="pt-6">
                    <JobResponsesList jobId={expandedId} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Browse Marketplace */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">Browse Marketplace</h2>
              <p className="text-sm text-muted-foreground">
                See what other property owners are paying — view-only. Personal info is hidden.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by type, title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {publicLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPublic.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No listings found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublic.map((j) => (
                <PublicJobCard key={j.id} job={j} />
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateJobDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createJob}
        creating={creating}
      />
    </div>
  );
}
