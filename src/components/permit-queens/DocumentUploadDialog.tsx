import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: string | null;
  docName?: string;
  permitProjectId: string;
  onUploadComplete?: () => void;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
};

const formatDocType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function DocumentUploadDialog({
  open,
  onOpenChange,
  docType,
  docName,
  permitProjectId,
  onUploadComplete,
}: DocumentUploadDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; status: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = docName || (docType ? formatDocType(docType) : 'Document');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);

    if (!acceptedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF or image file.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!docType || !permitProjectId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get user ID for storage path (required by RLS policy)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Please log in to upload documents');
        setUploading(false);
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Generate unique file path with user UUID prefix for RLS compliance
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${permitProjectId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error(`Upload failed: ${uploadError.message}`);
        throw uploadError;
      }

      setUploadProgress(100);

      // Create document record
      const { error: dbError } = await supabase
        .from('permit_project_documents')
        .insert({
          project_id: permitProjectId,
          document_type: docType,
          file_name: file.name,
          file_path: filePath,
          processing_status: 'pending',
        });

      if (dbError) throw dbError;

      setUploadedFile({ name: file.name, status: 'success' });
      toast.success(`${displayName} uploaded successfully`);

      // Trigger AI document processing
      setProcessing(true);
      try {
        const { error: processError } = await supabase.functions.invoke('permit-document-processor', {
          body: {
            documentPath: filePath,
            documentType: docType,
            permitProjectId,
          },
        });

        if (processError) {
          console.error('Processing error:', processError);
          toast.warning('Document uploaded but AI processing failed. You can still use it.');
        } else {
          toast.success('Document processed and data extracted!');
        }
      } catch (processErr) {
        console.error('Processing error:', processErr);
      }
      setProcessing(false);

      // Trigger callback to refresh documents and regenerate packet
      console.log('Upload complete, triggering onUploadComplete callback');
      toast.info('Regenerating packet with new document...');
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFile({ name: file.name, status: 'error' });
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && validateFile(files[0])) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && validateFile(files[0])) {
      await uploadFile(files[0]);
    }
  };

  const handleClose = () => {
    if (!uploading && !processing) {
      setUploadedFile(null);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload {displayName}
          </DialogTitle>
          <DialogDescription>
            Upload a PDF or image file. AI will automatically extract relevant data to fill your permit forms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              uploading || processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && !processing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || processing}
            />

            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
              </div>
            ) : processing ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">AI processing document...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, or PNG up to 10MB
                </p>
              </>
            )}
          </div>

          {/* Document Type Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Document Type:</span>
            <Badge variant="secondary">{displayName}</Badge>
          </div>

          {/* Uploaded File Status */}
          {uploadedFile && (
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              uploadedFile.status === 'success' ? "bg-green-500/10" : "bg-destructive/10"
            )}>
              {uploadedFile.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
              <span className="text-sm truncate flex-1">{uploadedFile.name}</span>
              {uploadedFile.status === 'success' && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Uploaded
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={uploading || processing}>
              {uploadedFile?.status === 'success' ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
