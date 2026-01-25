import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Crown, FileText, MessageSquare, CreditCard, Loader2, RefreshCw, Package, Sparkles, PanelRightClose, PanelRightOpen, CheckCircle2 } from 'lucide-react';
import { StatusTimeline, getStatusLabel, getStatusColor } from '@/components/permit-queens/StatusTimeline';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { DocumentUploader } from '@/components/permit-queens/DocumentUploader';
import { PacketViewer, PacketData } from '@/components/permit-queens/PacketViewer';
import { DocumentUploadDialog } from '@/components/permit-queens/DocumentUploadDialog';
import { AIQuestionnaireDialog } from '@/components/permit-queens/AIQuestionnaireDialog';
import { PermitStatusBanner } from '@/components/permit-queens/PermitStatusBanner';
import { ContractorMessagesTab } from '@/components/permit-queens/ContractorMessagesTab';
import { AIPermitChat } from '@/components/permit-queens/AIPermitChat';
import { usePermitRequest, PermitDocument } from '@/hooks/usePermitRequest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatScopeOfWork } from '@/lib/scopeFormatter';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

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

// Inner component to access sidebar context
function PermitQueensRequestDetailInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permit, documents, loading, uploadDocument, deleteDocument, refetch, refetchDocuments } = usePermitRequest(id);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  
  // Packet state
  const [packet, setPacket] = useState<PacketData | null>(null);
  const [loadingPacket, setLoadingPacket] = useState(true);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  
  // Dialog states for interactive checklist
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string | null>(null);
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  
  // Sidebar context
  const { open: sidebarOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (permit && documents) {
      runGapAnalysis();
      fetchPacket();
    }
  }, [permit, documents]);

  const fetchPacket = async () => {
    if (!permit?.id) return;
    setLoadingPacket(true);
    
    try {
      const { data } = await supabase
        .from('permit_packets')
        .select('*')
        .eq('permit_request_id', permit.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        const docIndex = (data.document_index || data.documents_included || []) as any[];
        setPacket({
          packetId: data.id,
          documentIndex: docIndex,
          coverSheetHtml: data.cover_sheet_html || '',
          aiNotes: data.ai_notes || '',
          totalPages: data.total_pages || 0,
          documentCount: data.document_count,
          completionPercentage: docIndex.length > 0 
            ? Math.round((docIndex.filter((d: any) => d.status === 'included' || d.status === 'generated' || d.status === 'auto_sourced').length / docIndex.length) * 100)
            : 0,
          missingDocuments: docIndex.filter((d: any) => d.status === 'missing').map((d: any) => d.name),
          needsSignature: docIndex.filter((d: any) => d.status === 'needs_signature').map((d: any) => d.name),
          status: (data.status === 'ready' || data.status === 'incomplete' ? data.status : 'draft') as 'ready' | 'incomplete' | 'draft',
          packetPdfUrl: data.file_path,
          submissionNotes: [],
        });
      }
    } catch (error) {
      console.error('Error fetching packet:', error);
    } finally {
      setLoadingPacket(false);
    }
  };

  const handleRegeneratePacket = async () => {
    if (!permit?.id) return;
    setGeneratingPacket(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('permit-packet-assembler', {
        body: { 
          permitRequestId: permit.id, 
          generateCoverSheet: true,
          uploadedDocuments: documents.map(d => ({
            type: d.document_type,
            name: d.file_name,
            url: d.file_path,
          })),
        },
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setPacket({
          packetId: data.data.packetId,
          documentIndex: data.data.documentIndex || [],
          coverSheetHtml: data.data.coverSheetHtml || '',
          submissionNotes: data.data.submissionNotes || [],
          aiNotes: data.data.aiNotes || '',
          totalPages: data.data.totalPages || 0,
          documentCount: data.data.documentCount,
          completionPercentage: data.data.completionPercentage || 0,
          missingDocuments: data.data.missingDocuments || [],
          needsSignature: data.data.needsSignature || [],
          status: data.data.status || 'draft',
          packetPdfUrl: data.data.packetPdfUrl,
        });
        toast.success('Packet regenerated!');
      }
    } catch (error) {
      console.error('Error regenerating packet:', error);
      toast.error('Failed to regenerate packet');
    } finally {
      setGeneratingPacket(false);
    }
  };

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
            name: d.file_name,
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
  
  // Handler for document upload from PacketViewer or MissingItemsPanel
  const handleDocumentClick = (docType: string, docName: string) => {
    setUploadDocType(docType);
    setUploadDocName(docName);
    setUploadDialogOpen(true);
  };

  // Handler for upload completion
  const handleUploadComplete = async () => {
    console.log('handleUploadComplete triggered - refetching documents');
    await refetchDocuments();
    console.log('Documents refetched - running gap analysis');
    await runGapAnalysis();
    console.log('Gap analysis complete - regenerating packet');
    // Always regenerate packet after upload to update document index
    await handleRegeneratePacket();
    console.log('Packet regenerated successfully');
  };

  // Handler for questionnaire completion
  const handleQuestionnaireComplete = async () => {
    await refetch();
    await runGapAnalysis();
    if (packet) {
      await handleRegeneratePacket();
    }
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
    name: doc.file_name,
    url: doc.file_path,
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
  
  // Count missing items for badge
  const totalMissingItems = missingFields.length + missingDocuments.length + complianceIssues.length;

  return (
    <>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSidebar}
                  className="relative"
                >
                  {sidebarOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <>
                      <PanelRightOpen className="h-4 w-4" />
                      {totalMissingItems > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                          {totalMissingItems}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 flex-1">
          {/* Status Banner - Always visible at top */}
          <PermitStatusBanner
            pipelineStatus={permit.pipeline_status || 'intake'}
            cityReviewStatus={(permit as any).city_review_status}
            paymentStatus={permit.payment_status}
            readyForPaymentNotifiedAt={(permit as any).ready_for_payment_notified_at}
            onPayNow={() => toast.info('Payment coming soon!')}
            className="mb-6"
          />

          {/* Status Timeline */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Application Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={permit.pipeline_status || 'intake'} />
            </CardContent>
          </Card>

          {/* Main Content Grid - 2 columns for details/payment */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column - Details */}
            <div className="space-y-6">
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
                        {formatScopeOfWork(permit.scope_description, permit.permit_type)}
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
                  <ContractorMessagesTab 
                    permitId={permit.id}
                    contractorName={permit.owner_name || permit.customer_name}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Payment & Info */}
            <div className="space-y-6">
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

          {/* Full-Width Centered Permit Packet Section */}
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Generated Permit Packet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPacket ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading packet...</p>
                  </div>
                ) : packet ? (
                  <PacketViewer
                    packet={packet}
                    onRegenerate={handleRegeneratePacket}
                    onDocumentClick={handleDocumentClick}
                    generating={generatingPacket}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No packet generated yet</p>
                    <Button onClick={handleRegeneratePacket} variant="outline" size="lg" disabled={generatingPacket}>
                      {generatingPacket ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Generate Packet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Right Sidebar - Collapsible Missing Items Panel */}
      <Sidebar side="right" collapsible="offcanvas" className="border-l bg-card">
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Packet Checklist</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {completionPercentage}% complete
          </p>
        </SidebarHeader>
        <SidebarContent className="p-4">
          {analyzingGaps ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing completeness...</p>
            </div>
          ) : completionPercentage === 100 && missingFields.length === 0 && missingDocuments.length === 0 && complianceIssues.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h4 className="font-semibold text-lg mb-1">Packet Complete!</h4>
              <p className="text-sm text-muted-foreground">
                All required items have been provided.
              </p>
            </div>
          ) : (
            <>
              <MissingItemsPanel
                completionPercentage={completionPercentage}
                missingFields={missingFields}
                missingDocuments={missingDocuments}
                complianceIssues={complianceIssues}
                onUploadClick={(docType) => handleDocumentClick(docType, docType.replace(/_/g, ' '))}
                onFieldClick={() => setQuestionnaireOpen(true)}
                className="shadow-none border-0 p-0"
              />
              
              {/* AI Questionnaire Button */}
              {missingFields.length > 0 && (
                <Button 
                  onClick={() => setQuestionnaireOpen(true)} 
                  className="w-full mt-4"
                  variant="default"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Complete Missing Info with AI
                </Button>
              )}
            </>
          )}
        </SidebarContent>
      </Sidebar>

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        docType={uploadDocType}
        docName={uploadDocName}
        permitProjectId={permit?.id || ''}
        onUploadComplete={handleUploadComplete}
      />

      {/* AI Questionnaire Dialog */}
      <AIQuestionnaireDialog
        open={questionnaireOpen}
        onOpenChange={setQuestionnaireOpen}
        permitId={permit?.id || ''}
        missingFields={missingFields.map(f => ({
          field: f.field,
          description: f.reason,
          priority: f.priority,
        }))}
        permitType={permit?.permit_type || 'roofing'}
        jurisdiction={permit?.jurisdiction_county || 'Palm Beach'}
        onComplete={handleQuestionnaireComplete}
      />

      {/* AI Permit Expediter Chat */}
      {permit?.id && (
        <AIPermitChat 
          permitId={permit.id} 
          onAnalysisComplete={(analysis) => {
            // Update local state with AI analysis results
            if (analysis.missingFields) {
              setMissingFields(analysis.missingFields.map(f => ({
                field: f.field,
                reason: f.reason,
                priority: f.priority as 'high' | 'medium' | 'low',
              })));
            }
            if (analysis.missingDocuments) {
              setMissingDocuments(analysis.missingDocuments.map(d => ({
                docType: d.docType,
                reason: d.reason,
                priority: d.priority as 'high' | 'medium' | 'low',
              })));
            }
            if (typeof analysis.confidenceScore === 'number') {
              setCompletionPercentage(analysis.confidenceScore);
            }
          }}
        />
      )}
    </>
  );
}

// Main component wrapper with SidebarProvider
export default function PermitQueensRequestDetail() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background flex w-full">
        <PermitQueensRequestDetailInner />
      </div>
    </SidebarProvider>
  );
}
