import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  User,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  MessageSquare,
  Camera,
  ClipboardList,
  Scale,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  property_address: string;
  property_city: string;
  property_state?: string | null;
  property_zip?: string | null;
  claim_type: string;
  claim_number?: string | null;
  insurance_company: string | null;
  date_of_loss?: string | null;
  status: string;
  urgency: string;
  notes?: string | null;
  created_at: string;
  assigned_amount: number | null;
  settled_amount: number | null;
}

interface LeadNote {
  id: string;
  note_text: string;
  created_at: string;
}

interface LeadRequest {
  id: string;
  request_type: string;
  status: string;
  notes: string | null;
  requested_at: string;
  completed_at: string | null;
}

interface LeadDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  uploaded_at: string;
}

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (actionType: string) => void;
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  xactimate_complete: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  supplement_sent: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  negotiating: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  settled: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  xactimate_complete: "Xactimate Complete",
  supplement_sent: "Supplement Sent",
  negotiating: "Negotiating",
  settled: "Settled",
};

const requestStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const requestTypeLabels: Record<string, string> = {
  onsite_inspection: "Onsite Inspection",
  engineer_letter: "Engineer Letter",
  attorney: "Attorney Request",
};

export function LeadDetailsDialog({ lead, open, onOpenChange, onAction }: LeadDetailsDialogProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [documents, setDocuments] = useState<LeadDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead && open) {
      fetchLeadData();
    }
  }, [lead, open]);

  const fetchLeadData = async () => {
    if (!lead) return;
    
    setLoading(true);
    try {
      const [notesRes, requestsRes, docsRes] = await Promise.all([
        supabase
          .from('supplement_lead_notes')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('supplement_lead_requests')
          .select('*')
          .eq('lead_id', lead.id)
          .order('requested_at', { ascending: false }),
        supabase
          .from('supplement_lead_documents')
          .select('*')
          .eq('lead_id', lead.id)
          .order('uploaded_at', { ascending: false }),
      ]);

      setNotes(notesRes.data || []);
      setRequests(requestsRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-blue-500/20 p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl text-white">{lead.customer_name}</DialogTitle>
              <p className="text-slate-400 text-sm mt-1">
                {lead.property_address}, {lead.property_city}
                {lead.property_state && `, ${lead.property_state}`}
                {lead.property_zip && ` ${lead.property_zip}`}
              </p>
            </div>
            <Badge variant="outline" className={statusColors[lead.status] || statusColors.submitted}>
              {statusLabels[lead.status] || lead.status}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('add_note')}
                className="bg-white text-black border-gray-200 hover:bg-gray-100"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Notes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('add_photo')}
                className="bg-white text-black border-gray-200 hover:bg-gray-100"
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('request_inspection')}
                className="bg-white text-black border-gray-200 hover:bg-gray-100"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Request Inspection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('request_engineer')}
                className="bg-white text-black border-gray-200 hover:bg-gray-100"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Request Engineer Letter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('request_attorney')}
                className="bg-white text-black border-gray-200 hover:bg-gray-100"
              >
                <Scale className="h-4 w-4 mr-2" />
                Request Attorney
              </Button>
            </div>

            <Separator className="bg-slate-700" />

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Information */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-white">{lead.customer_name}</p>
                  </div>
                  {lead.customer_phone && (
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-white">{lead.customer_phone}</p>
                    </div>
                  )}
                  {lead.customer_email && (
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-white">{lead.customer_email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Information */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Claim Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Claim Type</p>
                      <p className="text-white capitalize">{lead.claim_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Urgency</p>
                      <p className="text-white capitalize">{lead.urgency}</p>
                    </div>
                  </div>
                  {lead.insurance_company && (
                    <div>
                      <p className="text-xs text-slate-500">Insurance Company</p>
                      <p className="text-white">{lead.insurance_company}</p>
                    </div>
                  )}
                  {lead.claim_number && (
                    <div>
                      <p className="text-xs text-slate-500">Claim Number</p>
                      <p className="text-white">{lead.claim_number}</p>
                    </div>
                  )}
                  {lead.date_of_loss && (
                    <div>
                      <p className="text-xs text-slate-500">Date of Loss</p>
                      <p className="text-white">{format(new Date(lead.date_of_loss), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Assigned Amount</p>
                      <p className="text-white">
                        {lead.assigned_amount ? `$${lead.assigned_amount.toLocaleString()}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Settled Amount</p>
                      <p className={lead.settled_amount ? "text-green-400 font-semibold" : "text-white"}>
                        {lead.settled_amount ? `$${lead.settled_amount.toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="text-white">{format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Property Address */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Property Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white">{lead.property_address}</p>
                  <p className="text-white">
                    {lead.property_city}
                    {lead.property_state && `, ${lead.property_state}`}
                    {lead.property_zip && ` ${lead.property_zip}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {lead.notes && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400">Initial Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Requests Status */}
            {requests.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Service Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        {request.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : request.status === 'in_progress' ? (
                          <Clock className="h-5 w-5 text-blue-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {requestTypeLabels[request.request_type] || request.request_type}
                          </p>
                          <p className="text-xs text-slate-500">
                            Requested {format(new Date(request.requested_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={requestStatusColors[request.status] || requestStatusColors.pending}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents & Photos ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate">{doc.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white flex-shrink-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Notes */}
            {notes.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Activity Notes ({notes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-slate-300 whitespace-pre-wrap">{note.note_text}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
