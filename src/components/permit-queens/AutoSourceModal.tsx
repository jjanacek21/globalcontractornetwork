import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Download, Eye, CheckCircle2, ExternalLink, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface SearchResult {
  id: string;
  title: string;
  manufacturer: string;
  noa_number: string | null;
  fl_number: string | null;
  pdf_url: string;
  source: 'product_approvals' | 'noa_search' | 'fl_search';
  category: string;
  expiration_date: string | null;
}

interface AutoSourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  documentType: string;
  documentName: string;
  productCategory?: string;
  onDocumentSelected: (pdfUrl: string, storagePath: string) => void;
}

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  product_approvals: { label: 'Library', className: 'bg-green-500/10 text-green-700' },
  noa_search: { label: 'Miami-Dade NOA', className: 'bg-blue-500/10 text-blue-700' },
  fl_search: { label: 'FL Approval', className: 'bg-purple-500/10 text-purple-700' },
};

export function AutoSourceModal({
  open,
  onOpenChange,
  projectId,
  documentType,
  documentName,
  productCategory,
  onDocumentSelected,
}: AutoSourceModalProps) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    setResults([]);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('product-document-search', {
        body: { projectId, documentType, productCategory },
      });

      if (error) throw error;
      if (data?.success) {
        setResults(data.results || []);
        if ((data.results || []).length === 0) {
          toast.info('No matching documents found. Try uploading manually.');
        }
      } else {
        toast.error(data?.error || 'Search failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      console.error('Auto-source search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDocument = async (result: SearchResult) => {
    setDownloading(result.id);

    try {
      // If it's already in our storage (product_approvals with internal path), just link it
      if (result.source === 'product_approvals' && !result.pdf_url.startsWith('http')) {
        onDocumentSelected(result.pdf_url, result.pdf_url);
        toast.success(`Linked "${result.title}" to packet`);
        onOpenChange(false);
        return;
      }

      // Download external PDF to Supabase storage
      const fileName = `${documentType}_${Date.now()}.pdf`;
      const storagePath = `sourced/${projectId}/${fileName}`;

      // Fetch the PDF via proxy
      const { data: proxyData, error: proxyError } = await supabase.functions.invoke('pdf-proxy', {
        body: { url: result.pdf_url },
      });

      if (proxyError) {
        // If proxy fails, try direct URL
        onDocumentSelected(result.pdf_url, result.pdf_url);
        toast.success(`Linked "${result.title}" (external URL)`);
        onOpenChange(false);
        return;
      }

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(storagePath, proxyData, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: use external URL directly
        onDocumentSelected(result.pdf_url, result.pdf_url);
        toast.success(`Linked "${result.title}" (external URL)`);
        onOpenChange(false);
        return;
      }

      // Save to permit_project_documents
      await supabase.from('permit_project_documents').upsert({
        project_id: projectId,
        document_type: documentType,
        file_path: storagePath,
        file_name: result.title,
        source: 'auto_sourced',
      }, { onConflict: 'project_id,document_type' });

      onDocumentSelected(result.pdf_url, storagePath);
      toast.success(`Downloaded and linked "${result.title}"`);
      onOpenChange(false);
    } catch (err) {
      console.error('Document selection error:', err);
      toast.error('Failed to download document. Try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Auto-Source: {documentName}
            </DialogTitle>
            <DialogDescription>
              Search product approval databases for matching documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!hasSearched && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Search Miami-Dade NOA database and Florida Product Approvals for matching documents
                </p>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Search Now
                </Button>
              </div>
            )}

            {searching && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Searching product approval databases...</p>
              </div>
            )}

            {hasSearched && !searching && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No matching documents found</p>
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" /> Try Again
                </Button>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{results.length} results found</p>
                  <Button variant="ghost" size="sm" onClick={handleSearch} disabled={searching}>
                    <Search className="h-3 w-3 mr-1" /> Re-search
                  </Button>
                </div>

                {results.map((result) => {
                  const sourceBadge = SOURCE_BADGES[result.source] || SOURCE_BADGES.product_approvals;
                  return (
                    <Card key={result.id} className="border">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground">{result.manufacturer}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <Badge className={`text-[10px] ${sourceBadge.className}`}>
                                {sourceBadge.label}
                              </Badge>
                              {result.noa_number && (
                                <Badge variant="outline" className="text-[10px]">
                                  NOA: {result.noa_number}
                                </Badge>
                              )}
                              {result.fl_number && (
                                <Badge variant="outline" className="text-[10px]">
                                  FL#{result.fl_number}
                                </Badge>
                              )}
                              {result.expiration_date && (
                                <Badge variant="outline" className="text-[10px]">
                                  Exp: {result.expiration_date}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setPreviewDoc({ url: result.pdf_url, title: result.title })}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleSelectDocument(result)}
                              disabled={downloading === result.id}
                            >
                              {downloading === result.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Use This
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PDFViewerDialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        url={previewDoc?.url || ''}
        title={previewDoc?.title || 'Document Preview'}
      />
    </>
  );
}
