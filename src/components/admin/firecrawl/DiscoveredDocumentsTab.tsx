import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, RefreshCw, Loader2, Wand2, Download, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface DiscoveredDoc {
  id: string;
  source_url: string;
  document_type: string;
  title: string;
  department: string;
  county: string;
  is_downloaded: boolean;
  is_converted_to_smart_doc: boolean;
  smart_doc_id: string | null;
  file_size: number | null;
  created_at: string;
}

type DocPipelineStatus = 'pending' | 'downloading' | 'converting' | 'ready';

const DiscoveredDocumentsTab = () => {
  const [docs, setDocs] = useState<DiscoveredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [converting, setConverting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('firecrawl_discovered_documents')
      .select('id, source_url, document_type, title, department, county, is_downloaded, is_converted_to_smart_doc, smart_doc_id, file_size, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) setDocs(data as DiscoveredDoc[]);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === docs.length) setSelected(new Set());
    else setSelected(new Set(docs.map(d => d.id)));
  };

  const getDocStatus = (doc: DiscoveredDoc): DocPipelineStatus => {
    if (processingIds.has(doc.id)) {
      return doc.is_downloaded ? 'converting' : 'downloading';
    }
    if (doc.is_converted_to_smart_doc) return 'ready';
    if (doc.is_downloaded) return 'pending'; // downloaded but not converted
    return 'pending';
  };

  const statusBadge = (status: DocPipelineStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'downloading':
        return <Badge className="bg-blue-500/10 text-blue-500">Downloading...</Badge>;
      case 'converting':
        return <Badge className="bg-amber-500/10 text-amber-500">Converting...</Badge>;
      case 'ready':
        return <Badge className="bg-green-500/10 text-green-500">Ready</Badge>;
    }
  };

  const convertToSmartDocs = async () => {
    const unconverted = Array.from(selected).filter(id => !docs.find(d => d.id === id)?.is_converted_to_smart_doc);
    if (unconverted.length === 0) {
      toast.info('No unconverted documents selected');
      return;
    }

    setConverting(true);
    setProcessingIds(new Set(unconverted));
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-to-smart-docs', {
        body: { documentIds: unconverted },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Converted ${data.converted} documents to smart docs`);
        fetchDocs();
      } else {
        toast.error(data?.error || 'Conversion failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setConverting(false);
      setSelected(new Set());
      setProcessingIds(new Set());
    }
  };

  const downloadAndConvertAll = async () => {
    const unconverted = docs.filter(d => !d.is_converted_to_smart_doc);
    if (unconverted.length === 0) {
      toast.info('All documents already converted');
      return;
    }

    setBulkProcessing(true);
    setProcessingIds(new Set(unconverted.map(d => d.id)));
    toast.info(`Processing ${unconverted.length} documents...`);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-to-smart-docs', {
        body: { documentIds: unconverted.map(d => d.id) },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Converted ${data.converted} of ${data.total} documents`);
        fetchDocs();
      } else {
        toast.error(data?.error || 'Bulk conversion failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBulkProcessing(false);
      setProcessingIds(new Set());
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const viewSmartDoc = async (smartDocId: string) => {
    try {
      const { data, error } = await supabase
        .from('permit_form_templates')
        .select('form_name, file_path')
        .eq('id', smartDocId)
        .maybeSingle();

      if (error || !data) {
        toast.error('Could not find smart document');
        return;
      }

      if (!data.file_path || data.file_path.startsWith('pending/')) {
        toast.error('Document file is missing or not yet uploaded');
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('permit-form-templates')
        .createSignedUrl(data.file_path, 3600);

      if (signedError || !signedData?.signedUrl) {
        toast.error('Could not generate preview URL');
        return;
      }

      setViewingDoc({ url: signedData.signedUrl, title: data.form_name || 'Smart Document' });
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const viewSourceDoc = (doc: DiscoveredDoc) => {
    if (!doc.source_url) {
      toast.error('No source URL available');
      return;
    }
    setViewingDoc({ url: doc.source_url, title: doc.title || 'Source Document' });
  };

  const unconvertedCount = docs.filter(d => !d.is_converted_to_smart_doc).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Discovered Documents ({docs.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              {unconvertedCount > 0 && (
                <Button size="sm" variant="secondary" onClick={downloadAndConvertAll} disabled={bulkProcessing || converting}>
                  {bulkProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                  Download & Convert All ({unconvertedCount})
                </Button>
              )}
              {selected.size > 0 && (
                <Button size="sm" onClick={convertToSmartDocs} disabled={converting || bulkProcessing}>
                  {converting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  Convert Selected ({selected.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selected.size === docs.length && docs.length > 0} onCheckedChange={selectAll} />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Pipeline Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map(doc => {
                const status = getDocStatus(doc);
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} />
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">{doc.title || 'Untitled'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.department || '—'}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{doc.document_type || '—'}</Badge></TableCell>
                    <TableCell>{formatSize(doc.file_size)}</TableCell>
                    <TableCell>{statusBadge(status)}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => viewSourceDoc(doc)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Source
                      </Button>
                      {doc.is_converted_to_smart_doc && doc.smart_doc_id && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => viewSmartDoc(doc.smart_doc_id!)}>
                          <FileText className="h-3 w-3 mr-1" />
                          Smart Doc
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {docs.length === 0 && !loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No discovered documents yet. Use the Building Dept Crawler to discover documents.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <PDFViewerDialog
      open={!!viewingDoc}
      onOpenChange={(open) => !open && setViewingDoc(null)}
      url={viewingDoc?.url || ''}
      title={viewingDoc?.title || 'Document Preview'}
    />
  </>;
};

export default DiscoveredDocumentsTab;
