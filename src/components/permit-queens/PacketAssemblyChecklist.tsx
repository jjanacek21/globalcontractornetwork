import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, FileDown, RefreshCw, Loader2, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';
import { PacketDocumentRow, type PacketDocument } from './PacketDocumentRow';
import { AutoSourceModal } from './AutoSourceModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PacketMergeChecklist, type MergeDocument } from './PacketMergeChecklist';

interface PacketAssemblyChecklistProps {
  projectId: string;
  documents: PacketDocument[];
  onDocumentPreview?: (doc: PacketDocument) => void;
  onDocumentUpload?: (doc: PacketDocument) => void;
  onSelectProduct?: (doc: PacketDocument) => void;
  onRefresh?: () => void;
}

const AUTO_SOURCEABLE_TYPES = [
  'underlayment_fpa',
  'underlayment_pe_evaluation',
  'roofing_material_fpa',
  'impact_test_report',
];

export function PacketAssemblyChecklist({
  projectId,
  documents,
  onDocumentPreview,
  onDocumentUpload,
  onSelectProduct,
  onRefresh,
}: PacketAssemblyChecklistProps) {
  const [isAssembling, setIsAssembling] = useState(false);
  const [packetUrl, setPacketUrl] = useState<string | null>(null);
  const [mergeResults, setMergeResults] = useState<MergeDocument[]>([]);
  const [autoSourceDoc, setAutoSourceDoc] = useState<PacketDocument | null>(null);
  const [bulkSourcing, setBulkSourcing] = useState(false);

  const activeDocuments = documents.filter(d => d.status !== 'not_required');
  const readyCount = activeDocuments.filter(d => ['ready', 'needs_signature'].includes(d.status)).length;
  const missingCount = activeDocuments.filter(d => d.status === 'missing').length;
  const needsSourcingCount = activeDocuments.filter(d => d.status === 'needs_sourcing').length;
  const completionPct = activeDocuments.length > 0 ? Math.round((readyCount / activeDocuments.length) * 100) : 0;
  const totalPages = activeDocuments.reduce((sum, d) => sum + (d.pages || 0), 0);

  const autoSourceableMissing = activeDocuments.filter(
    d => (d.status === 'missing' || d.status === 'needs_sourcing') &&
      d.source === 'auto_source' &&
      AUTO_SOURCEABLE_TYPES.includes(d.type)
  );

  const handleAssemble = async () => {
    setIsAssembling(true);
    try {
      const selectedProducts = documents
        .filter(d => d.source === 'auto_source' && d.status === 'ready' && d.url)
        .map(d => ({
          id: d.type,
          manufacturer: '',
          product_name: d.name,
          file_url: d.url,
          noa_number: d.noaNumber,
        }));

      const { data, error } = await supabase.functions.invoke('permit-packet-assembler', {
        body: {
          permitRequestId: projectId,
          generateCoverSheet: true,
          generateNOC: true,
          selectedProducts,
          usePacketStructure: true,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data?.packetUrl) {
        setPacketUrl(data.data.packetUrl);
        setMergeResults(data.data.documentIndex || []);
        toast.success('Permit packet assembled successfully!');
      } else if (data?.success) {
        setMergeResults(data?.data?.documentIndex || []);
        toast.success('Packet generated — download available from project details.');
      } else {
        throw new Error(data?.error || 'Assembly failed');
      }
    } catch (err: any) {
      console.error('Assembly error:', err);
      toast.error(err.message || 'Failed to assemble packet');
    } finally {
      setIsAssembling(false);
    }
  };

  const handleSearch = (doc: PacketDocument) => {
    if (AUTO_SOURCEABLE_TYPES.includes(doc.type)) {
      setAutoSourceDoc(doc);
    } else {
      toast.info(`Search for ${doc.noaNumber || doc.name} — use the Product Approval search tool.`);
    }
  };

  const handleAutoSourceAll = async () => {
    if (autoSourceableMissing.length === 0) {
      toast.info('No auto-sourceable documents are missing');
      return;
    }

    setBulkSourcing(true);
    let sourced = 0;

    for (const doc of autoSourceableMissing) {
      try {
        const { data, error } = await supabase.functions.invoke('product-document-search', {
          body: { projectId, documentType: doc.type, productCategory: doc.productCategory },
        });

        if (!error && data?.success && data.results?.length > 0) {
          const best = data.results[0];
          // Try to link the best result
          const fileName = `${doc.type}_${Date.now()}.pdf`;
          const storagePath = `sourced/${projectId}/${fileName}`;

          // Try downloading via proxy
          try {
            const { data: pdfData, error: proxyErr } = await supabase.functions.invoke('pdf-proxy', {
              body: { url: best.pdf_url },
            });

            if (!proxyErr && pdfData) {
              await supabase.storage
                .from('permit-documents')
                .upload(storagePath, pdfData, { contentType: 'application/pdf', upsert: true });

              await supabase.from('permit_project_documents').upsert({
                project_id: projectId,
                document_type: doc.type,
                file_path: storagePath,
                file_name: best.title,
                source: 'auto_sourced',
              }, { onConflict: 'project_id,document_type' });

              sourced++;
            } else {
              // Fallback: save external URL reference
              await supabase.from('permit_project_documents').upsert({
                project_id: projectId,
                document_type: doc.type,
                file_path: best.pdf_url,
                file_name: best.title,
                source: 'auto_sourced',
              }, { onConflict: 'project_id,document_type' });
              sourced++;
            }
          } catch {
            // Link external URL as fallback
            await supabase.from('permit_project_documents').upsert({
              project_id: projectId,
              document_type: doc.type,
              file_path: best.pdf_url,
              file_name: best.title,
              source: 'auto_sourced',
            }, { onConflict: 'project_id,document_type' });
            sourced++;
          }
        }
      } catch (err) {
        console.error(`Auto-source failed for ${doc.type}:`, err);
      }
    }

    setBulkSourcing(false);

    if (sourced > 0) {
      toast.success(`Auto-sourced ${sourced} of ${autoSourceableMissing.length} documents`);
      onRefresh?.();
    } else {
      toast.error('Could not auto-source any documents. Try searching individually.');
    }
  };

  const handleDocumentSelected = () => {
    setAutoSourceDoc(null);
    onRefresh?.();
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Packet Assembly</CardTitle>
            </div>
            <Badge variant={completionPct === 100 ? 'default' : 'secondary'}>
              {completionPct === 100 ? 'Ready to Submit' : `${completionPct}% Complete`}
            </Badge>
          </div>
          <CardDescription>
            {readyCount} of {activeDocuments.length} documents ready • ~{totalPages} pages
            {missingCount > 0 && ` • ${missingCount} missing`}
            {needsSourcingCount > 0 && ` • ${needsSourcingCount} needs sourcing`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Progress value={completionPct} className="h-2" />

          {/* Auto-Source All Missing button */}
          {autoSourceableMissing.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div>
                <p className="text-sm font-medium">{autoSourceableMissing.length} product documents can be auto-sourced</p>
                <p className="text-xs text-muted-foreground">Search NOA & FL product approval databases automatically</p>
              </div>
              <Button
                size="sm"
                onClick={handleAutoSourceAll}
                disabled={bulkSourcing}
                className="gap-1.5"
              >
                {bulkSourcing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {bulkSourcing ? 'Sourcing...' : 'Auto-Source All Missing'}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            {documents.map((doc) => (
              <PacketDocumentRow
                key={`${doc.type}-${doc.order}`}
                document={doc}
                onPreview={onDocumentPreview}
                onUpload={onDocumentUpload}
                onRegenerate={onRefresh ? () => onRefresh() : undefined}
                onSearch={handleSearch}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>

          {missingCount > 0 && (
            <div className="p-3 rounded-md bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Missing Documents</p>
                  <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
                    {activeDocuments.filter(d => d.status === 'missing').map((d, i) => (
                      <li key={i}>{d.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {completionPct === 100 && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">All documents ready for assembly</p>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAssemble}
              disabled={isAssembling || missingCount > 0}
              className="gap-1 ml-auto"
            >
              {isAssembling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assembling...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Assemble Packet
                </>
              )}
            </Button>
            {packetUrl && (
              <Button size="sm" variant="outline" className="gap-1" asChild>
                <a href={packetUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Source Modal */}
      {autoSourceDoc && (
        <AutoSourceModal
          open={!!autoSourceDoc}
          onOpenChange={(open) => !open && setAutoSourceDoc(null)}
          projectId={projectId}
          documentType={autoSourceDoc.type}
          documentName={autoSourceDoc.name}
          productCategory={autoSourceDoc.productCategory}
          onDocumentSelected={handleDocumentSelected}
        />
      )}
    </>
  );
}
