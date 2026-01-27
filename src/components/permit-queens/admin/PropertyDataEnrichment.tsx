import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectWithoutYearBuilt {
  id: string;
  property_address: string;
  jurisdiction_county: string | null;
  city: string | null;
  year_built: number | null;
  created_at: string;
}

export function PropertyDataEnrichment() {
  const [projects, setProjects] = useState<ProjectWithoutYearBuilt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchProjectsWithMissingData();
  }, []);

  const fetchProjectsWithMissingData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('permit_projects')
      .select('id, property_address, jurisdiction_county, city, year_built, created_at')
      .is('year_built', null)
      .not('property_address', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to fetch projects');
      console.error(error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const lookupPropertyData = async (project: ProjectWithoutYearBuilt) => {
    setProcessing(project.id);
    
    try {
      // Determine county for API call
      const countyMap: Record<string, string> = {
        'miami-dade': 'miami_dade',
        'miami_dade': 'miami_dade',
        'broward': 'broward',
        'palm beach': 'palm_beach',
        'palm_beach': 'palm_beach'
      };
      
      const county = countyMap[project.jurisdiction_county?.toLowerCase()] || 'palm_beach';

      const { data, error } = await supabase.functions.invoke('property-appraiser-lookup', {
        body: {
          address: project.property_address,
          county
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.yearBuilt) {
        // Update project with year_built
        const { error: updateError } = await supabase
          .from('permit_projects')
          .update({ year_built: data.data.yearBuilt })
          .eq('id', project.id);

        if (updateError) throw updateError;

        toast.success('Property data updated', {
          description: `Year built: ${data.data.yearBuilt}`
        });

        // Refresh list
        setProjects(prev => prev.filter(p => p.id !== project.id));
      } else {
        toast.info('Year built not found', {
          description: data?.message || 'Try manual lookup at the county property appraiser site'
        });
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('Failed to lookup property data', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(null);
    }
  };

  const batchLookup = async () => {
    if (projects.length === 0) return;

    setBatchProcessing(true);
    setProgress({ current: 0, total: projects.length });

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      setProgress({ current: i + 1, total: projects.length });
      
      try {
        await lookupPropertyData(project);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn(`Failed to lookup ${project.property_address}:`, error);
      }
    }

    setBatchProcessing(false);
    await fetchProjectsWithMissingData();
  };

  const projectsWithPre1994Risk = projects.filter(p => 
    p.property_address?.toLowerCase().includes('old') ||
    p.property_address?.toLowerCase().includes('historic')
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Property Data Enrichment
        </CardTitle>
        <CardDescription>
          Automatically fetch year built and other property data from county property appraiser records.
          This enables Section 1524 compliance checks for pre-1994 buildings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-xs text-muted-foreground">Missing Year Built</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">{projectsWithPre1994Risk.length}</div>
            <div className="text-xs text-amber-600">Potential Pre-1994</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              <CheckCircle2 className="h-6 w-6 inline" />
            </div>
            <div className="text-xs text-green-600">Auto-Lookup Available</div>
          </div>
        </div>

        {/* Batch Processing Progress */}
        {batchProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing properties...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={batchLookup} 
            disabled={batchProcessing || projects.length === 0}
          >
            {batchProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Auto-Lookup All ({projects.length})
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchProjectsWithMissingData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All permit projects have year built data populated. No enrichment needed.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {projects.map(project => (
              <div 
                key={project.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{project.property_address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {project.jurisdiction_county}
                      </Badge>
                      {project.city && (
                        <Badge variant="secondary" className="text-xs">
                          {project.city}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => lookupPropertyData(project)}
                  disabled={processing === project.id || batchProcessing}
                >
                  {processing === project.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      Lookup
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Property lookups use county property appraiser APIs. Some addresses may not be found 
            automatically and require manual verification. Pre-1994 buildings trigger Section 1524 
            deck renailing requirements.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
