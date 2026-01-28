import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Database,
  Zap,
  Brain,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadResult {
  productId: string;
  noaNumber: string;
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export function NOABulkManager() {
  const [noaInput, setNoaInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DownloadResult[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    withPdf: number;
    pending: number;
    aiExtracted: number;
    avgConfidence: number;
    knowledgeItems: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data: allProducts, error: allError } = await supabase
        .from('product_approvals')
        .select('id', { count: 'exact' });
      
      const { data: withPdf, error: pdfError } = await supabase
        .from('product_approvals')
        .select('id', { count: 'exact' })
        .not('file_url', 'is', null);
      
      const { data: pending, error: pendingError } = await supabase
        .from('product_approvals')
        .select('id', { count: 'exact' })
        .eq('source_status', 'pending');

      const { data: aiExtracted, error: aiError } = await supabase
        .from('product_approvals')
        .select('id, extraction_confidence', { count: 'exact' })
        .not('ai_extracted_at', 'is', null);

      // Calculate average confidence
      let avgConfidence = 0;
      if (aiExtracted && aiExtracted.length > 0) {
        const totalConfidence = aiExtracted.reduce((sum, p) => sum + (p.extraction_confidence || 0), 0);
        avgConfidence = totalConfidence / aiExtracted.length;
      }

      // Get AI knowledge item count
      const { count: knowledgeCount } = await supabase
        .from('permit_ai_knowledge')
        .select('*', { count: 'exact', head: true });

      if (!allError && !pdfError && !pendingError && !aiError) {
        setStats({
          total: allProducts?.length || 0,
          withPdf: withPdf?.length || 0,
          pending: pending?.length || 0,
          aiExtracted: aiExtracted?.length || 0,
          avgConfidence: avgConfidence,
          knowledgeItems: knowledgeCount || 0
        });
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleBulkDownload = async (fromDatabase: boolean = false) => {
    setIsDownloading(true);
    setProgress(0);
    setResults([]);

    try {
      const payload: any = {
        limit: 100,
        skipExisting: true
      };

      if (!fromDatabase && noaInput.trim()) {
        // Parse NOA numbers from input
        const noaNumbers = noaInput
          .split(/[\n,;]/)
          .map(n => n.trim())
          .filter(n => n.length > 0);
        
        if (noaNumbers.length === 0) {
          toast.error('Please enter at least one NOA number');
          setIsDownloading(false);
          return;
        }

        payload.noaNumbers = noaNumbers;
      }

      toast.info(`Starting bulk download${fromDatabase ? ' from database' : ''}...`);

      const { data, error } = await supabase.functions.invoke('noa-bulk-downloader', {
        body: payload
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setResults(data.results || []);
        setProgress(100);
        
        toast.success(
          `Downloaded ${data.downloaded} of ${data.processed} NOAs. ${data.failed} not found.`
        );
        
        // Refresh stats
        loadStats();
      } else {
        throw new Error(data.error || 'Download failed');
      }

    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          NOA Bulk Downloader
        </CardTitle>
        <CardDescription>
          Download NOA PDFs from Miami-Dade and other sources automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {stats && (
            <>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Products</div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{stats.withPdf}</div>
                <div className="text-xs text-muted-foreground">With PDFs ({stats.total > 0 ? ((stats.withPdf / stats.total) * 100).toFixed(1) : 0}%)</div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                <Brain className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{stats.aiExtracted}</div>
                <div className="text-xs text-muted-foreground">AI Extracted</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{(stats.avgConfidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-lg text-center col-span-2 md:col-span-1">
                <Sparkles className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
                <div className="text-2xl font-bold text-indigo-600">{stats.knowledgeItems}</div>
                <div className="text-xs text-muted-foreground">AI Knowledge Items</div>
              </div>
            </>
          )}
          {!stats && !isLoadingStats && (
            <div className="col-span-5 text-center py-4 text-muted-foreground">
              Click "Refresh Stats" to load product approval data
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoadingStats}>
            {isLoadingStats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Stats
          </Button>
        </div>

        {/* Quick Download from Database */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Auto-Download Missing PDFs</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Attempts to find and download PDFs for products in the database that don't have one yet.
          </p>
          <Button 
            onClick={() => handleBulkDownload(true)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Download Missing NOAs (up to 100)
              </>
            )}
          </Button>
        </div>

        {/* Manual NOA Input */}
        <div>
          <h4 className="font-medium mb-2">Or Enter Specific NOA Numbers</h4>
          <Textarea
            placeholder="Enter NOA numbers (one per line or comma-separated):
17-0620.02
21-0312.01
18-0456.03"
            value={noaInput}
            onChange={(e) => setNoaInput(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {noaInput.split(/[\n,;]/).filter(n => n.trim()).length} NOA numbers entered
            </span>
            <Button 
              onClick={() => handleBulkDownload(false)}
              disabled={isDownloading || !noaInput.trim()}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download These NOAs
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress */}
        {isDownloading && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Downloading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Results</h4>
              <div className="flex gap-2">
                <Badge className="bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {successCount} Downloaded
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  {failCount} Not Found
                </Badge>
              </div>
            </div>
            
            <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 text-sm">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-mono">{result.noaNumber}</span>
                  </div>
                  {result.success && result.fileUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={result.fileUrl} target="_blank" rel="noopener noreferrer">
                        View PDF
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
