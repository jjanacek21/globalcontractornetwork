import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Crown, Loader2 } from 'lucide-react';
import { WizardProgress } from '@/components/permit-queens/WizardProgress';
import { JurisdictionSelector } from '@/components/permit-queens/JurisdictionSelector';
import { ScopeAnalyzer } from '@/components/permit-queens/ScopeAnalyzer';
import { DocumentUploader } from '@/components/permit-queens/DocumentUploader';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { PricingGrid } from '@/components/permit-queens/PricingCard';
import { usePermitRequest, usePricingTiers, PricingTier } from '@/hooks/usePermitRequest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WIZARD_STEPS = [
  { number: 1, title: 'Jurisdiction', description: 'Select location & permit type' },
  { number: 2, title: 'Property', description: 'Property & owner details' },
  { number: 3, title: 'Scope', description: 'Describe the work' },
  { number: 4, title: 'Documents', description: 'Upload required files' },
  { number: 5, title: 'Review', description: 'Confirm & submit' },
];

const DOCUMENT_REQUIREMENTS = [
  { type: 'noc', label: 'Notice of Commencement', required: true, description: 'Required for most permits' },
  { type: 'contract', label: 'Signed Contract', required: true, description: 'Between contractor and owner' },
  { type: 'license', label: 'Contractor License', required: true, description: 'Valid state license' },
  { type: 'insurance', label: 'Certificate of Insurance', required: true, description: 'General liability & workers comp' },
  { type: 'product_approval', label: 'Product Approval', required: false, description: 'FL product approval for materials' },
  { type: 'energy_calc', label: 'Energy Calculations', required: false, description: 'If required by code' },
  { type: 'engineering', label: 'Engineering Documents', required: false, description: 'Sealed drawings if needed' },
];

interface FormData {
  jurisdiction_county: string;
  permit_type: string;
  property_address: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  valuation: number;
  scope_description: string;
  complexity_tier: string;
}

interface ExtractedData {
  projectSquareFootage?: number;
  materialType?: string;
  projectDetails?: string[];
  estimatedComplexity?: string;
  requiredDocuments?: string[];
  suggestedValuation?: number;
  additionalNotes?: string;
}

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

export default function PermitQueensNewRequest() {
  const navigate = useNavigate();
  const { createPermit, saving } = usePermitRequest();
  const { tiers, loading: tiersLoading } = usePricingTiers();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    jurisdiction_county: '',
    permit_type: '',
    property_address: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    valuation: 0,
    scope_description: '',
    complexity_tier: 'standard',
  });
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  // Default tiers if none loaded from DB
  const defaultTiers: PricingTier[] = [
    {
      id: '1',
      name: 'Basic',
      code: 'basic',
      description: 'Standard processing',
      base_price: 149,
      features_json: ['Document review', 'Application preparation', 'Submission to jurisdiction', '5-7 business days'],
      turnaround_days: 7,
      criteria_json: {},
    },
    {
      id: '2',
      name: 'Standard',
      code: 'standard',
      description: 'Priority processing',
      base_price: 249,
      features_json: ['Everything in Basic', 'Expedited review', 'Status updates', '3-5 business days'],
      turnaround_days: 5,
      criteria_json: {},
    },
    {
      id: '3',
      name: 'Complex',
      code: 'complex',
      description: 'Rush processing',
      base_price: 399,
      features_json: ['Everything in Standard', 'Dedicated expediter', 'Same-day submission', '1-2 business days'],
      turnaround_days: 2,
      criteria_json: {},
    },
  ];

  const displayTiers = tiers.length > 0 ? tiers : defaultTiers;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.jurisdiction_county && formData.permit_type;
      case 2:
        return formData.property_address && formData.owner_name;
      case 3:
        return formData.scope_description.length > 20;
      case 4:
        return true; // Documents are optional at this stage
      case 5:
        return formData.complexity_tier;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      
      // Run gap analysis when entering review step
      if (currentStep === 4) {
        runGapAnalysis();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const runGapAnalysis = async () => {
    setAnalyzingGaps(true);
    try {
      const { data, error } = await supabase.functions.invoke('permit-gap-detector-ai', {
        body: {
          permitRequest: {
            permit_type: formData.permit_type,
            jurisdiction_county: formData.jurisdiction_county,
            scope_description: formData.scope_description,
            valuation: formData.valuation || extractedData?.suggestedValuation,
            property_address: formData.property_address,
            owner_name: formData.owner_name,
          },
          uploadedDocuments: uploadedDocuments.map(d => ({
            type: d.type,
            name: d.name,
          })),
          jurisdictionRules: [],
        },
      });

      if (error) throw error;

      if (data) {
        // Transform the API response to match component interface
        setMissingFields(data.missingFields || []);
        setMissingDocuments(data.missingDocuments || []);
        setComplianceIssues(data.complianceIssues || []);
        setCompletionPercentage(data.completionPercentage || 50);
        
        // Update complexity tier based on AI recommendation
        if (data.recommendedTier) {
          updateFormData('complexity_tier', data.recommendedTier);
        }
      }
    } catch (error) {
      console.error('Gap analysis error:', error);
      toast.error('Failed to analyze gaps. You can still proceed.');
      // Set defaults
      setCompletionPercentage(60);
    } finally {
      setAnalyzingGaps(false);
    }
  };

  const handleDocumentUpload = async (file: File, docType: string): Promise<boolean> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${docType}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('permit-documents')
        .getPublicUrl(filePath);

      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        type: docType,
        name: file.name,
        url: publicUrl,
        status: 'pending',
      };

      setUploadedDocuments(prev => [...prev, newDoc]);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      return false;
    }
  };

  const handleDocumentDelete = async (docId: string): Promise<boolean> => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
    return true;
  };

  const handleSubmit = async () => {
    try {
      const permitId = await createPermit({
        property_address: formData.property_address,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_phone: formData.owner_phone,
        permit_type: formData.permit_type,
        jurisdiction_county: formData.jurisdiction_county,
        scope_description: formData.scope_description,
        valuation: formData.valuation || extractedData?.suggestedValuation,
        complexity_tier: formData.complexity_tier,
      });

      if (permitId) {
        toast.success('Permit request submitted successfully!');
        navigate(`/permit-queens/request/${permitId}`);
      } else {
        toast.error('Failed to create permit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit permit request');
    }
  };

  const handleTierSelect = (tierCode: string) => {
    updateFormData('complexity_tier', tierCode);
  };

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
                <span className="font-bold text-xl">New Permit Request</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b bg-card py-6">
        <div className="container mx-auto px-4">
          <WizardProgress steps={WIZARD_STEPS} currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Jurisdiction & Permit Type */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Jurisdiction & Permit Type</CardTitle>
                <CardDescription>
                  Choose the county and type of permit you need. This determines requirements and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JurisdictionSelector
                  selectedCounty={formData.jurisdiction_county}
                  selectedPermitType={formData.permit_type}
                  onCountyChange={(county) => updateFormData('jurisdiction_county', county)}
                  onPermitTypeChange={(type) => updateFormData('permit_type', type)}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Property & Owner Info */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Property & Owner Information</CardTitle>
                <CardDescription>
                  Enter the property details and owner contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Property Address</Label>
                  <Input
                    value={formData.property_address}
                    onChange={(e) => updateFormData('property_address', e.target.value)}
                    placeholder="123 Main St, Fort Lauderdale, FL 33301"
                    className="h-12 text-base"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Property Owner Name</Label>
                    <Input
                      value={formData.owner_name}
                      onChange={(e) => updateFormData('owner_name', e.target.value)}
                      placeholder="John Smith"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Owner Email</Label>
                    <Input
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => updateFormData('owner_email', e.target.value)}
                      placeholder="john@example.com"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Owner Phone</Label>
                    <Input
                      type="tel"
                      value={formData.owner_phone}
                      onChange={(e) => updateFormData('owner_phone', e.target.value)}
                      placeholder="(954) 555-1234"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Project Valuation ($)</Label>
                    <Input
                      type="number"
                      value={formData.valuation || ''}
                      onChange={(e) => updateFormData('valuation', parseFloat(e.target.value) || 0)}
                      placeholder="15000"
                      className="h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Scope of Work */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Scope of Work</CardTitle>
                <CardDescription>
                  Describe the project in detail. Our AI will analyze and extract key information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScopeAnalyzer
                  scopeDescription={formData.scope_description}
                  permitType={formData.permit_type}
                  jurisdiction={formData.jurisdiction_county}
                  onScopeChange={(scope) => updateFormData('scope_description', scope)}
                  onExtractedDataChange={setExtractedData}
                  extractedData={extractedData}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <DocumentUploader
              requirements={DOCUMENT_REQUIREMENTS}
              uploadedDocuments={uploadedDocuments}
              onUpload={handleDocumentUpload}
              onDelete={handleDocumentDelete}
            />
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Request</CardTitle>
                  <CardDescription>
                    Confirm the details below before submitting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Jurisdiction</p>
                      <p className="font-medium">{formData.jurisdiction_county}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Permit Type</p>
                      <p className="font-medium capitalize">{formData.permit_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Property Address</p>
                      <p className="font-medium">{formData.property_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Property Owner</p>
                      <p className="font-medium">{formData.owner_name}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Scope of Work</p>
                      <p className="font-medium">{formData.scope_description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                      <p className="font-medium">{uploadedDocuments.length} files</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Valuation</p>
                      <p className="font-medium">
                        ${(formData.valuation || extractedData?.suggestedValuation || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missing Items */}
              {analyzingGaps ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Analyzing your submission for completeness...</p>
                  </CardContent>
                </Card>
              ) : (
                <MissingItemsPanel
                  completionPercentage={completionPercentage}
                  missingFields={missingFields}
                  missingDocuments={missingDocuments}
                  complianceIssues={complianceIssues}
                  onFieldClick={() => setCurrentStep(2)}
                  onUploadClick={() => setCurrentStep(4)}
                />
              )}

              {/* Pricing Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Service Tier</h3>
                <PricingGrid
                  tiers={displayTiers}
                  selectedTier={formData.complexity_tier}
                  recommendedTier="standard"
                  onSelectTier={handleTierSelect}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !formData.complexity_tier}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
