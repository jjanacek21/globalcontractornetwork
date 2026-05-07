import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Map, Globe, Loader2, PlayCircle, Wand2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEPARTMENTS = [
  { name: 'Miami-Dade County', county: 'Miami-Dade', url: 'miamidade.gov/building' },
  { name: 'Broward County', county: 'Broward', url: 'broward.org/CodeAppeals' },
  { name: 'Boca Raton', county: 'Palm Beach', url: 'myboca.us/204/Building-Division' },
  { name: 'West Palm Beach', county: 'Palm Beach', url: 'wpb.org' },
  { name: 'Hollywood', county: 'Broward', url: 'hollywoodfl.org' },
  { name: 'Coral Springs', county: 'Broward', url: 'coralsprings.gov' },
  { name: 'Pompano Beach', county: 'Broward', url: 'pompanobeachfl.gov' },
  { name: 'Palm Beach County', county: 'Palm Beach', url: 'discover.pbcgov.org' },
  { name: 'Fort Lauderdale', county: 'Broward', url: 'fortlauderdale.gov' },
  { name: 'City of Miami', county: 'Miami-Dade', url: 'miamigov.com' },
];

interface DeptStats {
  found: number;
  downloaded: number;
  converted: number;
}

const BuildingDeptCrawlerTab = () => {
  const [loadingDept, setLoadingDept] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [crawlingAll, setCrawlingAll] = useState(false);
  const [crawlAllProgress, setCrawlAllProgress] = useState(0);
  const [results, setResults] = useState<Record<string, any>>({});
  const [deptStats, setDeptStats] = useState<Record<string, DeptStats>>({});

  // Fetch per-department stats from discovered documents
  const fetchDeptStats = async () => {
    const { data, error } = await supabase
      .from('firecrawl_discovered_documents')
      .select('department, is_downloaded, is_converted_to_smart_doc');

    if (error || !data) return;

    const stats: Record<string, DeptStats> = {};
    for (const doc of data) {
      const dept = doc.department || 'Unknown';
      if (!stats[dept]) stats[dept] = { found: 0, downloaded: 0, converted: 0 };
      stats[dept].found++;
      if (doc.is_downloaded) stats[dept].downloaded++;
      if (doc.is_converted_to_smart_doc) stats[dept].converted++;
    }
    setDeptStats(stats);
  };

  useEffect(() => { fetchDeptStats(); }, []);

  const handleAction = async (department: string, action: 'map' | 'crawl') => {
    setLoadingDept(department);
    setLoadingAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-permit-docs-crawler', {
        body: { department, action },
      });

      if (error) throw error;

      if (data?.success) {
        setResults(prev => ({ ...prev, [department]: data }));
        toast.success(`${action === 'map' ? 'Mapped' : 'Crawled'} ${department}: ${data.docsFound || data.permitUrls || 0} documents`);

        // Auto-trigger smart doc conversion for downloaded docs after crawl
        if (action === 'crawl' && (data.docsFound > 0 || data.docsDownloaded > 0)) {
          await autoConvertDocs(department);
        }

        fetchDeptStats();
      } else {
        toast.error(data?.error || `${action} failed`);
      }
    } catch (err) {
      console.error(`${action} error for ${department}:`, err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingDept(null);
      setLoadingAction(null);
    }
  };

  const autoConvertDocs = async (department: string) => {
    // Find all downloaded but unconverted docs for this department
    const { data: unconverted } = await supabase
      .from('firecrawl_discovered_documents')
      .select('id')
      .eq('department', department)
      .eq('is_downloaded', true)
      .eq('is_converted_to_smart_doc', false);

    if (!unconverted || unconverted.length === 0) return;

    toast.info(`Auto-converting ${unconverted.length} docs from ${department}...`);

    const { data, error } = await supabase.functions.invoke('firecrawl-to-smart-docs', {
      body: { documentIds: unconverted.map(d => d.id) },
    });

    if (!error && data?.success) {
      toast.success(`Converted ${data.converted} docs from ${department} to smart docs`);
      fetchDeptStats();
    }
  };

  const crawlAllDepartments = async () => {
    setCrawlingAll(true);
    setCrawlAllProgress(0);

    for (let i = 0; i < DEPARTMENTS.length; i++) {
      const dept = DEPARTMENTS[i];
      setCrawlAllProgress(Math.round(((i) / DEPARTMENTS.length) * 100));

      try {
        const { data, error } = await supabase.functions.invoke('firecrawl-permit-docs-crawler', {
          body: { department: dept.name, action: 'crawl' },
        });

        if (!error && data?.success) {
          setResults(prev => ({ ...prev, [dept.name]: data }));
          if (data.docsFound > 0 || data.docsDownloaded > 0) {
            await autoConvertDocs(dept.name);
          }
        }
      } catch (err) {
        console.error(`Crawl all error for ${dept.name}:`, err);
      }

      // Rate limit between departments
      await new Promise(r => setTimeout(r, 2000));
    }

    setCrawlAllProgress(100);
    setCrawlingAll(false);
    fetchDeptStats();
    toast.success('Finished crawling all departments!');
  };

  const downloadMissing = async (department?: string) => {
    const label = department || 'all departments';
    toast.info(`Downloading missing PDFs for ${label}...`);
    const { data, error } = await supabase.functions.invoke('firecrawl-download-discovered-pdfs', {
      body: department ? { department, limit: 200 } : { limit: 500 },
    });
    if (error || !data?.success) {
      toast.error(`Download failed for ${label}`);
      return;
    }
    toast.success(`Downloaded ${data.downloaded}/${data.total} PDFs for ${label}`);
    fetchDeptStats();
  };

  const mapAllFlorida = async () => {
    setCrawlingAll(true);
    toast.info('Mapping every building department in the database. This runs in the background.');
    const { data, error } = await supabase.functions.invoke('firecrawl-bulk-map-departments', {
      body: {},
    });
    setCrawlingAll(false);
    if (error || !data?.success) {
      toast.error('Bulk map failed');
      return;
    }
    toast.success(`Mapped ${data.total} departments. PDFs are downloading in the background.`);
    fetchDeptStats();
  };

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={mapAllFlorida} disabled={crawlingAll || !!loadingDept} size="lg">
          {crawlingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Map className="h-4 w-4 mr-2" />}
          Map All Florida Departments
        </Button>
        <Button onClick={crawlAllDepartments} disabled={crawlingAll || !!loadingDept} size="lg" variant="outline">
          {crawlingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
          Crawl All (Slow)
        </Button>
        <Button onClick={() => downloadMissing()} disabled={crawlingAll || !!loadingDept} size="lg" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Missing PDFs
        </Button>
        {crawlingAll && (
          <div className="flex-1 max-w-xs space-y-1">
            <Progress value={crawlAllProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{crawlAllProgress}% complete</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEPARTMENTS.map((dept) => {
          const result = results[dept.name];
          const stats = deptStats[dept.name];
          const isLoading = loadingDept === dept.name;

          return (
            <Card key={dept.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {dept.name}
                  </CardTitle>
                  <Badge variant="outline">{dept.county}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{dept.url}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress stats */}
                {stats && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Found: {stats.found}</span>
                      <span>Downloaded: {stats.downloaded}</span>
                      <span>Converted: {stats.converted}</span>
                    </div>
                    <Progress
                      value={stats.found > 0 ? (stats.converted / stats.found) * 100 : 0}
                      className="h-1.5"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(dept.name, 'map')}
                    disabled={isLoading || crawlingAll}
                  >
                    {isLoading && loadingAction === 'map' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Map className="h-3 w-3 mr-1" />}
                    Map Site
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(dept.name, 'crawl')}
                    disabled={isLoading || crawlingAll}
                  >
                    {isLoading && loadingAction === 'crawl' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                    Crawl for Permits
                  </Button>
                  {stats && stats.downloaded > stats.converted && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => autoConvertDocs(dept.name)}
                      disabled={isLoading || crawlingAll}
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Convert ({stats.downloaded - stats.converted})
                    </Button>
                  )}
                </div>
                {result && (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 space-y-1">
                    {result.permitUrls !== undefined && <p>URLs found: {result.permitUrls}</p>}
                    {result.docsFound !== undefined && <p>Documents: {result.docsFound}</p>}
                    {result.docsDownloaded !== undefined && <p>Downloaded: {result.docsDownloaded}</p>}
                    {result.pagesCrawled !== undefined && <p>Pages crawled: {result.pagesCrawled}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BuildingDeptCrawlerTab;
