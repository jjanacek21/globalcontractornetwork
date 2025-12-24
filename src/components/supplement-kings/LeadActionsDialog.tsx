import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Camera,
  MapPin,
  ClipboardList,
  Scale,
  Upload,
  Loader2,
} from "lucide-react";

interface LeadActionsDialogProps {
  leadId: string | null;
  contractorId: string;
  actionType: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const actionConfig: Record<string, { 
  title: string; 
  description: string; 
  icon: typeof MessageSquare;
  requestType?: string;
}> = {
  add_note: {
    title: "Add Notes",
    description: "Add a note or update to this lead",
    icon: MessageSquare,
  },
  add_photo: {
    title: "Add Photos/Documents",
    description: "Upload photos or documents for this lead",
    icon: Camera,
  },
  request_inspection: {
    title: "Request Onsite Inspection",
    description: "Request an onsite inspection for this property",
    icon: MapPin,
    requestType: "onsite_inspection",
  },
  request_engineer: {
    title: "Request Engineer Letter",
    description: "Request a structural engineer letter for this claim",
    icon: ClipboardList,
    requestType: "engineer_letter",
  },
  request_attorney: {
    title: "Request Attorney",
    description: "Request attorney involvement for this claim",
    icon: Scale,
    requestType: "attorney",
  },
};

export function LeadActionsDialog({
  leadId,
  contractorId,
  actionType,
  open,
  onOpenChange,
  onSuccess,
}: LeadActionsDialogProps) {
  const [noteText, setNoteText] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const config = actionType ? actionConfig[actionType] : null;
  const Icon = config?.icon || MessageSquare;

  const handleClose = () => {
    setNoteText("");
    setRequestNotes("");
    setFiles(null);
    onOpenChange(false);
  };

  const handleAddNote = async () => {
    if (!leadId || !noteText.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('supplement_lead_notes').insert({
        lead_id: leadId,
        contractor_id: contractorId,
        note_text: noteText.trim(),
      });

      if (error) throw error;

      toast({
        title: "Note added",
        description: "Your note has been added to this lead.",
      });
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (!leadId || !files || files.length === 0) return;

    setLoading(true);
    try {
      // Get current user for storage path (RLS policy expects userId as folder)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload files");
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        // Use userId as folder to match storage RLS policy, include leadId in filename
        const filePath = `${user.id}/${leadId}_${Date.now()}_${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('supplement-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: dbError } = await supabase.from('supplement_lead_documents').insert({
          lead_id: leadId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
        });

        if (dbError) throw dbError;
      }

      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      });
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload files.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!leadId || !config?.requestType) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('supplement_lead_requests').insert({
        lead_id: leadId,
        request_type: config.requestType,
        notes: requestNotes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: `Your ${config.title.toLowerCase()} has been submitted.`,
      });
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (actionType === 'add_note') {
      handleAddNote();
    } else if (actionType === 'add_photo') {
      handleUploadFiles();
    } else {
      handleCreateRequest();
    }
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-blue-500/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-400" />
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {actionType === 'add_note' && (
            <div className="space-y-2">
              <Label htmlFor="note" className="text-slate-300">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
              />
            </div>
          )}

          {actionType === 'add_photo' && (
            <div className="space-y-2">
              <Label htmlFor="files" className="text-slate-300">Files</Label>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setFiles(e.target.files)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Upload photos, PDFs, or documents
                </p>
              </div>
              {files && files.length > 0 && (
                <p className="text-sm text-slate-400">
                  {files.length} file(s) selected
                </p>
              )}
            </div>
          )}

          {(actionType === 'request_inspection' || 
            actionType === 'request_engineer' || 
            actionType === 'request_attorney') && (
            <div className="space-y-2">
              <Label htmlFor="requestNotes" className="text-slate-300">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="requestNotes"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Any specific details or requirements..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || 
                (actionType === 'add_note' && !noteText.trim()) ||
                (actionType === 'add_photo' && (!files || files.length === 0))
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'add_note' ? 'Add Note' :
               actionType === 'add_photo' ? 'Upload Files' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
