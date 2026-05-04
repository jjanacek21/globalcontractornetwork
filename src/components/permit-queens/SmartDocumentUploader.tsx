import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2,
  PenTool,
  Eye,
  Trash2,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'uploaded' | 'processing' | 'signed' | 'needs_fields';
  isPreSigned?: boolean;
}

interface SmartDocumentUploaderProps {
  permitProjectId?: string;
  jurisdiction: string;
  permitType: string;
  onDocumentsChange?: (documents: UploadedDocument[]) => void;
}

// Auto-process map: when these doc types are uploaded, run AI extraction + form fill
const AUTO_PROCESS_TYPES: Record<string, { templateMatch: string[]; label: string }> = {
  signed_permit_app: { templateMatch: ['permit application', 'reroof', 'building permit'], label: 'permit application' },
  permit_application: { templateMatch: ['permit application', 'reroof', 'building permit'], label: 'permit application' },
  signed_noc: { templateMatch: ['notice of commencement', 'noc'], label: 'NOC' },
  notice_of_commencement: { templateMatch: ['notice of commencement', 'noc'], label: 'NOC' },
};

interface ViewingDocument {
  url: string;
  name: string;
}

const DOCUMENT_TYPES = [
  { id: 'signed_permit_app', label: 'Signed Permit Application', description: 'Pre-signed blank form - AI will fill remaining fields' },
  { id: 'signed_noc', label: 'Signed NOC', description: 'Notarized Notice of Commencement' },
  { id: 'signed_affidavit', label: 'Signed Affidavit', description: 'Pre-signed disclosure or affidavit' },
  { id: 'contract', label: 'Signed Contract', description: 'Contractor-homeowner agreement' },
  { id: 'insurance', label: 'Certificate of Insurance', description: 'Contractor liability insurance' },
  { id: 'license', label: 'Contractor License', description: 'State license copy' },
  { id: 'product_approval', label: 'Product Approval/NOA', description: 'Florida Product Approval or Miami-Dade NOA' },
  { id: 'measurement', label: 'Roof Measurement', description: 'EagleView or satellite measurement report' },
  { id: 'photos', label: 'Site Photos', description: 'Before photos of existing conditions' },
  { id: 'hoa_approval', label: 'HOA Approval', description: 'HOA architectural committee approval' },
  { id: 'other', label: 'Other Document', description: 'Additional supporting documentation' },
];

export function SmartDocumentUploader({
  permitProjectId,
  jurisdiction,
  permitType,
  onDocumentsChange,
}: SmartDocumentUploaderProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<ViewingDocument | null>(null);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await uploadFiles(files);
    e.target.value = ''; // Reset input
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const newDocs: UploadedDocument[] = [];

    // Get current user for proper path structure
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      toast.error('Please log in to upload documents');
      setUploading(false);
      return;
    }

    for (const file of files) {
      try {
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: Only PDF, JPG, and PNG files allowed`);
          continue;
        }

        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: File too large (max 10MB)`);
          continue;
        }

        // Upload to storage with user ID as first folder for RLS compliance
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `${user.id}/permits/${permitProjectId || 'temp'}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('permit-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Store file path for signed URL generation (private bucket)
        // Detect if it's a pre-signed form (simple heuristic based on name)
        const isPreSigned = file.name.toLowerCase().includes('signed') || 
                           file.name.toLowerCase().includes('notarized');

        const newDoc: UploadedDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          type: selectedType || 'other',
          url: filePath, // Store path, not public URL - will generate signed URL on view
          status: isPreSigned ? 'signed' : 'uploaded',
          isPreSigned,
        };

        newDocs.push(newDoc);

        // If we have a project ID, save to database
        let projectDocId: string | null = null;
        if (permitProjectId) {
          const { data: pdRow } = await supabase.from('permit_project_documents').insert({
            project_id: permitProjectId,
            document_type: selectedType || 'other',
            file_name: file.name,
            file_path: filePath,
          }).select('id').single();
          projectDocId = pdRow?.id ?? null;
        }

        // 🔁 AUTO-PROCESS: if user uploaded a permit application or NOC,
        // run AI extraction + smart-form-filler so it becomes a smart document
        // rather than a static blob.
        const autoCfg = AUTO_PROCESS_TYPES[(selectedType || '').toLowerCase()];
        if (autoCfg && permitProjectId && file.type === 'application/pdf') {
          // Don't block the UI — fire-and-forget
          (async () => {
            try {
              newDoc.status = 'processing';
              setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'processing' } : d));

              // 1. Find a matching template for this jurisdiction + doc type
              const { data: templates } = await supabase
                .from('permit_form_templates')
                .select('id, form_name, file_path, county')
                .or(`county.eq.${jurisdiction},county.is.null`)
                .limit(50);

              const matched = (templates || []).find((t: any) => {
                const name = (t.form_name || '').toLowerCase();
                return autoCfg.templateMatch.some(m => name.includes(m));
              });

              if (!matched) {
                console.warn(`[auto-process] no template found for ${autoCfg.label} in ${jurisdiction}`);
                setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'uploaded' } : d));
                return;
              }

              // 2. Extract fields from the user's signed PDF (best-effort)
              try {
                await supabase.functions.invoke('permit-form-extractor', {
                  body: { templateId: matched.id, filePath: matched.file_path, autoMap: true },
                });
              } catch (e) {
                console.warn('[auto-process] extractor failed (non-fatal)', e);
              }

              // 3. Run smart-form-filler to merge project data into the template draft
              const { data: filled, error: fillErr } = await supabase.functions.invoke(
                'permit-smart-form-filler',
                { body: { permitProjectId, templateId: matched.id } }
              );
              if (fillErr) throw fillErr;

              const aiUrl: string | undefined =
                filled?.data?.publicUrl || filled?.data?.signedUrl || filled?.publicUrl;

              // 4. Persist as a smart document on permit_packets so generator skips re-creating it
              if (aiUrl) {
                await supabase.from('permit_packets').insert({
                  permit_request_id: permitProjectId,
                  packet_type: autoCfg.label === 'NOC' ? 'noc' : 'permit_application',
                  file_path: filePath, // primary = user's signed PDF
                  status: 'signed_uploaded',
                  document_index: [
                    { type: 'user_signed', url: filePath, role: 'primary' },
                    { type: 'ai_filled', url: aiUrl, role: 'fallback' },
                  ],
                  ai_notes: `Signed copy uploaded — AI-filled fallback generated from template ${matched.form_name}`,
                } as any);
              }

              newDoc.status = 'signed';
              setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'signed' } : d));
              toast.success(`${autoCfg.label} processed — signed copy uploaded`);
            } catch (e: any) {
              console.error('[auto-process] failed', e);
              setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'uploaded' } : d));
              toast.error(`Auto-processing failed for ${autoCfg.label}: ${e?.message || 'unknown'}`);
            }
          })();
        }

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newDocs.length > 0) {
      const updatedDocs = [...documents, ...newDocs];
      setDocuments(updatedDocs);
      onDocumentsChange?.(updatedDocs);
      toast.success(`${newDocs.length} document(s) uploaded`);
    }

    setUploading(false);
    setSelectedType(null);
  };

  const deleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      // Remove from state
      const updatedDocs = documents.filter(d => d.id !== docId);
      setDocuments(updatedDocs);
      onDocumentsChange?.(updatedDocs);
      toast.success('Document removed');
    } catch (error) {
      toast.error('Failed to remove document');
    }
  };

  const handleViewDocument = async (doc: UploadedDocument) => {
    try {
      console.log('[SmartDocumentUploader] Viewing document:', { name: doc.name, url: doc.url });
      
      // Check if URL is already a full URL (signed or public)
      if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
        console.log('[SmartDocumentUploader] Using existing URL directly');
        setViewingDocument({ url: doc.url, name: doc.name });
        return;
      }
      
      // Generate signed URL for private bucket access
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .createSignedUrl(doc.url, 3600); // 1 hour expiry
      
      if (error) {
        console.error('[SmartDocumentUploader] Signed URL error:', error);
        console.log('[SmartDocumentUploader] Attempting fallback with path:', doc.url);
        
        // Try to get public URL as fallback
        const { data: publicData } = supabase.storage
          .from('permit-documents')
          .getPublicUrl(doc.url);
        
        if (publicData?.publicUrl) {
          setViewingDocument({ url: publicData.publicUrl, name: doc.name });
          return;
        }
        
        toast.error('Failed to access document. Please check if the file was uploaded correctly.');
        return;
      }
      
      if (data?.signedUrl) {
        console.log('[SmartDocumentUploader] Generated signed URL successfully');
        setViewingDocument({ url: data.signedUrl, name: doc.name });
      } else {
        toast.error('Could not generate document URL');
      }
    } catch (error) {
      console.error('[SmartDocumentUploader] View document error:', error);
      toast.error('Failed to open document');
    }
  };

  const getStatusBadge = (doc: UploadedDocument) => {
    if (doc.isPreSigned) {
      return <Badge className="bg-green-500"><PenTool className="h-3 w-3 mr-1" />Pre-Signed</Badge>;
    }
    switch (doc.status) {
      case 'signed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'needs_fields':
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">Needs Data</Badge>;
      default:
        return <Badge variant="secondary">Uploaded</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Smart Document Upload
          </CardTitle>
          <CardDescription>
            Upload signed forms, product approvals, and supporting documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pre-signed form tip */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Pro Tip: Upload Pre-Signed Blanks</p>
              <p className="text-muted-foreground">
                Have owners sign blank forms, then upload them. Our AI will fill the remaining fields around the signatures.
              </p>
            </div>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Document Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DOCUMENT_TYPES.slice(0, 6).map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  className={cn(
                    "p-3 border rounded-lg text-left text-sm transition-colors",
                    selectedType === type.id 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  )}
                >
                  <p className="font-medium">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drag & drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  PDF, JPG, PNG up to 10MB
                </p>
                <label>
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>Select Files</span>
                  </Button>
                </label>
              </>
            )}
          </div>

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Uploaded Documents ({documents.length})</h4>
              <div className="border rounded-lg divide-y">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {doc.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        url={viewingDocument?.url || ''}
        title={viewingDocument?.name || 'Document'}
        filename={viewingDocument?.name || 'document.pdf'}
      />
    </>
  );
}
