import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchSourceResult {
  success: boolean;
  results?: {
    total: number;
    sourced: number;
    failed: number;
    skipped: number;
    byCategory: Record<string, { sourced: number; failed: number }>;
  };
  message?: string;
  error?: string;
}

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'Underlayment', label: 'Underlayment (Priority 1)' },
  { id: 'Shingle', label: 'Shingles (Priority 2)' },
  { id: 'Metal Roofing', label: 'Metal Roofing (Priority 3)' },
  { id: 'Impact Window', label: 'Impact Windows (Priority 4)' },
  { id: 'Impact Door', label: 'Impact Doors (Priority 5)' },
  { id: 'Flat Roofing', label: 'Flat Roofing / TPO / EPDM' },
  { id: 'Tile Roofing', label: 'Tile Roofing' },
  { id: 'Roofing Fasteners', label: 'Roofing Fasteners' },
];

export function BatchProductSourcing() {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [forceRescan, setForceRescan] = useState(false);
  const [limit, setLimit] = useState<number>(50);
  const [result, setResult] = useState<BatchSourceResult | null>(null);

  const runBatchSourcing = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      toast.info('Starting batch product sourcing...', {
        description: `Processing ${selectedCategory === 'all' ? 'all categories' : selectedCategory} (limit: ${limit})`,
      });

      const { data, error } = await supabase.functions.invoke('batch-source-products', {
        body: {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit,
          forceRescan,
          priorityOrder: ['Underlayment', 'Shingle', 'Metal Roofing', 'Impact Window', 'Impact Door'],
        },
      });

      if (error) throw error;

      setResult(data as BatchSourceResult);

      if (data?.success) {
        toast.success('Batch sourcing complete!', {
          description: `Found PDFs for ${data.results?.sourced || 0} of ${data.results?.total || 0} products`,
        });
      } else {
        toast.error('Batch sourcing failed', {
          description: data?.error || 'Unknown error',
        });
      }
    } catch (err) {
      console.error('Batch sourcing error:', err);
      toast.error('Failed to run batch sourcing', {
        description: err instanceof Error ? err.message : 'Check the console for details',
      });
      setResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsRunning(false);
    }
  };

  const getProgressPercent = () => {
    if (!result?.results) return 0;
    const { sourced, failed, total } = result.results;
    return Math.round(((sourced + failed) / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Batch Product PDF Sourcing
        </CardTitle>
        <CardDescription>
          Automatically search and download NOA/FL Product Approval PDFs for products in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Batch Size</Label>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 products</SelectItem>
                <SelectItem value="25">25 products</SelectItem>
                <SelectItem value="50">50 products</SelectItem>
                <SelectItem value="100">100 products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={forceRescan}
                onCheckedChange={setForceRescan}
                id="force-rescan"
              />
              <Label htmlFor="force-rescan" className="text-sm font-normal cursor-pointer">
                Force re-scan (include previously processed)
              </Label>
            </div>
          </div>
        </div>

        {/* Quick Start Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => {
              setSelectedCategory('Underlayment');
              setTimeout(runBatchSourcing, 100);
            }} 
            disabled={isRunning}
            variant="secondary"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Quick: Underlayment (Priority 1)
          </Button>
          <Button 
            onClick={() => {
              setSelectedCategory('Shingle');
              setTimeout(runBatchSourcing, 100);
            }} 
            disabled={isRunning}
            variant="secondary"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Quick: Shingles
          </Button>
        </div>

        {/* Run Button */}
        <Button 
          onClick={runBatchSourcing} 
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching & Downloading PDFs...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Start Batch Sourcing
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{result.message}</span>
                </div>

                {result.results && (
                  <>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{result.results.total}</div>
                        <div className="text-xs text-muted-foreground">Total Processed</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result.results.sourced}</div>
                        <div className="text-xs text-green-600">PDFs Found</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{result.results.failed}</div>
                        <div className="text-xs text-red-600">Not Found</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-muted-foreground">{result.results.skipped}</div>
                        <div className="text-xs text-muted-foreground">Skipped</div>
                      </div>
                    </div>

                    <Progress value={getProgressPercent()} className="h-2" />

                    {/* By Category Breakdown */}
                    {Object.keys(result.results.byCategory).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">By Category:</Label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(result.results.byCategory).map(([cat, stats]) => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat}: {stats.sourced}/{stats.sourced + stats.failed} found
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error || 'Batch sourcing failed. Check the console for details.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info */}
        <Alert>
          <FolderOpen className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This tool searches official sources (floridabuilding.org, miamidade.gov, manufacturer sites) 
            for NOA and FL Product Approval PDFs. Found documents are stored locally in the 
            product-approvals storage bucket and linked to product records.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
