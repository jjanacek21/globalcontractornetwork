import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, MessageSquare, Clock, User, MapPin, DollarSign, 
  CheckCircle, XCircle, AlertTriangle, Send, Loader2, Eye,
  CreditCard, Bell, Building, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminContractorMessaging } from "./AdminContractorMessaging";
import { PDFViewerDialog } from "@/components/ui/PDFViewerDialog";

interface PermitProject {
  id: string;
  property_address: string;
  customer_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  permit_type: string;
  jurisdiction_county: string;
  pipeline_status: string;
  packet_status: string;
  city_review_status: string;
  payment_status: string;
  valuation: number;
  created_at: string;
  updated_at: string;
  ready_for_payment_notified_at: string | null;
  city_submission_date: string | null;
  complexity_tier: string;
  contractor_profile_id: string | null;
  user_id: string | null;
  scope_description?: string;
  form_data?: Record<string, any>;
}

interface PermitDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  validation_status: string;
  validation_notes: string | null;
  created_at: string;
}

interface PermitDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit: PermitProject | null;
  onRefresh: () => void;
}

const PIPELINE_STATUSES = [
  { value: 'intake', label: 'New Request' },
  { value: 'gathering_info', label: 'Gathering Info' },
  { value: 'documents_submitted', label: 'Documents Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_city_review', label: 'Pending City Review' },
  { value: 'ready_for_payment', label: 'Ready for Payment' },
  { value: 'approved', label: 'Approved' },
  { value: 'issued', label: 'Permit Issued' },
  { value: 'rejected', label: 'Rejected' },
];

const CITY_REVIEW_STATUSES = [
  { value: 'not_submitted', label: 'Not Submitted' },
  { value: 'submitted', label: 'Submitted to City' },
  { value: 'under_review', label: 'Under City Review' },
  { value: 'revisions_requested', label: 'Revisions Requested' },
  { value: 'approved', label: 'City Approved' },
  { value: 'rejected', label: 'City Rejected' },
  { value: 'ready_for_payment', label: 'Ready for Payment' },
];

export function PermitDetailDialog({ open, onOpenChange, permit, onRefresh }: PermitDetailDialogProps) {
  const [documents, setDocuments] = useState<PermitDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState(permit?.pipeline_status || 'intake');
  const [cityReviewStatus, setCityReviewStatus] = useState(permit?.city_review_status || 'not_submitted');
  const [adminNotes, setAdminNotes] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (permit) {
      setPipelineStatus(permit.pipeline_status);
      setCityReviewStatus(permit.city_review_status || 'not_submitted');
      fetchDocuments();
    }
  }, [permit]);

  const fetchDocuments = async () => {
    if (!permit) return;
    setLoading(true);
    try {
      // @ts-ignore - Supabase type depth issue
      const result = await supabase
        .from('permit_project_documents')
        .select('*')
        .eq('project_id', permit.id);

      if (result.error) throw result.error;
      const docs = ((result.data as any[]) || []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!permit) return;
    setUpdating(true);
    try {
      const { error } = await (supabase
        .from('permit_projects')
        .update({ 
          pipeline_status: pipelineStatus,
          city_review_status: cityReviewStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', permit.id) as any);

      if (error) throw error;
      toast.success('Status updated successfully');
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleNotifyReadyForPayment = async () => {
    if (!permit) return;
    setUpdating(true);
    try {
      const { error } = await (supabase
        .from('permit_projects')
        .update({ 
          pipeline_status: 'ready_for_payment',
          city_review_status: 'ready_for_payment',
          ready_for_payment_notified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', permit.id) as any);

      if (error) throw error;

      // Send a message to the contractor
      await supabase
        .from('permit_messages')
        .insert({
          permit_request_id: permit.id,
          sender_name: 'Permit Queens Admin',
          sender_role: 'admin',
          message_type: 'notification',
          content: '🎉 Great news! Your permit application has been approved by the city and is ready for payment. Please complete payment to receive your permit.',
        });

      toast.success('Contractor notified: Ready for Payment');
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to notify contractor');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitToCity = async () => {
    if (!permit) return;
    setUpdating(true);
    try {
      const { error } = await (supabase
        .from('permit_projects')
        .update({ 
          pipeline_status: 'pending_city_review',
          city_review_status: 'submitted',
          city_submission_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', permit.id) as any);

      if (error) throw error;

      // Notify contractor
      await supabase
        .from('permit_messages')
        .insert({
          permit_request_id: permit.id,
          sender_name: 'Permit Queens Admin',
          sender_role: 'admin',
          message_type: 'notification',
          content: '📋 Your permit packet has been submitted to the city for review. We will notify you when we receive their response.',
        });

      toast.success('Submitted to city');
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to submit to city');
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentAction = async (docId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const { error } = await supabase
        .from('permit_project_documents')
        .update({ 
          validation_status: action === 'approve' ? 'approved' : 'rejected',
          validation_notes: notes || null,
        })
        .eq('id', docId);

      if (error) throw error;
      toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  const handleViewDocument = async (doc: PermitDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        setViewingDocument({ url: data.signedUrl, name: doc.file_name });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (!permit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Permit Detail - {permit.property_address}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {documents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Property Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{permit.property_address}</p>
                  <p className="text-muted-foreground">
                    {permit.jurisdiction_county || 'County not specified'}
                  </p>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{permit.owner_name || permit.customer_name}</p>
                  <p className="text-muted-foreground">{permit.owner_email}</p>
                  <p className="text-muted-foreground">{permit.owner_phone}</p>
                </CardContent>
              </Card>

              {/* Permit Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Permit Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {permit.permit_type?.replace('_', ' ') || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="capitalize">{permit.complexity_tier || 'Basic'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valuation</span>
                    <span className="font-medium">{formatCurrency(permit.valuation)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pipeline</span>
                    <Badge className="capitalize">
                      {permit.pipeline_status?.replace(/_/g, ' ') || 'Intake'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">City Review</span>
                    <Badge variant="outline" className="capitalize">
                      {permit.city_review_status?.replace(/_/g, ' ') || 'Not Submitted'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment</span>
                    <Badge variant={permit.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {permit.payment_status || 'Unpaid'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scope of Work */}
            {permit.scope_description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Scope of Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {permit.scope_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{format(new Date(permit.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(permit.updated_at), 'MMM d, yyyy')}</p>
                </div>
                {permit.city_submission_date && (
                  <div>
                    <p className="text-muted-foreground">City Submitted</p>
                    <p className="font-medium">{format(new Date(permit.city_submission_date), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {permit.ready_for_payment_notified_at && (
                  <div>
                    <p className="text-muted-foreground">Payment Notified</p>
                    <p className="font-medium">{format(new Date(permit.ready_for_payment_notified_at), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {doc.document_type?.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              doc.validation_status === 'approved' ? 'default' :
                              doc.validation_status === 'rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {doc.validation_status || 'Pending'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.validation_status !== 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-green-600"
                              onClick={() => handleDocumentAction(doc.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {doc.validation_status !== 'rejected' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-600"
                              onClick={() => handleDocumentAction(doc.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {doc.validation_notes && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                          {doc.validation_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <AdminContractorMessaging permitId={permit.id} />
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            {/* Status Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pipeline Status</Label>
                    <Select value={pipelineStatus} onValueChange={setPipelineStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City Review Status</Label>
                    <Select value={cityReviewStatus} onValueChange={setCityReviewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITY_REVIEW_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleStatusUpdate} disabled={updating}>
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Status Changes
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSubmitToCity}
                  disabled={updating || permit.city_review_status !== 'not_submitted'}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Submit to City
                </Button>
                <Button 
                  variant="default" 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={handleNotifyReadyForPayment}
                  disabled={updating}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notify: Ready for Payment
                </Button>
                <Separator />
                <div className="space-y-2">
                  <Label>Send Custom Message</Label>
                  <Textarea 
                    placeholder="Type a message to send to the contractor..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={!adminNotes.trim()}
                    onClick={async () => {
                      if (!adminNotes.trim()) return;
                      await supabase
                        .from('permit_messages')
                        .insert({
                          permit_request_id: permit.id,
                          sender_name: 'Permit Queens Admin',
                          sender_role: 'admin',
                          message_type: 'comment',
                          content: adminNotes,
                        });
                      setAdminNotes('');
                      toast.success('Message sent');
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        url={viewingDocument?.url || ''}
        title={viewingDocument?.name || 'Document'}
        filename={viewingDocument?.name || 'document.pdf'}
      />
    </Dialog>
  );
}
