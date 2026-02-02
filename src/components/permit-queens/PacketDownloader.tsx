import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  PenTool, 
  AlertTriangle,
  Package,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface PacketDocument {
  id: string;
  name: string;
  type: string;
  status: 'filled' | 'pending' | 'signature_needed' | 'complete';
  pages: number;
  url?: string;
}

interface PacketDownloaderProps {
  permitProjectId: string;
  formData: Record<string, any>;
  tradeData: Record<string, any>;
  jurisdiction: string;
  permitType: string;
  isHVHZ: boolean;
  onPacketReady?: (packetUrl: string) => void;
}

export function PacketDownloader({
  permitProjectId,
  formData,
  tradeData,
  jurisdiction,
  permitType,
  isHVHZ,
  onPacketReady,
}: PacketDownloaderProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [documents, setDocuments] = useState<PacketDocument[]>([]);
  const [packetUrl, setPacketUrl] = useState<string | null>(null);
  const [signaturesPending, setSignaturesPending] = useState<string[]>([]);

  const generatePacket = async () => {
    setGenerating(true);
    setProgress(0);
    setStage('Initializing...');

    try {
      // Stage 1: Fetch required templates
      setStage('Loading jurisdiction templates...');
      setProgress(10);
      
      const { data: templates } = await supabase
        .from('permit_form_templates')
        .select('*')
        .or(`jurisdiction_name.ilike.%${jurisdiction}%,jurisdiction_name.eq.Florida`);

      // Stage 2: Fill forms via edge function
      setStage('Auto-filling permit forms...');
      setProgress(30);

      const { data: packetData, error: packetError } = await supabase.functions.invoke('permit-packet-assembler', {
        body: {
          permitRequestId: permitProjectId,
          includeNOC: true,
          includeProductApprovals: true,
          formData: {
            ...formData,
            permit_type: permitType,
            isHVHZ,
          },
          tradeData,
        },
      });

      if (packetError) throw packetError;

      // Stage 3: Process results
      setStage('Assembling document index...');
      setProgress(60);

      const docs: PacketDocument[] = packetData?.documentIndex?.map((doc: any) => ({
        id: doc.type,
        name: doc.name,
        type: doc.type,
        status: doc.status === 'included' ? 'filled' : 
                doc.status === 'needs_signature' ? 'signature_needed' : 'pending',
        pages: doc.pageCount || 1,
        url: doc.url,
      })) || [];

      setDocuments(docs);
      
      // Check for signatures needed
      const sigDocs = docs.filter(d => d.status === 'signature_needed');
      setSignaturesPending(sigDocs.map(d => d.name));

      // Stage 4: Generate merged packet
      setStage('Generating downloadable packet...');
      setProgress(85);

      // Use the packet URL directly from edge function response
      if (packetData?.packetPdfUrl) {
        setPacketUrl(packetData.packetPdfUrl);
        onPacketReady?.(packetData.packetPdfUrl);
      }

      setProgress(100);
      setStage('Complete!');
      toast.success('Permit packet generated successfully!');

    } catch (error) {
      console.error('Packet generation error:', error);
      toast.error('Failed to generate packet');
      setStage('Error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const [viewingPacket, setViewingPacket] = useState(false);

  const downloadPacket = async () => {
    if (!packetUrl) return;
    
    try {
      const response = await fetch(packetUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'permit-packet.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download packet');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'signature_needed':
        return <PenTool className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Permit Packet Generator
        </CardTitle>
        <CardDescription>
          Generate a complete, submission-ready permit packet with all forms auto-filled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Status */}
        {generating && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">{stage}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Documents in Packet</h4>
            <div className="border rounded-lg divide-y">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.pages} page(s)</p>
                    </div>
                  </div>
                  <Badge 
                    variant={doc.status === 'filled' ? 'default' : 'secondary'}
                    className={doc.status === 'signature_needed' ? 'bg-orange-500/10 text-orange-600' : ''}
                  >
                    {doc.status === 'filled' && <Sparkles className="h-3 w-3 mr-1" />}
                    {doc.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Warning */}
        {signaturesPending.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Signatures Required</AlertTitle>
            <AlertDescription className="text-orange-700">
              The following documents need signatures before submission:
              <ul className="list-disc list-inside mt-2">
                {signaturesPending.map(doc => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!packetUrl ? (
            <Button 
              onClick={generatePacket} 
              disabled={generating}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Permit Packet
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={() => setViewingPacket(true)} variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Packet
              </Button>
              <Button onClick={downloadPacket} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Packet
              </Button>
              <Button variant="outline" onClick={generatePacket}>
                Regenerate
              </Button>
            </>
          )}
        </div>

        {packetUrl && (
          <p className="text-sm text-center text-muted-foreground">
            Download your packet, sign where indicated, and submit to the building department.
          </p>
        )}
      </CardContent>

      {/* Inline PDF Viewer */}
      <PDFViewerDialog
        open={viewingPacket}
        onOpenChange={setViewingPacket}
        url={packetUrl || ''}
        title="Permit Packet"
        filename="permit-packet.pdf"
      />
    </Card>
  );
}
