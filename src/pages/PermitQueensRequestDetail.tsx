import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Crown, Download, FileText, MessageSquare, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { StatusTimeline, getStatusLabel, getStatusColor } from '@/components/permit-queens/StatusTimeline';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { DocumentUploader } from '@/components/permit-queens/DocumentUploader';
import { usePermitRequest, PermitDocument } from '@/hooks/usePermitRequest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DOCUMENT_REQUIREMENTS = [
  { type: 'noc', label: 'Notice of Commencement', required: true, description: 'Required for most permits' },
  { type: 'contract', label: 'Signed Contract', required: true, description: 'Between contractor and owner' },
  { type: 'license', label: 'Contractor License', required: true, description: 'Valid state license' },
  { type: 'insurance', label: 'Certificate of Insurance', required: true, description: 'General liability & workers comp' },
  { type: 'product_approval', label: 'Product Approval', required: false, description: 'FL product approval for materials' },
];

interface UploadedDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  status: 'pending' | 'valid' | 'invalid' | 'needs_signature';
  notes?: string;
}

interface MissingField {
  field: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface MissingDocument {
  docType: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceIssue {
  issue: string;
  regulation: string;
  severity: 'critical' | 'warning' | 'info';
}

export default function PermitQueensRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permit, documents, loading, uploadDocument, deleteDocument, refetch, refetchDocuments } = usePermitRequest(id);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  useEffect(() => {
    if (permit && documents) {
      runGapAnalysis();
    }
  }, [permit, documents]);

  const runGapAnalysis = async () => {
    if (!permit) return;
    
    setAnalyzingGaps(true);
    try {
      const { data, error } = await supabase.functions.invoke('permit-gap-detector-ai', {
        body: {
          permitRequest: {
            permit_type: permit.permit_type,
            jurisdiction_county: permit.jurisdiction_county,
            scope_description: permit.scope_description,
            valuation: permit.valuation,
            property_address: permit.property_address,
            owner_name: permit.owner_name,
          },
          uploadedDocuments: documents.map(d => ({
            type: d.document_type,
            name: d.document_name,
          })),
          jurisdictionRules: [],
        },
      });

      if (error) throw error;
      if (data) {
        setMissingFields(data.missingFields || []);
        setMissingDocuments(data.missingDocuments || []);
        setComplianceIssues(data.complianceIssues || []);
        setCompletionPercentage(data.completionPercentage || 50);
      }
    } catch (error) {
      console.error('Gap analysis error:', error);
      setCompletionPercentage(permit.completion_percentage || 50);
    } finally {
      setAnalyzingGaps(false);
    }
  };

  const handleDocumentUpload = async (file: File, docType: string): Promise<boolean> => {
    return await uploadDocument(file, docType);
  };

  const handleDocumentDelete = async (docId: string): Promise<boolean> => {
    return await deleteDocument(docId);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const mapDocumentStatus = (status: string): 'pending' | 'valid' | 'invalid' | 'needs_signature' => {
    const mapping: Record<string, 'pending' | 'valid' | 'invalid' | 'needs_signature'> = {
      'pending': 'pending',
      'approved': 'valid',
      'valid': 'valid',
      'rejected': 'invalid',
      'invalid': 'invalid',
      'needs_signature': 'needs_signature',
    };
    return mapping[status] || 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Request not found</h2>
          <Button onClick={() => navigate('/permit-queens/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const uploadedDocsForUploader: UploadedDocument[] = documents.map(doc => ({
    id: doc.id,
    type: doc.document_type || 'other',
    name: doc.document_name,
    url: doc.file_url,
    status: mapDocumentStatus(doc.validation_status || 'pending'),
    notes: doc.validation_notes || undefined,
  }));

  // Calculate fee based on complexity tier
  const getTierPrice = (tier: string): number => {
    const prices: Record<string, number> = {
      'basic': 149,
      'standard': 249,
      'complex': 399,
    };
    return prices[tier] || 249;
  };

  const amountDue = permit.fee_estimate || getTierPrice(permit.complexity_tier);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/permit-queens/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Permit Request</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(permit.pipeline_status || 'intake')}>
                {getStatusLabel(permit.pipeline_status || 'intake')}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => { refetch(); refetchDocuments(); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline currentStatus={permit.pipeline_status || 'intake'} />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Property Address</p>
                        <p className="font-medium">{permit.property_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Jurisdiction</p>
                        <p className="font-medium">{permit.jurisdiction_county || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Permit Type</p>
                        <p className="font-medium capitalize">{(permit.permit_type || '').replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valuation</p>
                        <p className="font-medium">{formatCurrency(permit.valuation)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Owner Name</p>
                        <p className="font-medium">{permit.owner_name || permit.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{permit.owner_email || permit.customer_email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{permit.owner_phone || permit.customer_phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scope of Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {permit.scope_description || 'No scope description provided.'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <DocumentUploader
                  requirements={DOCUMENT_REQUIREMENTS}
                  uploadedDocuments={uploadedDocsForUploader}
                  onUpload={handleDocumentUpload}
                  onDelete={handleDocumentDelete}
                />
              </TabsContent>

              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Messages
                    </CardTitle>
                    <CardDescription>
                      Communicate with your permit expediter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet.</p>
                      <p className="text-sm">Your expediter will contact you here if they need additional information.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions & Summary */}
          <div className="space-y-6">
            {/* Missing Items */}
            {analyzingGaps ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Checking completeness...</p>
                </CardContent>
              </Card>
            ) : (
              <MissingItemsPanel
                completionPercentage={completionPercentage}
                missingFields={missingFields}
                missingDocuments={missingDocuments}
                complianceIssues={complianceIssues}
              />
            )}

            {/* Payment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Service Tier</span>
                  <Badge variant="secondary" className="capitalize">
                    {permit.complexity_tier || 'Basic'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-semibold text-lg">{formatCurrency(amountDue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant={permit.payment_status === 'paid' ? 'default' : 'outline'}>
                    {permit.payment_status || 'Unpaid'}
                  </Badge>
                </div>
                {permit.payment_status !== 'paid' && (
                  <Button className="w-full" disabled>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now (Coming Soon)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Download Packet */}
            {permit.pipeline_status === 'packet_ready' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Permit Packet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your permit packet is ready for download.
                  </p>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Packet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle>Request Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono">{permit.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(permit.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(permit.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
