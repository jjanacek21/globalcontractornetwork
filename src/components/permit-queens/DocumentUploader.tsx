import { useState, useCallback } from "react";
import { Upload, FileText, X, Check, AlertCircle, Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DocumentRequirement {
  type: string;
  label: string;
  required: boolean;
  description?: string;
}

interface UploadedDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  status: 'pending' | 'valid' | 'invalid' | 'needs_signature';
  notes?: string;
}

interface DocumentUploaderProps {
  requirements: DocumentRequirement[];
  uploadedDocuments: UploadedDocument[];
  onUpload: (file: File, type: string) => Promise<boolean>;
  onDelete: (documentId: string) => Promise<boolean>;
  onPreview?: (document: UploadedDocument) => void;
  className?: string;
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  valid: 'bg-green-100 text-green-800 border-green-200',
  invalid: 'bg-red-100 text-red-800 border-red-200',
  needs_signature: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusLabels = {
  pending: 'Pending Review',
  valid: 'Approved',
  invalid: 'Invalid',
  needs_signature: 'Needs Signature',
};

export function DocumentUploader({
  requirements,
  uploadedDocuments,
  onUpload,
  onDelete,
  onPreview,
  className,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const { toast } = useToast();

  const getDocumentForType = (type: string): UploadedDocument | undefined => {
    return uploadedDocuments.find(d => d.type === type);
  };

  const handleFileDrop = useCallback(async (
    e: React.DragEvent<HTMLDivElement>,
    type: string
  ) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or image file (JPG, PNG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(type);
    await onUpload(file, type);
    setUploading(null);
  }, [onUpload, toast]);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    await onUpload(file, type);
    setUploading(null);
    e.target.value = ''; // Reset input
  };

  const uploadedCount = requirements.filter(r => getDocumentForType(r.type)).length;
  const requiredCount = requirements.filter(r => r.required).length;
  const uploadedRequiredCount = requirements.filter(
    r => r.required && getDocumentForType(r.type)
  ).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Required Documents</CardTitle>
          <Badge variant="outline">
            {uploadedCount}/{requirements.length} uploaded
          </Badge>
        </div>
        <Progress 
          value={(uploadedRequiredCount / requiredCount) * 100} 
          className="h-2 mt-2" 
        />
        <p className="text-xs text-muted-foreground mt-1">
          {uploadedRequiredCount}/{requiredCount} required documents uploaded
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {requirements.map((req) => {
          const doc = getDocumentForType(req.type);
          const isUploading = uploading === req.type;
          const isDragOver = dragOver === req.type;

          return (
            <div
              key={req.type}
              className={cn(
                "relative border rounded-lg p-4 transition-all",
                isDragOver && "border-amber-500 bg-amber-50",
                doc && statusColors[doc.status],
                !doc && "border-dashed border-muted-foreground/30 hover:border-amber-400"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(req.type);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleFileDrop(e, req.type)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  doc ? "bg-white/50" : "bg-muted"
                )}>
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  ) : doc ? (
                    doc.status === 'valid' ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : doc.status === 'invalid' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{req.label}</span>
                    {req.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>

                  {req.description && !doc && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.description}
                    </p>
                  )}

                  {doc && (
                    <div className="mt-1">
                      <p className="text-xs truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {statusLabels[doc.status]}
                        </Badge>
                        {doc.notes && (
                          <span className="text-xs text-muted-foreground">
                            {doc.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {doc ? (
                    <>
                      {onPreview && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onPreview(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => onDelete(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(e, req.type)}
                        disabled={isUploading}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="pointer-events-none"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
