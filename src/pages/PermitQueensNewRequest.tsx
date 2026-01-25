import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Crown, Loader2, Home, Zap, Droplets, Building2, Wrench, TreeDeciduous, Shield, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { WizardProgress } from '@/components/permit-queens/WizardProgress';
import { PermitAddressInput } from '@/components/permit-queens/PermitAddressInput';
import { TradeQuestions, TradeQuestionsData, TradeType, getDefaultTradeData } from '@/components/permit-queens/TradeQuestions';
import { PacketPreview } from '@/components/permit-queens/PacketPreview';
import { PacketViewer, PacketData } from '@/components/permit-queens/PacketViewer';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { PricingGrid } from '@/components/permit-queens/PricingCard';
import { JurisdictionRulesPanel } from '@/components/permit-queens/JurisdictionRulesPanel';
import { SmartDocumentUploader } from '@/components/permit-queens/SmartDocumentUploader';
import { MultiMaterialSelector, MultiSelectedProduct } from '@/components/permit-queens/MultiMaterialSelector';
import { SignatureChecklist, generateSignatureRequirements, SignatureRequirement } from '@/components/permit-queens/SignatureChecklist';
import { usePermitRequest, usePricingTiers, PricingTier } from '@/hooks/usePermitRequest';
import { JurisdictionInfo } from '@/hooks/useJurisdictionDetector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'uploaded' | 'processing' | 'signed' | 'needs_fields';
  isPreSigned?: boolean;
}

const WIZARD_STEPS = [
  { number: 1, title: 'Location & Trade', description: 'Property address & permit type' },
  { number: 2, title: 'Project Scope', description: 'Details & product selection' },
  { number: 3, title: 'Documents', description: 'Upload & packet preview' },
  { number: 4, title: 'Review', description: 'Confirm & submit' },
];

const PERMIT_TYPES = [
  { id: 'roofing', label: 'Roofing', icon: Home, description: 'Re-roof, repairs, coatings' },
  { id: 'hvac', label: 'HVAC', icon: Zap, description: 'AC, heating, ductwork' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, description: 'Pipes, water heaters' },
  { id: 'electrical', label: 'Electrical', icon: Zap, description: 'Wiring, panels' },
  { id: 'windows_doors', label: 'Windows & Doors', icon: Building2, description: 'Impact windows/doors' },
  { id: 'general_construction', label: 'General', icon: Wrench, description: 'Additions, renovations' },
  { id: 'tree_removal', label: 'Tree Removal', icon: TreeDeciduous, description: 'Tree permits' },
  { id: 'fence', label: 'Fence', icon: Shield, description: 'Fencing permits' },
];

interface FormData {
  property_address: string;
  jurisdiction_county: string;
  jurisdiction_city: string;
  permit_type: TradeType | '';
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  valuation: number;
  complexity_tier: string;
  isHVHZ: boolean;
}

export default function PermitQueensNewRequest() {
  const navigate = useNavigate();
  const { createPermit, saving } = usePermitRequest();
  const { tiers } = usePricingTiers();
  const [currentStep, setCurrentStep] = useState(1);
  const [tradeQuestionsComplete, setTradeQuestionsComplete] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    property_address: '',
    jurisdiction_county: '',
    jurisdiction_city: '',
    permit_type: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    valuation: 0,
    complexity_tier: 'standard',
    isHVHZ: false,
  });

  const [tradeData, setTradeData] = useState<TradeQuestionsData>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<MultiSelectedProduct[]>([]);
  const [roofType, setRoofType] = useState<'steep' | 'flat' | 'mixed'>('steep');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<any[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<any[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  
  // Packet generation state
  const [generatedPacket, setGeneratedPacket] = useState<PacketData | null>(null);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [tempPermitId, setTempPermitId] = useState<string | null>(null);
  
  // Signature requirements state
  const [signatureRequirements, setSignatureRequirements] = useState<SignatureRequirement[]>([]);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Generate signature requirements based on permit type and jurisdiction
  const computedSignatureRequirements = useMemo(() => {
    if (!formData.permit_type || !formData.jurisdiction_county) return [];
    
    // Map roofing newMaterial to material_type
    const materialType = tradeData.roofing?.newMaterial || '';
    
    return generateSignatureRequirements(
      formData.permit_type,
      formData.jurisdiction_county,
      formData.jurisdiction_city,
      materialType,
      formData.valuation,
      undefined, // year_built not available in current form
      false, // is_hoa not available in current form
      formData.isHVHZ
    );
  }, [formData.permit_type, formData.jurisdiction_county, formData.jurisdiction_city, formData.valuation, formData.isHVHZ, tradeData]);

  // Validation functions
  const validateField = useCallback((field: string, value: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch(field) {
      case 'property_address':
        if (!value?.trim()) errors.property_address = 'Property address is required';
        break;
      case 'owner_name':
        if (!value?.trim()) errors.owner_name = 'Owner name is required';
        break;
      case 'owner_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.owner_email = 'Invalid email format';
        }
        break;
      case 'owner_phone':
        if (value && !/^[\d\s\-\(\)\+]*$/.test(value)) {
          errors.owner_phone = 'Invalid phone format';
        }
        break;
      case 'valuation':
        if (value && value < 0) errors.valuation = 'Valuation must be positive';
        break;
    }
    return errors;
  }, []);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldValue = formData[field as keyof FormData];
    const fieldErrors = validateField(field, fieldValue);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      // Remove old error for this field
      delete newErrors[field];
      // Add new error if exists
      return { ...newErrors, ...fieldErrors };
    });
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (touched[field]) {
      const fieldErrors = validateField(field, value);
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return { ...newErrors, ...fieldErrors };
      });
    }
  };

  const getStepValidationMessage = (): string | null => {
    if (currentStep === 1) {
      if (!formData.property_address?.trim()) return 'Enter property address to continue';
      if (!formData.permit_type) return 'Select a permit type to continue';
    }
    if (currentStep === 2) {
      if (!formData.owner_name?.trim()) return 'Enter owner name to continue';
      if (!tradeQuestionsComplete) return 'Complete project details to continue';
    }
    return null;
  };

  const defaultTiers: PricingTier[] = [
    { id: '1', name: 'Basic', code: 'basic', description: 'Standard processing', base_price: 149, features_json: ['Document review', '5-7 business days'], turnaround_days: 7, criteria_json: {} },
    { id: '2', name: 'Standard', code: 'standard', description: 'Priority processing', base_price: 249, features_json: ['Expedited review', '3-5 business days'], turnaround_days: 5, criteria_json: {} },
    { id: '3', name: 'Complex', code: 'complex', description: 'Rush processing', base_price: 399, features_json: ['Dedicated expediter', '1-2 business days'], turnaround_days: 2, criteria_json: {} },
  ];

  const displayTiers = tiers.length > 0 ? tiers : defaultTiers;

  const handleJurisdictionDetected = (info: JurisdictionInfo) => {
    setFormData(prev => ({
      ...prev,
      jurisdiction_county: info.county,
      jurisdiction_city: info.city,
      isHVHZ: info.isHVHZ,
    }));
  };

  const handlePermitTypeChange = (type: TradeType) => {
    setFormData(prev => ({ ...prev, permit_type: type }));
    setTradeData(getDefaultTradeData(type));
    setTradeQuestionsComplete(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.property_address && formData.permit_type;
      case 2:
        return tradeQuestionsComplete && formData.owner_name;
      case 3:
        return true;
      case 4:
        return formData.complexity_tier;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 3) runGapAnalysis();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const runGapAnalysis = async () => {
    setAnalyzingGaps(true);
    try {
      const { data } = await supabase.functions.invoke('permit-gap-detector-ai', {
        body: { permitRequest: formData, tradeData },
      });
      if (data) {
        setMissingFields(data.missingFields || []);
        setMissingDocuments(data.missingDocuments || []);
        setComplianceIssues(data.complianceIssues || []);
        setCompletionPercentage(data.completionPercentage || 70);
      }
    } catch (error) {
      setCompletionPercentage(70);
    } finally {
      setAnalyzingGaps(false);
    }
  };

  const handleGeneratePacket = async () => {
    setGeneratingPacket(true);
    setGenerationStage('Creating permit project...');
    
    try {
      let permitId = tempPermitId;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to generate a packet');
        setGeneratingPacket(false);
        return;
      }
      
      // Create temporary permit project if not already created
      if (!permitId) {
        const { data: tempPermit, error: permitError } = await supabase
          .from('permit_projects')
          .insert({
            property_address: formData.property_address,
            customer_name: formData.owner_name,
            owner_name: formData.owner_name,
            owner_email: formData.owner_email,
            owner_phone: formData.owner_phone,
            service_type: formData.permit_type || 'roofing',
            permit_type: formData.permit_type,
            jurisdiction_county: formData.jurisdiction_county,
            city: formData.jurisdiction_city,
            scope_description: JSON.stringify(tradeData),
            valuation: formData.valuation,
            complexity_tier: formData.complexity_tier,
            pipeline_status: 'intake',
            status: 'pending',
            user_id: user.id,
          })
          .select()
          .single();
        
        if (permitError) throw permitError;
        permitId = tempPermit.id;
        setTempPermitId(permitId);
      }
      
      setGenerationStage('Generating permit packet...');
      
      const { data, error } = await supabase.functions.invoke('permit-packet-assembler', {
        body: {
          permitRequestId: permitId,
          generateCoverSheet: true,
          generateNOC: true,
          selectedProducts: selectedMaterials.map(m => ({
            id: m.product.id,
            manufacturer: m.product.manufacturer,
            product_name: m.product.product_name,
            noa_number: m.product.noa_number,
            file_url: m.product.file_url,
          })),
          uploadedDocuments: uploadedDocuments.map(d => ({
            type: d.type,
            name: d.name,
            url: d.url,
          })),
        },
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setGeneratedPacket({
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
        setCompletionPercentage(data.data.completionPercentage || 0);
        setGenerationStage('Complete!');
        toast.success('Permit packet generated!');
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Packet generation error:', error);
      toast.error('Failed to generate packet');
      setGenerationStage('');
    } finally {
      setGeneratingPacket(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // If we already created a temp permit, update it instead of creating new
      if (tempPermitId) {
        const { error: updateError } = await supabase
          .from('permit_projects')
          .update({
            complexity_tier: formData.complexity_tier,
            pipeline_status: 'intake',
          })
          .eq('id', tempPermitId);
        
        if (updateError) throw updateError;
        toast.success('Permit request submitted!');
        navigate(`/permit-queens/request/${tempPermitId}`);
        return;
      }
      
      const permitId = await createPermit({
        property_address: formData.property_address,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_phone: formData.owner_phone,
        permit_type: formData.permit_type,
        jurisdiction_county: formData.jurisdiction_county,
        scope_description: JSON.stringify(tradeData),
        valuation: formData.valuation,
        complexity_tier: formData.complexity_tier,
      });
      if (permitId) {
        toast.success('Permit request submitted!');
        navigate(`/permit-queens/request/${permitId}`);
      }
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/permit-queens/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">New Permit Request</span>
          </div>
        </div>
      </header>

      <div className="border-b bg-card py-6">
        <div className="container mx-auto px-4">
          <WizardProgress steps={WIZARD_STEPS} currentStep={currentStep} />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Location & Trade */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Location</CardTitle>
                  <CardDescription>Enter the property address to auto-detect jurisdiction</CardDescription>
                </CardHeader>
                <CardContent>
                  <PermitAddressInput
                    value={formData.property_address}
                    onChange={(addr) => setFormData(prev => ({ ...prev, property_address: addr }))}
                    onJurisdictionDetected={handleJurisdictionDetected}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Permit Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PERMIT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.permit_type === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => handlePermitTypeChange(type.id as TradeType)}
                          className={cn(
                            "p-4 border rounded-lg text-center transition-all",
                            isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50"
                          )}
                        >
                          <Icon className={cn("w-8 h-8 mx-auto mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Jurisdiction Rules Panel - Shows after address & permit type selected */}
              {formData.jurisdiction_county && formData.permit_type && (
                <JurisdictionRulesPanel
                  county={formData.jurisdiction_county}
                  city={formData.jurisdiction_city}
                  permitType={formData.permit_type}
                  isHVHZ={formData.isHVHZ}
                  showDocuments={false}
                />
              )}
            </div>
          )}

          {/* Step 2: Trade-Specific Questions */}
          {currentStep === 2 && formData.permit_type && (
            <div className="space-y-6">
              {/* Property Owner - FIRST */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Owner
                  </CardTitle>
                  <CardDescription>Enter the property owner's information</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Owner Name <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      value={formData.owner_name} 
                      onChange={(e) => handleFieldChange('owner_name', e.target.value)} 
                      onBlur={() => handleBlur('owner_name')}
                      placeholder="John Smith"
                      className={cn(
                        touched.owner_name && validationErrors.owner_name && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {touched.owner_name && validationErrors.owner_name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.owner_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Email</Label>
                    <Input 
                      type="email" 
                      value={formData.owner_email} 
                      onChange={(e) => handleFieldChange('owner_email', e.target.value)}
                      onBlur={() => handleBlur('owner_email')}
                      placeholder="john@example.com"
                      className={cn(
                        touched.owner_email && validationErrors.owner_email && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {touched.owner_email && validationErrors.owner_email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.owner_email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Phone</Label>
                    <Input 
                      type="tel" 
                      value={formData.owner_phone} 
                      onChange={(e) => handleFieldChange('owner_phone', e.target.value)}
                      onBlur={() => handleBlur('owner_phone')}
                      placeholder="(954) 555-1234"
                      className={cn(
                        touched.owner_phone && validationErrors.owner_phone && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {touched.owner_phone && validationErrors.owner_phone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.owner_phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Valuation ($)</Label>
                    <Input 
                      type="number" 
                      value={formData.valuation || ''} 
                      onChange={(e) => handleFieldChange('valuation', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleBlur('valuation')}
                      placeholder="15000"
                      className={cn(
                        touched.valuation && validationErrors.valuation && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {touched.valuation && validationErrors.valuation && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {validationErrors.valuation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trade Questions - SECOND */}
              <TradeQuestions
                trade={formData.permit_type}
                isHVHZ={formData.isHVHZ}
                data={tradeData}
                onChange={setTradeData}
                onComplete={setTradeQuestionsComplete}
              />
              
              {/* Multi-Material Selector for Roofing - THIRD */}
              {formData.permit_type === 'roofing' && (
                <MultiMaterialSelector
                  isHVHZ={formData.isHVHZ}
                  roofType={roofType}
                  selectedProducts={selectedMaterials}
                  onProductsChange={setSelectedMaterials}
                  onRoofTypeChange={setRoofType}
                />
              )}
            </div>
          )}

          {/* Step 3: Documents & Packet */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Required Documents from Jurisdiction Rules */}
              {formData.jurisdiction_county && (
                <JurisdictionRulesPanel
                  county={formData.jurisdiction_county}
                  city={formData.jurisdiction_city}
                  permitType={formData.permit_type || undefined}
                  isHVHZ={formData.isHVHZ}
                  showGotchas={false}
                  showRequirements={false}
                  showDocuments={true}
                  compact={true}
                />
              )}
              
              {/* Smart Document Uploader */}
              <SmartDocumentUploader
                jurisdiction={formData.jurisdiction_county}
                permitType={formData.permit_type || ''}
                onDocumentsChange={setUploadedDocuments}
              />
              
              <PacketPreview
                permitType={formData.permit_type}
                jurisdiction={formData.jurisdiction_county}
                isHVHZ={formData.isHVHZ}
                uploadedDocuments={uploadedDocuments}
                selectedProducts={[
                  // Roofing materials
                  ...selectedMaterials.map(m => ({
                    id: m.id,
                    product: m.product,
                    category: m.category as 'underlayment' | 'roof_covering' | 'fasteners' | 'other'
                  })),
                  // Window/door products from trade data
                  ...(formData.permit_type === 'windows_doors' && tradeData.windows_doors ? [
                    ...(tradeData.windows_doors.selectedWindowProduct ? [{
                      id: tradeData.windows_doors.selectedWindowProduct.id || crypto.randomUUID(),
                      product: {
                        id: tradeData.windows_doors.selectedWindowProduct.id || crypto.randomUUID(),
                        manufacturer: tradeData.windows_doors.selectedWindowProduct.manufacturer || '',
                        product_name: tradeData.windows_doors.selectedWindowProduct.product_name || 'Selected Window',
                        product_category: 'Windows',
                        product_line: null,
                        noa_number: tradeData.windows_doors.selectedWindowProduct.noa_number || null,
                        fl_product_approval: tradeData.windows_doors.selectedWindowProduct.fl_product_approval || null,
                        uil_number: null,
                        expiration_date: null,
                        hvhz_approved: formData.isHVHZ,
                        wind_speed_rating: null,
                        file_path: null,
                        file_url: tradeData.windows_doors.selectedWindowProduct.file_url || null,
                        is_active: true
                      },
                      category: 'other' as const
                    }] : []),
                    ...(tradeData.windows_doors.selectedDoorProduct ? [{
                      id: tradeData.windows_doors.selectedDoorProduct.id || crypto.randomUUID(),
                      product: {
                        id: tradeData.windows_doors.selectedDoorProduct.id || crypto.randomUUID(),
                        manufacturer: tradeData.windows_doors.selectedDoorProduct.manufacturer || '',
                        product_name: tradeData.windows_doors.selectedDoorProduct.product_name || 'Selected Door',
                        product_category: 'Doors',
                        product_line: null,
                        noa_number: tradeData.windows_doors.selectedDoorProduct.noa_number || null,
                        fl_product_approval: tradeData.windows_doors.selectedDoorProduct.fl_product_approval || null,
                        uil_number: null,
                        expiration_date: null,
                        hvhz_approved: formData.isHVHZ,
                        wind_speed_rating: null,
                        file_path: null,
                        file_url: tradeData.windows_doors.selectedDoorProduct.file_url || null,
                        is_active: true
                      },
                      category: 'other' as const
                    }] : []),
                    ...(tradeData.windows_doors.selectedSlidingDoorProduct ? [{
                      id: tradeData.windows_doors.selectedSlidingDoorProduct.id || crypto.randomUUID(),
                      product: {
                        id: tradeData.windows_doors.selectedSlidingDoorProduct.id || crypto.randomUUID(),
                        manufacturer: tradeData.windows_doors.selectedSlidingDoorProduct.manufacturer || '',
                        product_name: tradeData.windows_doors.selectedSlidingDoorProduct.product_name || 'Selected Sliding Door',
                        product_category: 'Sliding Doors',
                        product_line: null,
                        noa_number: tradeData.windows_doors.selectedSlidingDoorProduct.noa_number || null,
                        fl_product_approval: tradeData.windows_doors.selectedSlidingDoorProduct.fl_product_approval || null,
                        uil_number: null,
                        expiration_date: null,
                        hvhz_approved: formData.isHVHZ,
                        wind_speed_rating: null,
                        file_path: null,
                        file_url: tradeData.windows_doors.selectedSlidingDoorProduct.file_url || null,
                        is_active: true
                      },
                      category: 'other' as const
                    }] : [])
                  ] : [])
                ]}
                formData={{ property_address: formData.property_address, owner_name: formData.owner_name, scope_description: JSON.stringify(tradeData), valuation: formData.valuation }}
                onGeneratePacket={handleGeneratePacket}
                generating={generatingPacket}
              />
              
              {/* Show generation stage */}
              {generatingPacket && generationStage && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>{generationStage}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Review Your Request</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{formData.property_address}</p></div>
                  <div><p className="text-sm text-muted-foreground">Jurisdiction</p><p className="font-medium">{formData.jurisdiction_county || 'Detected from address'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Permit Type</p><p className="font-medium capitalize">{formData.permit_type?.replace('_', ' ')}</p></div>
                  <div><p className="text-sm text-muted-foreground">Owner</p><p className="font-medium">{formData.owner_name}</p></div>
                </CardContent>
              </Card>

              {/* Generated Packet Viewer */}
              {generatedPacket ? (
                <PacketViewer
                  packet={generatedPacket}
                  onRegenerate={handleGeneratePacket}
                  onEdit={() => setCurrentStep(3)}
                  generating={generatingPacket}
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No packet generated yet</p>
                    <Button onClick={handleGeneratePacket} disabled={generatingPacket}>
                      {generatingPacket ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      Generate Packet Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {analyzingGaps ? (
                <Card><CardContent className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" /><p>Analyzing...</p></CardContent></Card>
              ) : (
                <MissingItemsPanel completionPercentage={completionPercentage} missingFields={missingFields} missingDocuments={missingDocuments} complianceIssues={complianceIssues} onFieldClick={() => setCurrentStep(2)} onUploadClick={() => setCurrentStep(3)} />
              )}
              
              {/* Signature Requirements Checklist */}
              {computedSignatureRequirements.length > 0 && (
                <SignatureChecklist
                  requirements={computedSignatureRequirements}
                  ownerName={formData.owner_name}
                  estimatedValue={formData.valuation}
                  county={formData.jurisdiction_county}
                  onSignatureComplete={(id) => {
                    // Mark signature as complete
                    toast.success('Signature recorded');
                  }}
                  onDownloadForSigning={(req) => {
                    // Download document for wet signing
                    if (req.documentUrl) {
                      window.open(req.documentUrl, '_blank');
                    } else {
                      toast.info('Document will be available after packet generation');
                    }
                  }}
                />
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">Select Service Tier</h3>
                <PricingGrid tiers={displayTiers} selectedTier={formData.complexity_tier} recommendedTier="standard" onSelectTier={(tier) => setFormData(prev => ({ ...prev, complexity_tier: tier }))} />
              </div>
            </div>
          )}

          {/* Validation Message */}
          {getStepValidationMessage() && !canProceed() && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                {getStepValidationMessage()}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ArrowRight className="h-4 w-4 ml-2" />
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
