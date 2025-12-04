import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, Phone, Mail, FileText, Image, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface PermitProject {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  property_address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  service_type: string;
  has_hurricane_straps: boolean | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ProjectDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

interface ProjectDetailsDialogProps {
  project: PermitProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  drivers_license: "Driver's License",
  project_photo: "Project Photo",
  hurricane_straps_photo: "Hurricane Straps Photo",
  other: "Other Document"
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  documents_submitted: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  documents_approved: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  pending_payment: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  permit_delivered: "bg-green-500/20 text-green-500 border-green-500/30",
  inspection_scheduled: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  complete: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  documents_submitted: "Documents Submitted",
  documents_approved: "Documents Approved",
  pending_payment: "Pending Payment",
  permit_delivered: "Permit Delivered",
  inspection_scheduled: "Inspection Scheduled",
  complete: "Complete"
};

export function ProjectDetailsDialog({ project, open, onOpenChange }: ProjectDetailsDialogProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project && open) {
      fetchDocuments();
    }
  }, [project, open]);

  const fetchDocuments = async () => {
    if (!project) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('permit_project_documents')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('permit-documents')
      .createSignedUrl(filePath, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (!project) return null;

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, ProjectDocument[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-white">Project Details</DialogTitle>
            <Badge className={STATUS_COLORS[project.status] || STATUS_COLORS.pending}>
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-white font-medium text-lg">{project.customer_name}</p>
              {project.customer_phone && (
                <p className="text-zinc-400 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {project.customer_phone}
                </p>
              )}
              {project.customer_email && (
                <p className="text-zinc-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {project.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* Property Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Property Information
            </h3>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-white">{project.property_address}</p>
              {(project.city || project.state || project.zip_code) && (
                <p className="text-zinc-400">
                  {[project.city, project.state, project.zip_code].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                {project.has_hurricane_straps ? (
                  <span className="flex items-center gap-1 text-green-500 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Has Hurricane Straps
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-zinc-500 text-sm">
                    <XCircle className="h-4 w-4" />
                    No Hurricane Straps
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Service Details
            </h3>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-white font-medium">{project.service_type}</p>
              <p className="text-zinc-500 text-sm">
                Created: {format(new Date(project.created_at), 'MMMM d, yyyy h:mm a')}
              </p>
              {project.notes && (
                <div className="pt-2 border-t border-zinc-700 mt-2">
                  <p className="text-zinc-400 text-sm">{project.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide flex items-center gap-2">
              <Image className="h-4 w-4" />
              Documents & Photos
            </h3>
            
            {loading ? (
              <div className="text-center py-4 text-zinc-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-4 text-zinc-500">No documents uploaded</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([type, docs]) => (
                  <div key={type} className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-zinc-300 font-medium mb-2">
                      {DOCUMENT_TYPE_LABELS[type] || type}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {docs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => getDocumentUrl(doc.file_path)}
                          className="flex items-center gap-2 p-2 bg-zinc-700/50 rounded hover:bg-zinc-700 transition-colors text-left"
                        >
                          <FileText className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span className="text-sm text-zinc-300 truncate">{doc.file_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}