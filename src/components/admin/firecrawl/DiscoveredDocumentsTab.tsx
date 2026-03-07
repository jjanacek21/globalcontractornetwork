import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, RefreshCw, Loader2, Wand2, Download, Eye, Upload, ChevronDown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';
import { useDropzone } from 'react-dropzone';

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
  storage_path: string | null;
  created_at: string;
}

type DocPipelineStatus = 'pending' | 'downloading' | 'converting' | 'ready';

const COUNTIES = ['Miami-Dade', 'Broward', 'Palm Beach'];
const DEPARTMENTS = [
  'Miami-Dade County', 'City of Miami', 'Broward County', 'Hollywood',
  'Fort Lauderdale', 'Coral Springs', 'Pompano Beach', 'Boca Raton',
  'West Palm Beach', 'Palm Beach County',
];
const FORM_TYPES = [
  { value: 'permit_application', label: 'Permit Application' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'noa_form', label: 'NOA Form' },
  { value: 'inspection_form', label: 'Inspection Form' },
  { value: 'code_form', label: 'Code/Compliance Form' },
];

function getBucketForPath(filePath: string): string {
  if (!filePath) return 'permit-form-templates';
  if (filePath.startsWith('firecrawl/') || filePath.startsWith('crawled/')) {
    return 'permit-documents';
  }
  return 'permit-form-templates';
}

const DiscoveredDocumentsTab = () => {
  const [docs, setDocs] = useState<DiscoveredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [converting, setConverting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manual upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadCounty, setUploadCounty] = useState('');
  const [uploadFormType, setUploadFormType] = useState('permit_application');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadFile(file);
      if (!uploadName) setUploadName(file.name.replace(/\.pdf$/i, ''));
    }
  }, [uploadName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('firecrawl_discovered_documents')
      .select('id, source_url, document_type, title, department, county, is_downloaded, is_converted_to_smart_doc, smart_doc_id, file_size, storage_path, created_at')
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
    } catch {
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
    } catch {
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

      const bucket = getBucketForPath(data.file_path);
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
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
    if (doc.storage_path) {
      // Try signed URL from storage first
      const bucket = getBucketForPath(doc.storage_path);
      supabase.storage.from(bucket).createSignedUrl(doc.storage_path, 3600).then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setViewingDoc({ url: data.signedUrl, title: doc.title || 'Source Document' });
        } else if (doc.source_url) {
          setViewingDoc({ url: doc.source_url, title: doc.title || 'Source Document' });
        } else {
          toast.error('No viewable file available');
        }
      });
      return;
    }
    if (!doc.source_url) {
      toast.error('No source URL available');
      return;
    }
    setViewingDoc({ url: doc.source_url, title: doc.title || 'Source Document' });
  };

  const deleteDiscoveredDoc = async (doc: DiscoveredDoc) => {
    setDeletingId(doc.id);
    try {
      // If linked to a smart doc, delete that too
      if (doc.is_converted_to_smart_doc && doc.smart_doc_id) {
        const { data: smartDoc } = await supabase
          .from('permit_form_templates')
          .select('file_path')
          .eq('id', doc.smart_doc_id)
          .maybeSingle();

        if (smartDoc?.file_path) {
          const bucket = getBucketForPath(smartDoc.file_path);
          await supabase.storage.from(bucket).remove([smartDoc.file_path]);
        }
        await supabase.from('permit_form_templates').delete().eq('id', doc.smart_doc_id);
      }

      // Delete storage file if exists
      if (doc.storage_path) {
        const bucket = getBucketForPath(doc.storage_path);
        await supabase.storage.from(bucket).remove([doc.storage_path]);
      }

      // Delete discovered doc record
      const { error } = await supabase.from('firecrawl_discovered_documents').delete().eq('id', doc.id);
      if (error) throw error;

      toast.success('Document deleted');
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      setSelected(prev => { const n = new Set(prev); n.delete(doc.id); return n; });
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleManualUpload = async () => {
    if (!uploadFile || !uploadName || !uploadDept || !uploadCounty) {
      toast.error('Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      const fileName = `manual/${uploadCounty}/${uploadDept}/${Date.now()}_${uploadFile.name}`;
      const { error: storageError } = await supabase.storage
        .from('permit-form-templates')
        .upload(fileName, uploadFile, { contentType: 'application/pdf' });

      if (storageError) throw storageError;

      const { data: template, error: insertError } = await supabase
        .from('permit_form_templates')
        .insert({
          form_name: uploadName,
          form_type: uploadFormType,
          jurisdiction_name: uploadDept,
          county: uploadCounty,
          file_path: fileName,
          source: 'manual',
          analysis_status: 'pending',
          trade_types: ['general'],
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Trigger AI analysis
      const { data: urlData } = await supabase.storage
        .from('permit-form-templates')
        .createSignedUrl(fileName, 3600);

      if (urlData?.signedUrl && template?.id) {
        supabase.functions.invoke('permit-packet-analyzer', {
          body: { mode: 'detect_and_analyze', templateId: template.id, fileUrl: urlData.signedUrl },
        }).catch(() => { /* analysis is best-effort */ });
      }

      toast.success('Document uploaded and queued for AI analysis');
      setUploadFile(null);
      setUploadName('');
      setUploadDept('');
      setUploadCounty('');
      setUploadFormType('permit_application');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const unconvertedCount = docs.filter(d => !d.is_converted_to_smart_doc).length;

  return (
    <>
      <div className="space-y-4">
        {/* Manual Upload Section */}
        <Collapsible open={uploadOpen} onOpenChange={setUploadOpen}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-5 w-5" />
                    Manual Document Upload
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${uploadOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {uploadFile ? (
                    <p className="text-sm font-medium">{uploadFile.name} ({formatSize(uploadFile.size)})</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Drop a PDF here or click to browse</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Document name"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                  />
                  <Select value={uploadFormType} onValueChange={setUploadFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORM_TYPES.map(ft => (
                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={uploadCounty} onValueChange={setUploadCounty}>
                    <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
                    <SelectContent>
                      {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={uploadDept} onValueChange={setUploadDept}>
                    <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleManualUpload} disabled={uploading || !uploadFile}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload & Analyze
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Discovered Documents Table */}
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
                      <TableCell>
                        <div className="flex gap-1">
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" disabled={deletingId === doc.id}>
                                {deletingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete document?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{doc.title || 'Untitled'}"
                                  {doc.is_converted_to_smart_doc && ' and its linked smart document template'}.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDiscoveredDoc(doc)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
    </>
  );
};

export default DiscoveredDocumentsTab;
