import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, RefreshCw, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiscoveredDoc {
  id: string;
  source_url: string;
  document_type: string;
  title: string;
  department: string;
  county: string;
  is_downloaded: boolean;
  is_converted_to_smart_doc: boolean;
  file_size: number | null;
  created_at: string;
}

const DiscoveredDocumentsTab = () => {
  const [docs, setDocs] = useState<DiscoveredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [converting, setConverting] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('firecrawl_discovered_documents')
      .select('id, source_url, document_type, title, department, county, is_downloaded, is_converted_to_smart_doc, file_size, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) setDocs(data);
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

  const convertToSmartDocs = async () => {
    const unconverted = Array.from(selected).filter(id => !docs.find(d => d.id === id)?.is_converted_to_smart_doc);
    if (unconverted.length === 0) {
      toast.info('No unconverted documents selected');
      return;
    }

    setConverting(true);
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
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

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
              {selected.size > 0 && (
                <Button size="sm" onClick={convertToSmartDocs} disabled={converting}>
                  {converting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  Convert to Smart Docs ({selected.size})
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
                <TableHead>Downloaded</TableHead>
                <TableHead>Smart Doc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map(doc => (
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
                  <TableCell>
                    {doc.is_downloaded
                      ? <Badge className="bg-green-500/10 text-green-500">Yes</Badge>
                      : <Badge variant="secondary">No</Badge>}
                  </TableCell>
                  <TableCell>
                    {doc.is_converted_to_smart_doc
                      ? <Badge className="bg-blue-500/10 text-blue-500">Converted</Badge>
                      : <Badge variant="secondary">Pending</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {docs.length === 0 && !loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No discovered documents yet. Use the Building Dept Crawler to discover documents.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoveredDocumentsTab;
