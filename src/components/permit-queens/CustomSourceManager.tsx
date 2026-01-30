import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Plus, 
  Play, 
  Trash2, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SourceWebsite {
  id: string;
  name: string;
  url: string;
  url_pattern: string | null;
  target_category: string;
  document_types: string[];
  crawl_depth: number;
  is_active: boolean;
  last_crawl_at: string | null;
  documents_found: number;
  crawl_status: string;
  error_message: string | null;
  created_at: string;
}

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'Roofing', label: 'Roofing Materials' },
  { id: 'Underlayment', label: 'Underlayment' },
  { id: 'Shingle', label: 'Shingles' },
  { id: 'Metal Roofing', label: 'Metal Roofing' },
  { id: 'Impact Window', label: 'Impact Windows' },
  { id: 'Impact Door', label: 'Impact Doors' },
  { id: 'Flat Roofing', label: 'Flat Roofing / TPO' },
];

const DOCUMENT_TYPES = [
  { id: 'noa', label: 'NOA (Notice of Acceptance)' },
  { id: 'fl_approval', label: 'FL Product Approval' },
  { id: 'ul_listing', label: 'UL Listing' },
  { id: 'icc_es', label: 'ICC-ES Report' },
];

export function CustomSourceManager() {
  const [sources, setSources] = useState<SourceWebsite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    target_category: 'all',
    document_types: ['noa', 'fl_approval'] as string[],
    crawl_depth: 2,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_source_websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources((data as SourceWebsite[]) || []);
    } catch (err) {
      console.error('Error fetching sources:', err);
      toast.error('Failed to load source websites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url) {
      toast.error('Please enter a name and URL');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('custom_source_websites')
        .insert({
          name: newSource.name,
          url: newSource.url,
          target_category: newSource.target_category,
          document_types: newSource.document_types,
          crawl_depth: newSource.crawl_depth,
        } as any);

      if (error) throw error;

      toast.success('Source added successfully');
      setShowForm(false);
      setNewSource({
        name: '',
        url: '',
        target_category: 'all',
        document_types: ['noa', 'fl_approval'],
        crawl_depth: 2,
      });
      fetchSources();
    } catch (err) {
      console.error('Error adding source:', err);
      toast.error('Failed to add source');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCrawl = async (source: SourceWebsite) => {
    setCrawlingId(source.id);
    
    try {
      // Clear previous error and reset count before starting new crawl
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'crawling', 
          error_message: null,
          documents_found: 0 
        } as any)
        .eq('id', source.id);

      // Update local state immediately for better UX
      setSources(prev => prev.map(s => 
        s.id === source.id 
          ? { ...s, crawl_status: 'crawling', error_message: null } 
          : s
      ));

      toast.info(`Starting crawl of ${source.name}...`);

      const { data, error } = await supabase.functions.invoke('crawl-source-websites', {
        body: {
          sourceId: source.id,
          url: source.url,
          targetCategory: source.target_category,
          documentTypes: source.document_types,
          crawlDepth: source.crawl_depth,
        },
      });

      if (error) throw error;

      if (data?.success) {
        if (data.documentsFound === 0 && data.totalDiscovered === 0) {
          toast.warning(
            `Crawl complete but no documents found. The search URL may not have returned results. Try using a Miami-Dade search results URL with actual product data.`,
            { duration: 8000 }
          );
        } else if (data.documentsFound === 0 && data.totalDiscovered > 0) {
          toast.warning(
            `Found ${data.totalDiscovered} items but couldn't save any. The products may already exist or lack required data.`,
            { duration: 6000 }
          );
        } else {
          const pdfMsg = data.pdfsDownloaded ? ` (${data.pdfsDownloaded} PDFs downloaded)` : '';
          toast.success(`Crawl complete! Found ${data.documentsFound || 0} documents${pdfMsg}`);
        }
      } else {
        toast.error(data?.error || 'Crawl failed');
      }

      fetchSources();
    } catch (err) {
      console.error('Crawl error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Crawl failed: ${errorMessage}`);
      
      // Update status to error
      await supabase
        .from('custom_source_websites')
        .update({ 
          crawl_status: 'error', 
          error_message: errorMessage 
        } as any)
        .eq('id', source.id);
      
      fetchSources();
    } finally {
      setCrawlingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      const { error } = await supabase
        .from('custom_source_websites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Source deleted');
      fetchSources();
    } catch (err) {
      console.error('Error deleting source:', err);
      toast.error('Failed to delete source');
    }
  };

  const toggleDocType = (docType: string) => {
    setNewSource(prev => ({
      ...prev,
      document_types: prev.document_types.includes(docType)
        ? prev.document_types.filter(t => t !== docType)
        : [...prev.document_types, docType],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'crawling':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Crawling</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Custom Source Websites
        </CardTitle>
        <CardDescription>
          Add websites for the AI to crawl and extract NOA/FL Product Approval PDFs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Source Form */}
        {showForm ? (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input
                  placeholder="e.g., Miami-Dade NOA Database"
                  value={newSource.name}
                  onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://..."
                  value={newSource.url}
                  onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Category</Label>
                <Select 
                  value={newSource.target_category} 
                  onValueChange={(v) => setNewSource(prev => ({ ...prev, target_category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Crawl Depth</Label>
                <Select 
                  value={newSource.crawl_depth.toString()} 
                  onValueChange={(v) => setNewSource(prev => ({ ...prev, crawl_depth: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Single page only</SelectItem>
                    <SelectItem value="2">2 - Follow links (recommended)</SelectItem>
                    <SelectItem value="3">3 - Deep crawl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Document Types to Find</Label>
              <div className="flex flex-wrap gap-4">
                {DOCUMENT_TYPES.map((docType) => (
                  <div key={docType.id} className="flex items-center gap-2">
                    <Checkbox
                      id={docType.id}
                      checked={newSource.document_types.includes(docType.id)}
                      onCheckedChange={() => toggleDocType(docType.id)}
                    />
                    <label htmlFor={docType.id} className="text-sm cursor-pointer">
                      {docType.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSource} disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Source
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add New Source Website
          </Button>
        )}

        {/* Sources Table */}
        {sources.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                  <TableHead>Last Crawl</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {(() => {
                            try {
                              return new URL(source.url).hostname;
                            } catch {
                              return source.url || 'Invalid URL';
                            }
                          })()}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.target_category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            {getStatusBadge(source.crawl_status)}
                          </div>
                        </TooltipTrigger>
                        {source.error_message && (
                          <TooltipContent side="bottom" className="max-w-[300px]">
                            <p className="text-xs">{source.error_message}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {source.error_message && (
                        <div className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                          {source.error_message.substring(0, 50)}...
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{source.documents_found}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {source.last_crawl_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(source.last_crawl_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCrawl(source)}
                          disabled={crawlingId === source.id || source.crawl_status === 'crawling'}
                        >
                          {crawlingId === source.id || source.crawl_status === 'crawling' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              No source websites configured. Add a source to start crawling for product approval documents.
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="text-xs">
            The AI will use Firecrawl to map each website, find PDF links, and extract NOA/FL approval documents.
            Documents are automatically matched to products in your database or stored for manual review.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
