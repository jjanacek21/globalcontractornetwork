import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileCheck, 
  FileX, 
  FilePen, 
  FileDown, 
  Package, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentInfo {
  type: string;
  name: string;
  pages: number;
  url?: string;
  status: 'included' | 'generated' | 'missing' | 'needs_signature';
}

interface PacketData {
  packetId?: string;
  documentIndex: DocumentInfo[];
  coverSheetHtml?: string;
  submissionNotes?: string[];
  aiNotes?: string;
  totalPages: number;
  documentCount: number;
  completionPercentage: number;
  missingDocuments: string[];
  needsSignature: string[];
  status: 'ready' | 'incomplete';
}

interface PacketBuilderProps {
  permitRequestId: string;
  onPacketGenerated?: (packet: PacketData) => void;
}

export const PacketBuilder: React.FC<PacketBuilderProps> = ({
  permitRequestId,
  onPacketGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [packetData, setPacketData] = useState<PacketData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generatePacket = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('permit-packet-assembler', {
        body: {
          permitRequestId,
          generateCoverSheet: true,
          generateNOC: true
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setPacketData(data.data);
        onPacketGenerated?.(data.data);
        
        if (data.data.status === 'ready') {
          toast.success('Permit packet generated successfully!');
        } else {
          toast.warning(`Packet incomplete - missing ${data.data.missingDocuments.length} documents`);
        }
      } else {
        throw new Error(data?.error || 'Failed to generate packet');
      }
    } catch (error: any) {
      console.error('Packet generation error:', error);
      toast.error(error.message || 'Failed to generate packet');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: DocumentInfo['status']) => {
    switch (status) {
      case 'included':
      case 'generated':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'needs_signature':
        return <FilePen className="h-4 w-4 text-orange-500" />;
      case 'missing':
        return <FileX className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DocumentInfo['status']) => {
    switch (status) {
      case 'included':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Included</Badge>;
      case 'generated':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">AI Generated</Badge>;
      case 'needs_signature':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs Signature</Badge>;
      case 'missing':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Missing</Badge>;
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Permit Packet Builder</CardTitle>
          </div>
          {packetData && (
            <Badge variant={packetData.status === 'ready' ? 'default' : 'secondary'}>
              {packetData.status === 'ready' ? 'Ready to Submit' : 'Incomplete'}
            </Badge>
          )}
        </div>
        <CardDescription>
          AI-powered packet assembly with auto-filled forms and document organization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!packetData ? (
          <div className="text-center py-6">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate a complete permit packet with auto-filled forms, cover sheet, and document index
            </p>
            <Button 
              onClick={generatePacket} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Packet...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Generate Permit Packet
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Progress Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Packet Completion</span>
                <span className="font-medium">{packetData.completionPercentage}%</span>
              </div>
              <Progress value={packetData.completionPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{packetData.documentCount} documents</span>
                <span>{packetData.totalPages} pages</span>
              </div>
            </div>

            <Separator />

            {/* Document List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Document Index</h4>
              <div className="space-y-1.5">
                {packetData.documentIndex.map((doc, index) => (
                  <div 
                    key={`${doc.type}-${index}`}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.pages > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {doc.pages} pg
                        </span>
                      )}
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Documents Alert */}
            {packetData.missingDocuments.length > 0 && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Missing Documents</p>
                    <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                      {packetData.missingDocuments.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Signature Required Alert */}
            {packetData.needsSignature.length > 0 && (
              <div className="p-3 rounded-md bg-orange-50 border border-orange-200">
                <div className="flex items-start gap-2">
                  <FilePen className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Signatures Required</p>
                    <ul className="text-xs text-orange-700 mt-1 list-disc list-inside">
                      {packetData.needsSignature.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Notes */}
            {packetData.submissionNotes && packetData.submissionNotes.length > 0 && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Submission Notes</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {packetData.submissionNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Notes */}
            {packetData.aiNotes && (
              <div className="text-xs text-muted-foreground italic">
                AI Summary: {packetData.aiNotes}
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Preview'} Cover Sheet
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generatePacket}
                disabled={isGenerating}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
              
              <Button
                size="sm"
                disabled={packetData.status !== 'ready'}
                className="gap-1 ml-auto"
              >
                <FileDown className="h-4 w-4" />
                Download Packet
              </Button>
            </div>

            {/* Cover Sheet Preview */}
            {showPreview && packetData.coverSheetHtml && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium border-b">
                  Cover Sheet Preview
                </div>
                <div 
                  className="p-4 bg-white max-h-96 overflow-auto text-sm"
                  dangerouslySetInnerHTML={{ __html: packetData.coverSheetHtml }}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PacketBuilder;
