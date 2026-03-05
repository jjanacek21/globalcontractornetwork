import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Crown, Loader2, Home, Zap, Droplets, Building2, Wrench, TreeDeciduous, Shield, AlertTriangle, CheckCircle2, Package, CreditCard, Sparkles, Clock, Plus, Ruler } from 'lucide-react';
import { WizardProgress } from '@/components/permit-queens/WizardProgress';
import { PermitAddressInput } from '@/components/permit-queens/PermitAddressInput';
import { TradeQuestions, TradeQuestionsData, TradeType, getDefaultTradeData } from '@/components/permit-queens/TradeQuestions';
import { PacketPreview } from '@/components/permit-queens/PacketPreview';
import { PacketViewer, PacketData } from '@/components/permit-queens/PacketViewer';
import { MissingItemsPanel } from '@/components/permit-queens/MissingItemsPanel';
import { JurisdictionRulesPanel } from '@/components/permit-queens/JurisdictionRulesPanel';
import { SmartDocumentUploader } from '@/components/permit-queens/SmartDocumentUploader';
import { MultiMaterialSelector, MultiSelectedProduct } from '@/components/permit-queens/MultiMaterialSelector';
import { MobileMaterialSheet } from '@/components/permit-queens/MobileMaterialSheet';
import { SignatureChecklist, generateSignatureRequirements, SignatureRequirement } from '@/components/permit-queens/SignatureChecklist';
import { SignatureCollectionDialog } from '@/components/permit-queens/SignatureCollectionDialog';
import { usePermitRequest, usePricingTiers, PricingTier } from '@/hooks/usePermitRequest';
import { usePropertyLookup } from '@/hooks/usePropertyLookup';
import { useContractorProfile, PriorPermitData } from '@/hooks/useContractorProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { JurisdictionInfo } from '@/hooks/useJurisdictionDetector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'uploaded' | 'processing' | 'signed' | 'needs_fields';
  isPreSigned?: boolean;
}

// Optimized 3-step wizard structure
const WIZARD_STEPS = [
  { number: 1, title: 'Property & Scope', description: 'Address, owner & project basics' },
  { number: 2, title: 'Materials & Docs', description: 'Products, requirements & uploads' },
  { number: 3, title: 'Review & Submit', description: 'Verify and submit request' },
];

const PERMIT_TYPES = [
  { id: 'roofing', label: 'Roofing', icon: Home, description: 'Re-roof, repairs, coatings', priority: true },
  { id: 'windows_doors', label: 'Windows & Doors', icon: Building2, description: 'Impact windows/doors', priority: true },
  { id: 'hvac', label: 'HVAC', icon: Zap, description: 'AC, heating, ductwork', priority: false },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, description: 'Pipes, water heaters', priority: false },
  { id: 'electrical', label: 'Electrical', icon: Zap, description: 'Wiring, panels', priority: false },
  { id: 'general_construction', label: 'General', icon: Wrench, description: 'Additions, renovations', priority: false },
  { id: 'tree_removal', label: 'Tree Removal', icon: TreeDeciduous, description: 'Tree permits', priority: false },
  { id: 'fence', label: 'Fence', icon: Shield, description: 'Fencing permits', priority: false },
  { id: 'engineering', label: 'Engineering', icon: Ruler, description: 'Structural calcs, sealed plans', priority: false },
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

/**
 * Extract trade-specific data into flat DB columns for permit_projects.
 * Maps RoofingFormData / WindowDoorFormData fields → dedicated columns.
 */
function extractTradeColumns(tradeData: TradeQuestionsData, formData: FormData): Record<string, any> {
  const cols: Record<string, any> = {};
  
  // Roofing fields
  const r = tradeData.roofing;
  if (r) {
    cols.roof_work_type = r.workType || null;
    cols.roof_size_sqft = r.roofSizeUnit === 'squares' ? (r.roofSize || 0) * 100 : r.roofSize || null;
    cols.roof_pitch = r.pitch || null;
    cols.roof_stories = r.stories ? parseInt(r.stories) : null;
    cols.existing_roof_material = r.existingMaterial || null;
    cols.new_roof_material = r.newMaterial || null;
    cols.underlayment_product = r.selectedUnderlayment?.product_name || null;
    cols.underlayment_noa = r.selectedUnderlayment?.noa_number || null;
    cols.roof_covering_product = r.selectedCovering?.product_name || null;
    cols.roof_covering_noa = r.selectedCovering?.noa_number || null;
    cols.fastener_product = r.selectedFasteners?.product_name || null;
    cols.fastener_noa = r.selectedFasteners?.noa_number || null;
    cols.deck_attachment_confirmed = r.deckAttachmentConfirmed || false;
    cols.year_built = r.yearBuilt || null;
    cols.building_type = r.buildingType || null;
    cols.has_exposed_ceilings = r.hasExposedCeilings || false;
    cols.has_ponding_water = r.hasPondingWater || false;
    cols.requires_overflow_scuppers = r.requiresOverflowScuppers || false;
    cols.obstacles = r.obstacles?.length ? r.obstacles.join(', ') : null;
  }
  
  // Windows & Doors fields
  const w = tradeData.windows_doors;
  if (w) {
    cols.window_count = w.windowCount || null;
    cols.door_count = w.doorCount || null;
    cols.sliding_door_count = w.slidingDoorCount || null;
    cols.frame_material = w.frameMaterial || null;
    cols.u_factor = w.uFactor ? String(w.uFactor) : null;
    cols.shgc = w.shgc ? String(w.shgc) : null;
    cols.window_product = w.selectedWindowProduct?.product_name || null;
    cols.window_noa = w.selectedWindowProduct?.noa_number || null;
    cols.door_product = w.selectedDoorProduct?.product_name || null;
    cols.door_noa = w.selectedDoorProduct?.noa_number || null;
    cols.engineer_required = w.requiresEngineering || false;
  }
  
  // Compliance
  cols.is_hvhz = formData.isHVHZ || false;
  
  return cols;
}

export default function PermitQueensNewRequest() {
  const navigate = useNavigate();
  const { createPermit, saving } = usePermitRequest();
  const { tiers } = usePricingTiers();
  const { lookupPriorPermit } = useContractorProfile(null);
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [tradeQuestionsComplete, setTradeQuestionsComplete] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  
  // Prior permit auto-fill state
  const [priorPermit, setPriorPermit] = useState<PriorPermitData | null>(null);
  const [showPriorPermitBanner, setShowPriorPermitBanner] = useState(false);
  const [lookingUpPriorPermit, setLookingUpPriorPermit] = useState(false);
  
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
  
  // Property lookup hook - auto-triggers when address and county are set
  const propertyLookup = usePropertyLookup(
    formData.property_address,
    formData.jurisdiction_county,
    { enabled: formData.property_address.length > 15 && !!formData.jurisdiction_county }
  );
  
  // Packet generation state
  const [generatedPacket, setGeneratedPacket] = useState<PacketData | null>(null);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [tempPermitId, setTempPermitId] = useState<string | null>(null);
  
  // Signature requirements state
  const [signatureRequirements, setSignatureRequirements] = useState<SignatureRequirement[]>([]);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [collectedSignatures, setCollectedSignatures] = useState<any[]>([]);
  
  // Payment agreement state
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Prior permit lookup effect - triggers when address changes
  useEffect(() => {
    const lookupPrior = async () => {
      if (formData.property_address.length > 15) {
        setLookingUpPriorPermit(true);
        try {
          const result = await lookupPriorPermit(formData.property_address);
          if (result) {
            setPriorPermit(result);
            setShowPriorPermitBanner(true);
          } else {
            setPriorPermit(null);
            setShowPriorPermitBanner(false);
          }
        } catch (error) {
          console.error('Prior permit lookup error:', error);
        } finally {
          setLookingUpPriorPermit(false);
        }
      }
    };
    
    // Debounce the lookup
    const timer = setTimeout(lookupPrior, 500);
    return () => clearTimeout(timer);
  }, [formData.property_address, lookupPriorPermit]);

  // Apply prior permit data
  const applyPriorPermitData = () => {
    if (priorPermit) {
      setFormData(prev => ({
        ...prev,
        owner_name: priorPermit.owner_name || prev.owner_name,
        owner_email: priorPermit.owner_email || prev.owner_email,
        owner_phone: priorPermit.owner_phone || prev.owner_phone,
        valuation: priorPermit.valuation || prev.valuation,
      }));
      setShowPriorPermitBanner(false);
      toast.success('Applied data from previous permit');
    }
  };

  // Create draft permit project when entering Step 2 (to ensure doc uploads are linked)
  useEffect(() => {
    const createDraftPermit = async () => {
      if (currentStep === 2 && !tempPermitId && formData.property_address && formData.owner_name) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data: draft, error } = await supabase
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
              pipeline_status: 'draft',
              status: 'draft',
              user_id: user.id,
              scope_description: JSON.stringify(tradeData),
              valuation: formData.valuation || null,
              ...extractTradeColumns(tradeData, formData),
              selected_products: selectedMaterials.map(m => ({
                id: m.product.id,
                manufacturer: m.product.manufacturer,
                product_name: m.product.product_name,
                noa_number: m.product.noa_number,
                file_url: m.product.file_url,
                category: m.category,
              })),
            } as any)
            .select()
            .single();
          
          if (!error && draft) {
            setTempPermitId(draft.id);
            console.log('Created draft permit:', draft.id);
          }
        } catch (e) {
          console.error('Failed to create draft permit:', e);
        }
      }
    };
    
    createDraftPermit();
  }, [currentStep, formData.property_address, formData.owner_name]);

  // Fetch uploaded documents from DB when entering Step 3 (to persist across navigation)
  useEffect(() => {
    const fetchUploadedDocs = async () => {
      if (currentStep === 3 && tempPermitId) {
        try {
          const { data: dbDocs } = await supabase
            .from('permit_project_documents')
            .select('*')
            .eq('project_id', tempPermitId);
          
          if (dbDocs && dbDocs.length > 0) {
            // Merge with local state, avoiding duplicates
            setUploadedDocuments(prev => {
              const merged = [...prev];
              dbDocs.forEach((dbDoc: any) => {
                if (!merged.some(d => d.url === dbDoc.file_path || d.name === dbDoc.file_name)) {
                  merged.push({
                    id: dbDoc.id,
                    name: dbDoc.file_name,
                    type: dbDoc.document_type,
                    url: dbDoc.file_path,
                    status: 'uploaded' as const,
                  });
                }
              });
              return merged;
            });
            console.log(`Loaded ${dbDocs.length} documents from database`);
          }
        } catch (e) {
          console.error('Failed to fetch documents from DB:', e);
        }
      }
    };
    
    fetchUploadedDocs();
  }, [currentStep, tempPermitId]);

  // Auto-generate packet when entering Step 3
  useEffect(() => {
    if (currentStep === 3 && !generatedPacket && !generatingPacket && formData.property_address && formData.owner_name) {
      handleGeneratePacket();
    }
  }, [currentStep]);

  // Calculate completion percentage based on form state
  const calculatedCompletionPercentage = useMemo(() => {
    let total = 0;
    let completed = 0;
    
    // Step 1 fields
    total += 3; // address, permit_type, owner_name
    if (formData.property_address) completed++;
    if (formData.permit_type) completed++;
    if (formData.owner_name) completed++;
    
    // Step 2 fields
    total += 2; // trade questions, materials
    if (tradeQuestionsComplete) completed++;
    if (selectedMaterials.length > 0 || formData.permit_type !== 'roofing') completed++;
    
    // Step 3 fields
    total += 2; // packet, payment agreement
    if (generatedPacket) completed++;
    if (paymentAgreed) completed++;
    
    return Math.round((completed / total) * 100);
  }, [formData, tradeQuestionsComplete, selectedMaterials, generatedPacket, paymentAgreed]);
  
  // Generate signature requirements based on permit type and jurisdiction
  const computedSignatureRequirements = useMemo(() => {
    if (!formData.permit_type || !formData.jurisdiction_county) return [];
    
    const materialType = tradeData.roofing?.newMaterial || '';
    
    return generateSignatureRequirements(
      formData.permit_type,
      formData.jurisdiction_county,
      formData.jurisdiction_city,
      materialType,
      formData.valuation,
      undefined,
      false,
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
      delete newErrors[field];
      return { ...newErrors, ...fieldErrors };
    });
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (!formData.owner_name?.trim()) return 'Enter owner name to continue';
    }
    if (currentStep === 2) {
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

  // Updated canProceed for 3-step wizard
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.property_address && formData.permit_type && formData.owner_name;
      case 2:
        return tradeQuestionsComplete;
      case 3:
        return formData.complexity_tier && paymentAgreed;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // Swipe navigation handler for mobile
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentStep > 1) {
      prevStep();
    } else if (info.offset.x < -threshold && currentStep < 3 && canProceed()) {
      nextStep();
    }
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to generate a packet');
        setGeneratingPacket(false);
        return;
      }
      
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
            ...extractTradeColumns(tradeData, formData),
            selected_products: selectedMaterials.map(m => ({
              id: m.product.id,
              manufacturer: m.product.manufacturer,
              product_name: m.product.product_name,
              noa_number: m.product.noa_number,
              file_url: m.product.file_url,
              category: m.category,
            })),
          } as any)
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
        
        // Run gap analysis after packet generation
        runGapAnalysis();
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
      if (tempPermitId) {
        const { error: updateError } = await supabase
          .from('permit_projects')
          .update({
            complexity_tier: formData.complexity_tier,
            pipeline_status: 'intake',
            scope_description: JSON.stringify(tradeData),
            valuation: formData.valuation || null,
            ...extractTradeColumns(tradeData, formData),
            selected_products: selectedMaterials.map(m => ({
              id: m.product.id,
              manufacturer: m.product.manufacturer,
              product_name: m.product.product_name,
              noa_number: m.product.noa_number,
              file_url: m.product.file_url,
              category: m.category,
            })),
          } as any)
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

  // Build selected products array for packet preview
  const buildSelectedProducts = () => {
    const products = [
      ...selectedMaterials.map(m => ({
        id: m.id,
        product: m.product,
        category: m.category as 'underlayment' | 'roof_covering' | 'fasteners' | 'other'
      })),
    ];
    
    if (formData.permit_type === 'windows_doors' && tradeData.windows_doors) {
      if (tradeData.windows_doors.selectedWindowProduct) {
        products.push({
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
        });
      }
      if (tradeData.windows_doors.selectedDoorProduct) {
        products.push({
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
        });
      }
      if (tradeData.windows_doors.selectedSlidingDoorProduct) {
        products.push({
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
        });
      }
    }
    
    return products;
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
          <WizardProgress 
            steps={WIZARD_STEPS} 
            currentStep={currentStep} 
            completionPercentage={calculatedCompletionPercentage}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isMobile ? 50 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? -50 : 0 }}
              transition={{ duration: 0.2 }}
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
          {/* Step 1: Property & Scope (Merged) */}
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

              {/* Prior Permit Banner - Shows when previous permit found at this address */}
              {showPriorPermitBanner && priorPermit && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-sm">
                      <strong>Previous permit found!</strong> Owner: {priorPermit.owner_name} 
                      {priorPermit.valuation && ` • Valuation: $${priorPermit.valuation.toLocaleString()}`}
                    </span>
                    <Button size="sm" onClick={applyPriorPermitData} className="shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Use This Data
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading indicator for prior permit lookup */}
              {lookingUpPriorPermit && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking for previous permits at this address...
                </div>
              )}

              {/* Permit Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Permit Type</CardTitle>
                  <CardDescription>Select the type of permit you need</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Priority types first - responsive grid */}
                  <div className={cn("grid gap-3 mb-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                    {PERMIT_TYPES.filter(t => t.priority).map((type) => {
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
                  
                  {/* Other types - responsive grid */}
                  <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-6")}>
                    {PERMIT_TYPES.filter(t => !t.priority).map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.permit_type === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => handlePermitTypeChange(type.id as TradeType)}
                          className={cn(
                            "p-3 border rounded-lg text-center transition-all opacity-70 hover:opacity-100",
                            isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20 opacity-100" : "hover:border-primary/50"
                          )}
                        >
                          <Icon className={cn("w-5 h-5 mx-auto mb-1", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <p className="text-xs font-medium">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Owner Info - Moved from Step 2 */}
              {formData.permit_type && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Property Owner
                    </CardTitle>
                    <CardDescription>Enter the property owner's information</CardDescription>
                  </CardHeader>
                  <CardContent className={cn("grid gap-4", isMobile ? "grid-cols-1" : "md:grid-cols-2")}>
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
              )}

              {/* Jurisdiction Rules Panel */}
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

          {/* Step 2: Materials & Documents (Merged) */}
          {currentStep === 2 && formData.permit_type && (
            <div className="space-y-6">
              {/* Property Data Banner */}
              {propertyLookup.yearBuilt && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong>Property data detected:</strong> Year Built: {propertyLookup.yearBuilt}
                    {propertyLookup.ownerName && ` • Owner: ${propertyLookup.ownerName}`}
                    {propertyLookup.isHVHZ && (
                      <Badge variant="destructive" className="ml-2 text-xs">HVHZ Zone</Badge>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Trade Questions */}
              <TradeQuestions
                trade={formData.permit_type}
                isHVHZ={formData.isHVHZ || propertyLookup.isHVHZ}
                data={tradeData}
                onChange={setTradeData}
                onComplete={setTradeQuestionsComplete}
                suggestedYearBuilt={propertyLookup.yearBuilt}
                suggestedOwnerName={propertyLookup.ownerName}
                propertyLoading={propertyLookup.loading}
              />
              
              {/* Multi-Material Selector for Roofing */}
              {formData.permit_type === 'roofing' && (
                <>
                  {/* Mobile: Show button to open bottom sheet */}
                  {isMobile ? (
                    <Card>
                      <CardContent className="pt-6">
                        <Button 
                          onClick={() => setMobileSheetOpen(true)} 
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Select Materials ({selectedMaterials.length} selected)
                        </Button>
                        {selectedMaterials.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedMaterials.slice(0, 3).map(sel => (
                              <Badge key={`${sel.id}-${sel.category}`} variant="secondary" className="text-xs">
                                {sel.product.product_name}
                              </Badge>
                            ))}
                            {selectedMaterials.length > 3 && (
                              <Badge variant="outline">+{selectedMaterials.length - 3} more</Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <MultiMaterialSelector
                      isHVHZ={formData.isHVHZ}
                      roofType={roofType}
                      selectedProducts={selectedMaterials}
                      onProductsChange={setSelectedMaterials}
                      onRoofTypeChange={setRoofType}
                    />
                  )}
                </>
              )}

              {/* Inline Document Requirements Checklist */}
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
              
              {/* Smart Document Uploader - Moved from Step 3 */}
              <SmartDocumentUploader
                jurisdiction={formData.jurisdiction_county}
                permitType={formData.permit_type || ''}
                onDocumentsChange={setUploadedDocuments}
              />
            </div>
          )}

          {/* Step 3: Review & Submit (Streamlined) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Compact Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("grid gap-4 text-sm", isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4")}>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium truncate">{formData.property_address}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jurisdiction</p>
                      <p className="font-medium">{formData.jurisdiction_county || 'Auto-detected'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Permit Type</p>
                      <p className="font-medium capitalize">{formData.permit_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-medium">{formData.owner_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Generated Packet Viewer */}
              {generatingPacket ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="font-medium">{generationStage || 'Generating packet...'}</p>
                    <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
                  </CardContent>
                </Card>
              ) : generatedPacket ? (
                <PacketViewer
                  packet={generatedPacket}
                  onRegenerate={handleGeneratePacket}
                  onEdit={() => setCurrentStep(2)}
                  generating={generatingPacket}
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Packet generation failed or not started</p>
                    <Button onClick={handleGeneratePacket} disabled={generatingPacket}>
                      {generatingPacket ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      Generate Packet Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Gap Analysis */}
              {analyzingGaps ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing completeness...</p>
                  </CardContent>
                </Card>
              ) : (missingFields.length > 0 || missingDocuments.length > 0 || complianceIssues.length > 0) && (
                <MissingItemsPanel 
                  completionPercentage={completionPercentage} 
                  missingFields={missingFields} 
                  missingDocuments={missingDocuments} 
                  complianceIssues={complianceIssues} 
                  onFieldClick={() => setCurrentStep(1)} 
                  onUploadClick={() => setCurrentStep(2)} 
                />
              )}
              
              {/* Signature Requirements Checklist */}
              {computedSignatureRequirements.length > 0 && (
                <>
                  <SignatureChecklist
                    requirements={computedSignatureRequirements}
                    ownerName={formData.owner_name}
                    estimatedValue={formData.valuation}
                    county={formData.jurisdiction_county}
                    onSignatureComplete={(id) => {
                      toast.success('Signature recorded');
                    }}
                    onDownloadForSigning={async (req) => {
                      if (req.documentUrl) {
                        try {
                          const response = await fetch(req.documentUrl);
                          if (!response.ok) throw new Error('Download failed');
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `${req.documentType || 'document'}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                        } catch (err) {
                          toast.error('Failed to download document');
                        }
                      } else {
                        toast.info('Document will be available after packet generation');
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSignatureDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Collect All Signatures ({collectedSignatures.length}/{computedSignatureRequirements.filter(r => r.signerType === 'owner' || r.signerType === 'qualifier').length})
                  </Button>
                </>
              )}

              {/* Service Selection & Payment Agreement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Service Selection & Payment
                  </CardTitle>
                  <CardDescription>
                    Select your expediting service level and acknowledge payment terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Type Dropdown */}
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select 
                      value={formData.complexity_tier} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, complexity_tier: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          <div className="flex items-center justify-between gap-4">
                            <span>Basic (7-day turnaround)</span>
                            <Badge variant="secondary">$99</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="standard">
                          <div className="flex items-center justify-between gap-4">
                            <span>Standard (5-day turnaround)</span>
                            <Badge variant="secondary">$199</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="complex">
                          <div className="flex items-center justify-between gap-4">
                            <span>Complex/Rush (2-day turnaround)</span>
                            <Badge variant="secondary">$349</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2 bg-green-500/10 text-green-600 border-green-500/20">FREE BETA</Badge>
                      Currently FREE for beta testing. Normal pricing shown for reference.
                    </p>
                  </div>

                  {/* Payment Agreement Checkbox */}
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                    <Checkbox 
                      id="payment-agree" 
                      checked={paymentAgreed}
                      onCheckedChange={(checked) => setPaymentAgreed(checked === true)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="payment-agree" className="font-medium cursor-pointer">
                        I agree to pay the expediting fee and city permit costs
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Once your permit packet is complete and ready for submission, 
                        you will be charged the expediting fee plus any city/county 
                        permit fees. You will receive an invoice before any charges are made.
                      </p>
                    </div>
                  </div>

                  {/* Credit Card Section - Placeholder */}
                  <div className="space-y-2">
                    <Label>Payment Method (Optional)</Label>
                    <div className="p-4 border rounded-lg border-dashed text-center text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Credit card collection will be enabled after beta.</p>
                      <p className="text-xs">For now, you'll receive an invoice when your packet is ready.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Validation Message */}
          {getStepValidationMessage() && !canProceed() && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10 mt-6">
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
            {currentStep < 3 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving || !canProceed()}>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Material Sheet */}
      <MobileMaterialSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        isHVHZ={formData.isHVHZ}
        roofType={roofType}
        selectedProducts={selectedMaterials}
        onProductsChange={setSelectedMaterials}
      />

      {/* Signature Collection Dialog */}
      <SignatureCollectionDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        requirements={computedSignatureRequirements}
        ownerName={formData.owner_name}
        onComplete={(signatures) => {
          setCollectedSignatures(signatures);
          toast.success(`${signatures.length} signatures collected successfully`);
        }}
      />
    </div>
  );
}
