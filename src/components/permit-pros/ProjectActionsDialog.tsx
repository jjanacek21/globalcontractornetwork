import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, X, ClipboardCheck, RefreshCw } from "lucide-react";

interface ProjectActionsDialogProps {
  projectId: string;
  userId: string;
  action: 'upload' | 'inspection' | 'revision' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FileUpload {
  file: File;
  preview?: string;
}

const INSPECTION_TYPES = [
  { value: 'dry_in', label: 'Dry-In Inspection', description: 'Initial roof installation inspection' },
  { value: 'in_progress', label: 'In-Progress Inspection', description: 'Mid-project inspection checkpoint' },
  { value: 'final', label: 'Final Inspection', description: 'Completion and sign-off inspection' }
];

export function ProjectActionsDialog({ 
  projectId, 
  userId, 
  action, 
  open, 
  onOpenChange, 
  onSuccess 
}: ProjectActionsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [inspectionType, setInspectionType] = useState<string>('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileUpload[] = [];
    Array.from(selectedFiles).forEach(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      newFiles.push({ file, preview });
    });

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const uploadPromises = files.map(async ({ file }) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${projectId}/additional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('permit-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase
          .from('permit_project_documents')
          .insert({
            project_id: projectId,
            document_type: 'additional_document',
            file_name: file.name,
            file_path: filePath,
            file_size: file.size
          });

        if (docError) throw docError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Documents uploaded",
        description: `${files.length} document(s) uploaded successfully.`
      });

      setFiles([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionSubmit = async () => {
    if (!inspectionType) {
      toast({
        title: "Select inspection type",
        description: "Please select an inspection type to request.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('permit_projects')
        .update({
          inspection_requested: inspectionType,
          inspection_requested_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Inspection requested",
        description: `${INSPECTION_TYPES.find(t => t.value === inspectionType)?.label} has been requested.`
      });

      setInspectionType('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to request inspection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNotes.trim()) {
      toast({
        title: "Notes required",
        description: "Please provide details about the permit revision needed.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('permit_projects')
        .update({
          revision_requested: true,
          revision_notes: revisionNotes
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Revision requested",
        description: "Your permit revision request has been submitted."
      });

      setRevisionNotes('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to request revision.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'upload': return 'Upload Documents';
      case 'inspection': return 'Request Inspection';
      case 'revision': return 'Request Permit Revision';
      default: return '';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'upload': return 'Upload additional photos or documents for this project.';
      case 'inspection': return 'Select the type of inspection you need to schedule.';
      case 'revision': return 'Request a revision to your permit application.';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            {action === 'upload' && <Upload className="h-5 w-5 text-amber-500" />}
            {action === 'inspection' && <ClipboardCheck className="h-5 w-5 text-amber-500" />}
            {action === 'revision' && <RefreshCw className="h-5 w-5 text-amber-500" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {action === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>

            {files.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
                    {f.preview ? (
                      <img src={f.preview} alt="" className="h-8 w-8 object-cover rounded" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm text-zinc-300 flex-1 truncate">{f.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(idx)}
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleUploadSubmit}
              disabled={loading || files.length === 0}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? "Uploading..." : `Upload ${files.length} File(s)`}
            </Button>
          </div>
        )}

        {action === 'inspection' && (
          <div className="space-y-4">
            <RadioGroup value={inspectionType} onValueChange={setInspectionType}>
              {INSPECTION_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    inspectionType === type.value
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                  onClick={() => setInspectionType(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={type.value} className="text-white font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-sm text-zinc-400 mt-1">{type.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <Button
              onClick={handleInspectionSubmit}
              disabled={loading || !inspectionType}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? "Submitting..." : "Request Inspection"}
            </Button>
          </div>
        )}

        {action === 'revision' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revision_notes" className="text-zinc-300">
                Revision Details *
              </Label>
              <Textarea
                id="revision_notes"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                placeholder="Please describe what changes or corrections are needed for the permit..."
              />
            </div>

            <Button
              onClick={handleRevisionSubmit}
              disabled={loading || !revisionNotes.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? "Submitting..." : "Request Revision"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
