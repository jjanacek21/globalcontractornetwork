import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Crown, Loader2, Home, Zap, Droplets, Building2, Wrench, TreeDeciduous, Shield, AlertTriangle } from 'lucide-react';
import { WizardProgress } from '@/components/permit-queens/WizardProgress';
import { PermitAddressInput } from '@/components/permit-queens/PermitAddressInput';
import { TradeQuestions, TradeQuestionsData, TradeType, getDefaultTradeData } from '@/components/permit-queens/TradeQuestions';
import { PacketPreview } from '@/components/permit-queens/PacketPreview';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { PricingGrid } from '@/components/permit-queens/PricingCard';
import { JurisdictionRulesPanel } from '@/components/permit-queens/JurisdictionRulesPanel';
import { usePermitRequest, usePricingTiers, PricingTier } from '@/hooks/usePermitRequest';
import { JurisdictionInfo } from '@/hooks/useJurisdictionDetector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<any[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<any[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

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

  const handleSubmit = async () => {
    try {
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
              <TradeQuestions
                trade={formData.permit_type}
                isHVHZ={formData.isHVHZ}
                data={tradeData}
                onChange={setTradeData}
                onComplete={setTradeQuestionsComplete}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Property Owner</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner Name *</Label>
                    <Input value={formData.owner_name} onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))} placeholder="John Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Email</Label>
                    <Input type="email" value={formData.owner_email} onChange={(e) => setFormData(prev => ({ ...prev, owner_email: e.target.value }))} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Phone</Label>
                    <Input type="tel" value={formData.owner_phone} onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))} placeholder="(954) 555-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valuation ($)</Label>
                    <Input type="number" value={formData.valuation || ''} onChange={(e) => setFormData(prev => ({ ...prev, valuation: parseFloat(e.target.value) || 0 }))} placeholder="15000" />
                  </div>
                </CardContent>
              </Card>
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
              
              <PacketPreview
                permitType={formData.permit_type}
                jurisdiction={formData.jurisdiction_county}
                isHVHZ={formData.isHVHZ}
                uploadedDocuments={[]}
                selectedProducts={[]}
                formData={{ property_address: formData.property_address, owner_name: formData.owner_name, scope_description: JSON.stringify(tradeData), valuation: formData.valuation }}
                onGeneratePacket={() => toast.success('Packet generation started!')}
              />
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

              {analyzingGaps ? (
                <Card><CardContent className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" /><p>Analyzing...</p></CardContent></Card>
              ) : (
                <MissingItemsPanel completionPercentage={completionPercentage} missingFields={missingFields} missingDocuments={missingDocuments} complianceIssues={complianceIssues} onFieldClick={() => setCurrentStep(2)} onUploadClick={() => setCurrentStep(3)} />
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">Select Service Tier</h3>
                <PricingGrid tiers={displayTiers} selectedTier={formData.complexity_tier} recommendedTier="standard" onSelectTier={(tier) => setFormData(prev => ({ ...prev, complexity_tier: tier }))} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button>
            {currentStep < 4 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : <>Submit Request<ArrowRight className="h-4 w-4 ml-2" /></>}</Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
