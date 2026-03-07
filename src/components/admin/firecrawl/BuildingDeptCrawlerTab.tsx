import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Map, Globe, Loader2 } from 'lucide-react';
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

const BuildingDeptCrawlerTab = () => {
  const [loadingDept, setLoadingDept] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEPARTMENTS.map((dept) => {
          const result = results[dept.name];
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(dept.name, 'map')}
                    disabled={isLoading}
                  >
                    {isLoading && loadingAction === 'map' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Map className="h-3 w-3 mr-1" />}
                    Map Site
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(dept.name, 'crawl')}
                    disabled={isLoading}
                  >
                    {isLoading && loadingAction === 'crawl' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                    Crawl for Permits
                  </Button>
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
