import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Upload, 
  PenTool,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Sparkles,
  Building2,
  User,
  FileCheck,
  Shield
} from 'lucide-react';
import { SelectedProduct } from '@/hooks/useProductApprovals';

interface DocumentStatus {
  id: string;
  name: string;
  type: string;
  status: 'auto_filled' | 'auto_sourced' | 'uploaded' | 'pending_upload' | 'pending_signature' | 'complete';
  pages?: number;
  source?: string;
  signatureRequired?: boolean;
  notes?: string;
}

interface PacketPreviewProps {
  permitType: string;
  jurisdiction: string;
  isHVHZ: boolean;
  uploadedDocuments: any[];
  selectedProducts: SelectedProduct[];
  formData: {
    property_address: string;
    owner_name: string;
    scope_description: string;
    valuation: number;
  };
  onGeneratePacket?: () => void;
  generating?: boolean;
}

export function PacketPreview({
  permitType,
  jurisdiction,
  isHVHZ,
  uploadedDocuments,
  selectedProducts,
  formData,
  onGeneratePacket,
  generating = false,
}: PacketPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['forms', 'noas']);

  // Generate document checklist based on permit type and jurisdiction
  const generateDocumentChecklist = (): DocumentStatus[] => {
    const documents: DocumentStatus[] = [];

    // Standard permit forms
    documents.push({
      id: 'permit_app',
      name: `${jurisdiction} Building Permit Application`,
      type: 'form',
      status: formData.property_address && formData.owner_name ? 'auto_filled' : 'pending_upload',
      pages: 2,
      source: 'AI Auto-Fill',
      signatureRequired: true,
    });

    documents.push({
      id: 'noc',
      name: 'Notice of Commencement (NOC)',
      type: 'form',
      status: formData.owner_name ? 'auto_filled' : 'pending_upload',
      pages: 1,
      source: 'AI Auto-Fill',
      signatureRequired: true,
      notes: 'Must be notarized',
    });

    // HVHZ-specific forms
    if (isHVHZ) {
      documents.push({
        id: 'hvhz_disclosure',
        name: 'HVHZ Roofing Disclosure (Section 1524)',
        type: 'form',
        status: 'auto_filled',
        pages: 1,
        source: 'AI Auto-Fill',
        signatureRequired: true,
      });

      documents.push({
        id: 'roof_wall_affidavit',
        name: 'Roof-to-Wall Connection Affidavit',
        type: 'form',
        status: formData.valuation > 300000 ? 'pending_upload' : 'auto_filled',
        pages: 1,
        source: formData.valuation > 300000 ? 'Requires inspection' : 'AI Auto-Fill',
        signatureRequired: true,
        notes: formData.valuation > 300000 ? 'Property over $300K requires retrofit inspection' : undefined,
      });
    }

    // Broward/Pembroke Pines specific
    if (jurisdiction.toLowerCase().includes('broward') || jurisdiction.toLowerCase().includes('pembroke')) {
      documents.push({
        id: 'hoa_affidavit',
        name: 'HOA Awareness Affidavit',
        type: 'form',
        status: 'auto_filled',
        pages: 1,
        source: 'AI Auto-Fill',
        signatureRequired: true,
        notes: 'Owner must acknowledge HOA notification responsibility',
      });
    }

    // Product NOAs
    selectedProducts.forEach(sp => {
      documents.push({
        id: `noa_${sp.id}`,
        name: `${sp.product.product_name} NOA`,
        type: 'noa',
        status: sp.product.noa_number ? 'auto_sourced' : 'pending_upload',
        pages: 4,
        source: sp.product.noa_number ? `NOA ${sp.product.noa_number}` : undefined,
      });
    });

    // Uploaded documents
    uploadedDocuments.forEach(doc => {
      const existingIndex = documents.findIndex(d => d.type === doc.type);
      if (existingIndex >= 0) {
        documents[existingIndex].status = doc.status === 'needs_signature' ? 'pending_signature' : 'uploaded';
      } else {
        documents.push({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          status: doc.status === 'needs_signature' ? 'pending_signature' : 'uploaded',
        });
      }
    });

    // Standard required uploads
    const requiredUploads = [
      { type: 'contract', name: 'Signed Contract' },
      { type: 'license', name: 'Contractor License Copy' },
      { type: 'insurance', name: 'Certificate of Insurance' },
      { type: 'measurement', name: 'Roof Measurement Report' },
    ];

    requiredUploads.forEach(req => {
      const uploaded = uploadedDocuments.find(d => d.type === req.type);
      if (!uploaded && !documents.some(d => d.type === req.type)) {
        documents.push({
          id: req.type,
          name: req.name,
          type: req.type,
          status: 'pending_upload',
        });
      }
    });

    return documents;
  };

  const documents = generateDocumentChecklist();
  
  const forms = documents.filter(d => d.type === 'form');
  const noas = documents.filter(d => d.type === 'noa');
  const uploads = documents.filter(d => !['form', 'noa'].includes(d.type));

  const completedCount = documents.filter(d => 
    ['auto_filled', 'auto_sourced', 'uploaded', 'complete'].includes(d.status)
  ).length;
  const totalCount = documents.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const pendingSignatures = documents.filter(d => d.signatureRequired && d.status !== 'complete').length;
  const pendingUploads = documents.filter(d => d.status === 'pending_upload').length;

  const getStatusIcon = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'auto_filled':
      case 'auto_sourced':
        return <Sparkles className="h-4 w-4 text-primary" />;
      case 'uploaded':
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending_signature':
        return <PenTool className="h-4 w-4 text-orange-500" />;
      case 'pending_upload':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'auto_filled':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">AI Filled</Badge>;
      case 'auto_sourced':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Auto-Sourced</Badge>;
      case 'uploaded':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Uploaded</Badge>;
      case 'complete':
        return <Badge variant="default" className="bg-green-500">Complete</Badge>;
      case 'pending_signature':
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Needs Signature</Badge>;
      case 'pending_upload':
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderDocumentList = (docs: DocumentStatus[], title: string, icon: React.ReactNode, section: string) => {
    const isExpanded = expandedSections.includes(section);
    const sectionComplete = docs.filter(d => 
      ['auto_filled', 'auto_sourced', 'uploaded', 'complete'].includes(d.status)
    ).length;

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              {icon}
              <span className="font-medium">{title}</span>
              <Badge variant="outline" className="ml-2">
                {sectionComplete}/{docs.length}
              </Badge>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pt-3 pl-4">
            {docs.map(doc => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-background"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.source && (
                        <span className="text-xs text-muted-foreground">{doc.source}</span>
                      )}
                      {doc.signatureRequired && (
                        <Badge variant="outline" className="text-xs h-5">
                          <PenTool className="h-3 w-3 mr-1" />
                          Signature
                        </Badge>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-orange-600 mt-1">{doc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  {['auto_filled', 'auto_sourced', 'uploaded', 'complete'].includes(doc.status) && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Permit Packet Preview
            </CardTitle>
            <CardDescription>
              Review all documents before generating your permit packet
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="space-y-3">
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span><strong>{documents.filter(d => d.status === 'auto_filled').length}</strong> AI Auto-Filled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span><strong>{documents.filter(d => d.status === 'auto_sourced').length}</strong> NOAs Sourced</span>
            </div>
            {pendingUploads > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span><strong>{pendingUploads}</strong> Uploads Needed</span>
              </div>
            )}
            {pendingSignatures > 0 && (
              <div className="flex items-center gap-2 text-orange-600">
                <PenTool className="h-4 w-4" />
                <span><strong>{pendingSignatures}</strong> Signatures Needed</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Document Sections */}
        <div className="space-y-4">
          {renderDocumentList(
            forms, 
            'Permit Forms', 
            <Building2 className="h-4 w-4 text-primary" />,
            'forms'
          )}
          {noas.length > 0 && renderDocumentList(
            noas, 
            'Product NOAs', 
            <Shield className="h-4 w-4 text-blue-500" />,
            'noas'
          )}
          {uploads.length > 0 && renderDocumentList(
            uploads, 
            'Supporting Documents', 
            <FileCheck className="h-4 w-4 text-green-500" />,
            'uploads'
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onGeneratePacket}
            disabled={generating || completionPercentage < 50}
            className="flex-1"
          >
            {generating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating Packet...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Permit Packet
              </>
            )}
          </Button>
        </div>

        {completionPercentage < 50 && (
          <p className="text-sm text-center text-muted-foreground">
            Complete at least 50% of requirements to generate packet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
