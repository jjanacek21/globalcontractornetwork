import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Wand2,
  FileUp,
  X,
  FolderOpen,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface AnalyzedDocument {
  id: string;
  form_name: string;
  form_type: string;
  file_path: string;
  is_fillable: boolean;
  field_count: number;
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'error';
  building_dept_id: string | null;
  jurisdiction_name: string | null;
  trade_types: string[];
  created_at: string;
  last_analyzed_at: string | null;
}

interface AnalysisStats {
  total: number;
  pending: number;
  analyzing: number;
  complete: number;
  error: number;
  totalFields: number;
  fillable: number;
}

export function DocumentIntelligence() {
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_form_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as AnalyzedDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = useCallback((): AnalysisStats => {
    const stats: AnalysisStats = {
      total: documents.length,
      pending: 0,
      analyzing: 0,
      complete: 0,
      error: 0,
      totalFields: 0,
      fillable: 0
    };

    documents.forEach(doc => {
      if (doc.analysis_status === 'pending') stats.pending++;
      else if (doc.analysis_status === 'analyzing') stats.analyzing++;
      else if (doc.analysis_status === 'complete') stats.complete++;
      else if (doc.analysis_status === 'error') stats.error++;

      stats.totalFields += doc.field_count || 0;
      if (doc.is_fillable) stats.fillable++;
    });

    return stats;
  }, [documents]);

  const stats = calculateStats();

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast.warning(`${files.length - pdfFiles.length} non-PDF files were skipped`);
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        const timestamp = Date.now();
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace('.pdf', '');
        const filePath = `uploads/${safeName}-${timestamp}.pdf`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('permit-form-templates')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create template record
        const { data: template, error: insertError } = await supabase
          .from('permit_form_templates')
          .insert({
            form_name: file.name.replace('.pdf', ''),
            form_type: 'other',
            file_path: filePath,
            is_fillable: false,
            field_count: 0,
            analysis_status: 'pending'
          } as any)
          .select()
          .single();

        if (insertError) throw insertError;

        // Trigger analysis
        const { data: urlData } = await supabase.storage
          .from('permit-form-templates')
          .createSignedUrl(filePath, 3600);

        if (urlData?.signedUrl) {
          supabase.functions.invoke('permit-packet-analyzer', {
            body: {
              mode: 'detect_and_analyze',
              templateId: template.id,
              fileUrl: urlData.signedUrl,
              filePath: filePath
            }
          }).catch(console.warn);
        }

        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} document(s) uploaded`, {
        description: 'AI analysis started in background'
      });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} document(s) failed to upload`);
    }

    setSelectedFiles([]);
    setUploading(false);
    fetchDocuments();
  };

  const triggerAnalysis = async (doc: AnalyzedDocument) => {
    setAnalyzing(doc.id);
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from('permit-form-templates')
        .createSignedUrl(doc.file_path, 3600);

      if (urlError || !urlData?.signedUrl) {
        throw new Error('Failed to access document');
      }

      await supabase.functions.invoke('permit-packet-analyzer', {
        body: {
          mode: 'detect_and_analyze',
          templateId: doc.id,
          fileUrl: urlData.signedUrl
        }
      });

      toast.success('Analysis started');
      setTimeout(fetchDocuments, 3000);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to start analysis');
    } finally {
      setAnalyzing(null);
    }
  };

  const viewDocument = async (doc: AnalyzedDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('permit-form-templates')
        .createSignedUrl(doc.file_path, 3600);

      if (error || !data?.signedUrl) {
        toast.error('Failed to access document');
        return;
      }

      setViewingDocument({ url: data.signedUrl, name: doc.form_name });
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to open document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Badge>;
      case 'analyzing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.form_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.jurisdiction_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.analysis_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.complete}</p>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.analyzing}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.error}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalFields}</p>
                <p className="text-xs text-muted-foreground">Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.fillable}</p>
                <p className="text-xs text-muted-foreground">AI-Fillable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Batch Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Document Intelligence Upload
              </CardTitle>
              <CardDescription>
                Upload PDF forms to automatically detect fillable fields and convert to smart templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('batch-upload')?.click()}
              >
                <input
                  id="batch-upload"
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Drop PDF files here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will analyze each document for fillable fields and jurisdiction
                </p>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{selectedFiles.length} file(s) selected</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024).toFixed(0)} KB
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleBatchUpload} 
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading & Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Upload & Start AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  AI analysis detects: form type, jurisdiction, trade, fillable fields, and signature requirements
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Analyzed Documents
                  </CardTitle>
                  <CardDescription>
                    Documents processed by AI for smart form filling
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDocuments}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'complete', 'analyzing', 'pending', 'error'].map(status => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Documents Table */}
              {filteredDocuments.length === 0 ? (
                <Alert>
                  <FolderOpen className="h-4 w-4" />
                  <AlertDescription>
                    {documents.length === 0 
                      ? 'No documents uploaded yet. Use the Batch Upload tab to add PDFs.'
                      : 'No documents match your search criteria.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Jurisdiction</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fields</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {doc.form_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.form_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.jurisdiction_name || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.analysis_status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{doc.field_count || 0}</span>
                              {doc.is_fillable && (
                                <Sparkles className="h-3 w-3 text-primary" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => triggerAnalysis(doc)}
                                disabled={analyzing === doc.id}
                              >
                                {analyzing === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Analysis Progress */}
              {stats.analyzing > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        AI Analysis in Progress
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {stats.analyzing} document(s) being analyzed
                      </p>
                    </div>
                    <Progress 
                      value={(stats.complete / Math.max(stats.total, 1)) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Viewer */}
      <PDFViewerDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        url={viewingDocument?.url || ''}
        title={viewingDocument?.name || 'Document'}
        filename={`${viewingDocument?.name || 'document'}.pdf`}
      />
    </div>
  );
}
