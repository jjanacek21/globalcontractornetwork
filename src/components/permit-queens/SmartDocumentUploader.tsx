import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PenTool,
  Sparkles,
  Eye,
  Trash2,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
        if (permitProjectId) {
          await supabase.from('permit_project_documents').insert({
            project_id: permitProjectId,
            document_type: selectedType || 'other',
            file_name: file.name,
            file_path: filePath,
          });
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
      // Generate signed URL for private bucket access
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .createSignedUrl(doc.url, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Signed URL error:', error);
        toast.error('Failed to access document');
        return;
      }
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('View document error:', error);
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
  );
}
