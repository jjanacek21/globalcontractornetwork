import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { List, Map, Search, RefreshCw, ArrowLeft, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJobBoard, type JobRequest } from '@/hooks/useJobBoard';
import { JobBoardAccessGuard } from '@/components/job-board/JobBoardAccessGuard';
import { JobCard } from '@/components/job-board/JobCard';
import { JobFilters } from '@/components/job-board/JobFilters';
import { JobDetailsDialog } from '@/components/job-board/JobDetailsDialog';
import { JobBoardMap } from '@/components/job-board/JobBoardMap';

export default function JobBoard() {
  const navigate = useNavigate();
  const {
    jobs,
    loading,
    hasAccess,
    filters,
    setFilters,
    contractorLocation,
    expressInterest,
    hasResponded,
    refresh,
  } = useJobBoard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  // Filter jobs by search query
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.service_category.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query) ||
      job.city?.toLowerCase().includes(query) ||
      job.property_address?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (job: JobRequest) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  return (
    <JobBoardAccessGuard hasAccess={hasAccess} loading={loading}>
      <Helmet>
        <title>Job Marketplace | Global Contractor Network</title>
        <meta name="description" content="Browse and respond to homeowner job requests in your area" />
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">Job Marketplace</h1>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'map')}>
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <JobFilters filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {view === 'list' ? (
                <div className="space-y-4">
                  {/* Results Count */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                    </p>
                  </div>

                  {/* Jobs Grid */}
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-12 bg-background rounded-lg border">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or check back later for new opportunities.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onViewDetails={() => handleViewDetails(job)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <JobBoardMap
                    jobs={filteredJobs}
                    contractorLocation={contractorLocation}
                    onJobClick={handleViewDetails}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Details Dialog */}
        <JobDetailsDialog
          job={selectedJob}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onExpressInterest={expressInterest}
          hasResponded={hasResponded}
        />
      </div>
    </JobBoardAccessGuard>
  );
}
