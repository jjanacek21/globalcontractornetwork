import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  PenTool,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Edit,
  Package,
  Loader2,
  Eye,
  ExternalLink,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface DocumentInfo {
  type: string;
  name: string;
  pages: number;
  url?: string;
  status: 'included' | 'generated' | 'missing' | 'needs_signature' | 'auto_sourced' | 'city_specific' | 'conditional' | 'not_required' | 'needs_sourcing' | 'failed_fetch';
  order?: number;
  noaNumber?: string;
  manufacturer?: string;
  productName?: string;
}

export interface PacketData {
  packetId?: string;
  documentIndex: DocumentInfo[];
  coverSheetHtml: string;
  submissionNotes: string[];
  aiNotes: string;
  totalPages: number;
  documentCount?: number;
  completionPercentage: number;
  missingDocuments: string[];
  needsSignature: string[];
  status: 'ready' | 'incomplete' | 'draft';
  packetPdfUrl?: string;
}

interface PacketViewerProps {
  packet: PacketData;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDocumentClick?: (docType: string, docName: string) => void;
  generating?: boolean;
}

interface ViewingDocument {
  url: string;
  name: string;
}

export function PacketViewer({
  packet,
  onRegenerate,
  onEdit,
  onDocumentClick,
  generating = false,
}: PacketViewerProps) {
  const [showCoverSheet, setShowCoverSheet] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ViewingDocument | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleViewDocument = async (url: string, name: string) => {
    if (!url) return;
    
    // If it's already a full URL (from edge function or external), use directly
    if (url.startsWith('http')) {
      setViewingDocument({ url, name });
      return;
    }
    
    // Otherwise, generate signed URL for storage path
    try {
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .createSignedUrl(url, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Signed URL error:', error);
        toast.error('Failed to access document');
        return;
      }
      
      if (data?.signedUrl) {
        setViewingDocument({ url: data.signedUrl, name });
      }
    } catch (error) {
      console.error('View document error:', error);
      toast.error('Failed to open document');
    }
  };

  const getStatusIcon = (status: DocumentInfo['status']) => {
    switch (status) {
      case 'generated':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'included':
      case 'auto_sourced':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'needs_signature':
        return <PenTool className="h-4 w-4 text-orange-500" />;
      case 'missing':
      case 'failed_fetch':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'needs_sourcing':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'not_required':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DocumentInfo['status']) => {
    switch (status) {
      case 'generated':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Generated</Badge>;
      case 'included':
      case 'auto_sourced':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Included</Badge>;
      case 'needs_signature':
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Needs Signature</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      case 'failed_fetch':
        return <Badge variant="destructive">Missing PDF</Badge>;
      case 'needs_sourcing':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-300">Needs Sourcing</Badge>;
      case 'not_required':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Not Required</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const [sourcingId, setSourcingId] = useState<string | null>(null);
  const handleSourceNow = async (doc: DocumentInfo) => {
    if (!doc.noaNumber) return;
    const key = `${doc.manufacturer}-${doc.noaNumber}`;
    setSourcingId(key);
    try {
      toast.info(`Searching for ${doc.manufacturer || ''} NOA ${doc.noaNumber}…`);
      const { data, error } = await supabase.functions.invoke('firecrawl-noa-scraper', {
        body: { manufacturer: doc.manufacturer, noaNumber: doc.noaNumber },
      });
      if (error) throw error;
      const found = data?.results?.[0]?.noa_number || data?.found;
      if (found) {
        toast.success('NOA found — regenerating packet…');
        onRegenerate?.();
      } else {
        toast.warning('No matching NOA found. Upload manually.');
      }
    } catch (e: any) {
      console.error('Source Now failed', e);
      toast.error('Sourcing failed: ' + (e?.message || 'unknown error'));
    } finally {
      setSourcingId(null);
    }
  };

  const handleDownload = async () => {
    if (!packet.packetPdfUrl) {
      // Fallback: create blob from cover sheet HTML and trigger download
      const htmlContent = `
        <html>
        <head>
          <title>Permit Packet Cover Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
          </style>
        </head>
        <body>
          ${packet.coverSheetHtml}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `permit-cover-sheet-${packet.packetId || 'download'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Cover sheet downloaded');
      return;
    }

    setDownloading(true);
    try {
      let downloadUrl = packet.packetPdfUrl;
      
      // If it's a storage path (not a full URL), generate signed URL
      if (!downloadUrl.startsWith('http')) {
        const { data, error } = await supabase.storage
          .from('permit-documents')
          .createSignedUrl(downloadUrl, 3600);
        
        if (error || !data?.signedUrl) {
          throw new Error('Failed to generate download URL');
        }
        downloadUrl = data.signedUrl;
      }

      // Use programmatic download to avoid popup blockers
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `permit-packet-${packet.packetId || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download packet');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPacket = async () => {
    if (!packet.packetPdfUrl) return;

    try {
      let viewUrl = packet.packetPdfUrl;
      
      // If it's a storage path (not a full URL), generate signed URL
      if (!viewUrl.startsWith('http')) {
        const { data, error } = await supabase.storage
          .from('permit-documents')
          .createSignedUrl(viewUrl, 3600);
        
        if (error || !data?.signedUrl) {
          throw new Error('Failed to generate view URL');
        }
        viewUrl = data.signedUrl;
      }

      setViewingDocument({ url: viewUrl, name: 'Permit Packet' });
    } catch (error) {
      console.error('View packet error:', error);
      toast.error('Failed to open packet');
    }
  };

  const includedDocs = packet.documentIndex.filter(d => d.status === 'included' || d.status === 'generated');
  const signatureDocs = packet.documentIndex.filter(d => d.status === 'needs_signature');
  const missingDocs = packet.documentIndex.filter(d => d.status === 'missing');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Generated Permit Packet</CardTitle>
              {packet.status === 'ready' && (
                <Badge className="bg-green-500 ml-2">Ready</Badge>
              )}
              {packet.status === 'incomplete' && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 ml-2">Incomplete</Badge>
              )}
            </div>
            {packet.packetPdfUrl && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleViewPacket}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Packet Completion</span>
              <span className="font-semibold">{packet.completionPercentage}%</span>
            </div>
            <Progress value={packet.completionPercentage} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{packet.documentCount || includedDocs.length} documents</span>
              <span>{packet.totalPages} pages</span>
            </div>
          </div>

          {/* Document Index */}
          <div className="border rounded-lg divide-y">
            {packet.documentIndex.map((doc, index) => (
              <div 
                key={`${doc.type}-${index}`}
                className={cn(
                  "flex items-center justify-between p-3 transition-colors",
                  doc.status === 'missing' 
                    ? "cursor-pointer hover:bg-primary/5" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  if (doc.status === 'missing' && onDocumentClick) {
                    onDocumentClick(doc.type, doc.name);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-6">
                    {String(doc.order || index + 1).padStart(2, '0')}
                  </span>
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    {doc.pages > 0 && (
                      <p className="text-xs text-muted-foreground">{doc.pages} page{doc.pages > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  {doc.status === 'missing' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentClick?.(doc.type, doc.name);
                      }}
                    >
                      <Upload className="h-3 w-3" />
                      Upload
                    </Button>
                  ) : doc.url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(doc.url!, doc.name);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Missing Documents Alert */}
          {missingDocs.length > 0 && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Documents</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-1">
                  {missingDocs.map((doc, i) => (
                    <li key={i} className="text-sm">{doc.name}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Signature Requirements Alert */}
          {signatureDocs.length > 0 && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <PenTool className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-700">Signatures Required</AlertTitle>
              <AlertDescription className="text-orange-600">
                <ul className="list-disc list-inside mt-1">
                  {signatureDocs.map((doc, i) => (
                    <li key={i} className="text-sm">{doc.name}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* AI Notes */}
          {packet.aiNotes && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">AI Summary</p>
              <p className="text-sm text-muted-foreground">{packet.aiNotes}</p>
            </div>
          )}

          {/* Cover Sheet Preview */}
          <Collapsible open={showCoverSheet} onOpenChange={setShowCoverSheet}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Cover Sheet Preview
                </span>
                {showCoverSheet ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div 
                className="border rounded-lg p-4 bg-white text-black mt-2 max-h-96 overflow-auto"
                dangerouslySetInnerHTML={{ __html: packet.coverSheetHtml }}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleDownload}
              className="flex-1"
              disabled={(packet.status !== 'ready' && !packet.packetPdfUrl) || downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {packet.packetPdfUrl ? 'Download Packet' : 'Print Cover Sheet'}
            </Button>
            {onRegenerate && (
              <Button variant="outline" onClick={onRegenerate} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        url={viewingDocument?.url || ''}
        title={viewingDocument?.name || 'Document'}
        filename={`${viewingDocument?.name || 'document'}.pdf`}
      />
    </>
  );
}
