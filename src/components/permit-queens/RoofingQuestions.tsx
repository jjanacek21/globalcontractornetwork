import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Layers, Ruler, AlertTriangle, CheckCircle2, Shield, FileText, X, Loader2, Sparkles, ClipboardCheck } from 'lucide-react';
import { useTradeProducts, TradeProduct } from '@/hooks/useTradeProducts';
import { cn } from '@/lib/utils';

export interface RoofingFormData {
  workType: 'reroof' | 'repair' | 'coating' | 'new_construction' | '';
  roofSize: number;
  roofSizeUnit: 'sqft' | 'squares';
  pitch: 'flat' | 'low' | 'standard' | 'steep' | '';
  stories: '1' | '2' | '3+' | '';
  existingMaterial: 'shingle' | 'tile' | 'metal' | 'flat_tpo' | 'other' | '';
  newMaterial: 'shingle' | 'tile' | 'metal' | 'flat_tpo' | '';
  obstacles: string[];
  selectedUnderlayment: TradeProduct | null;
  selectedCovering: TradeProduct | null;
  selectedFasteners: TradeProduct | null;
  // Section 1524 fields
  yearBuilt: number | null;
  buildingType: 'single_family' | 'multi_family' | 'commercial';
  hasExposedCeilings: boolean;
  hasPondingWater: boolean;
  requiresOverflowScuppers: boolean;
  deckAttachmentConfirmed: boolean;
}

interface Section1524Requirement {
  id: string;
  label: string;
  description: string;
  fbcSection: string;
  required: boolean;
  checked: boolean;
}

interface RoofingQuestionsProps {
  isHVHZ: boolean;
  formData: RoofingFormData;
  suggestedYearBuilt?: number | null;
  suggestedOwnerName?: string | null;
  propertyLoading?: boolean;
  onChange: (data: RoofingFormData) => void;
  onComplete: (isComplete: boolean) => void;
}

const WORK_TYPES = [
  { id: 'reroof', label: 'Re-roof', description: 'Replace existing roof covering' },
  { id: 'repair', label: 'Repair', description: 'Fix specific damage areas' },
  { id: 'coating', label: 'Coating', description: 'Apply protective coating' },
  { id: 'new_construction', label: 'New Construction', description: 'New building roof' },
];

const PITCH_OPTIONS = [
  { id: 'flat', label: 'Flat (0-2/12)', icon: '▬' },
  { id: 'low', label: 'Low (2-4/12)', icon: '⟋' },
  { id: 'standard', label: 'Standard (5-8/12)', icon: '⌃' },
  { id: 'steep', label: 'Steep (9+/12)', icon: '△' },
];

const EXISTING_MATERIALS = [
  { id: 'shingle', label: 'Asphalt Shingle' },
  { id: 'tile', label: 'Concrete/Clay Tile' },
  { id: 'metal', label: 'Metal' },
  { id: 'flat_tpo', label: 'Flat/TPO/Modified' },
  { id: 'other', label: 'Other' },
];

const OBSTACLES = [
  { id: 'skylights', label: 'Skylights' },
  { id: 'solar', label: 'Solar Panels' },
  { id: 'satellite', label: 'Satellite Dishes' },
  { id: 'hvac', label: 'Rooftop HVAC' },
  { id: 'vents', label: 'Multiple Vents' },
  { id: 'valleys', label: 'Complex Valleys' },
];

const BUILDING_TYPES = [
  { id: 'single_family', label: 'Single Family Home' },
  { id: 'multi_family', label: 'Multi-Family/Condo' },
  { id: 'commercial', label: 'Commercial' },
];

export function RoofingQuestions({
  isHVHZ,
  formData,
  suggestedYearBuilt,
  suggestedOwnerName,
  propertyLoading,
  onChange,
  onComplete,
}: RoofingQuestionsProps) {
  const { products, categorizedProducts, loading, isExpired, isExpiringSoon } = useTradeProducts('roofing', isHVHZ);
  const [yearBuiltSource, setYearBuiltSource] = useState<'auto' | 'manual'>('manual');

  // Auto-populate yearBuilt when property data arrives
  useEffect(() => {
    if (suggestedYearBuilt && !formData.yearBuilt) {
      onChange({ ...formData, yearBuilt: suggestedYearBuilt });
      setYearBuiltSource('auto');
    }
  }, [suggestedYearBuilt]);

  // Section 1524 compliance requirements based on year_built and conditions
  const section1524Requirements = useMemo((): Section1524Requirement[] => {
    const requirements: Section1524Requirement[] = [];
    const currentYear = new Date().getFullYear();
    
    // Pre-1994 deck renailing (FBC 1524.3)
    if (formData.yearBuilt && formData.yearBuilt < 1994) {
      requirements.push({
        id: 'deck_renailing',
        label: 'Deck Renailing Required',
        description: 'Pre-1994 wood roof deck must be renailed with 8d ring-shank nails @ 6" o.c. field / 4" o.c. edges',
        fbcSection: 'FBC 1524.3',
        required: true,
        checked: formData.deckAttachmentConfirmed,
      });
    }
    
    // HVHZ deck attachment (FBC 1524.3.1)
    if (isHVHZ) {
      requirements.push({
        id: 'hvhz_deck_attachment',
        label: 'HVHZ Deck Attachment',
        description: 'Enhanced deck fastening per HVHZ requirements - 8d ring-shank @ 6" field / 4" edges minimum',
        fbcSection: 'FBC 1524.3.1',
        required: true,
        checked: formData.deckAttachmentConfirmed,
      });
    }
    
    // Exposed ceilings (FBC 1524.4)
    if (formData.hasExposedCeilings) {
      requirements.push({
        id: 'exposed_ceiling_inspection',
        label: 'Exposed Ceiling Inspection',
        description: 'Roof deck must be inspected from above and below when no attic space exists',
        fbcSection: 'FBC 1524.4',
        required: true,
        checked: true, // Auto-checked since they acknowledged exposed ceilings
      });
    }
    
    // Flat roof drainage (FBC 1524.5)
    if (formData.pitch === 'flat') {
      if (formData.hasPondingWater) {
        requirements.push({
          id: 'ponding_remediation',
          label: 'Ponding Water Remediation',
          description: 'Positive drainage must be established to prevent water accumulation',
          fbcSection: 'FBC 1524.5.1',
          required: true,
          checked: formData.requiresOverflowScuppers,
        });
      }
      
      requirements.push({
        id: 'overflow_drainage',
        label: 'Secondary Drainage/Overflow Scuppers',
        description: 'Required for flat roofs - overflow scuppers or secondary drains per IPC',
        fbcSection: 'FBC 1524.5.2',
        required: formData.requiresOverflowScuppers,
        checked: formData.requiresOverflowScuppers,
      });
    }
    
    // Multiple layers check (FBC 1524.2)
    if (formData.workType === 'reroof') {
      requirements.push({
        id: 'layer_limit',
        label: 'Roof Layer Limitation',
        description: 'Maximum 2 roof coverings allowed - complete tear-off required if existing roof has 2+ layers',
        fbcSection: 'FBC 1524.2',
        required: true,
        checked: true, // Will be verified during inspection
      });
    }
    
    return requirements;
  }, [formData.yearBuilt, formData.deckAttachmentConfirmed, formData.hasExposedCeilings, 
      formData.pitch, formData.hasPondingWater, formData.requiresOverflowScuppers, 
      formData.workType, isHVHZ]);

  const updateField = <K extends keyof RoofingFormData>(field: K, value: RoofingFormData[K]) => {
    const newData = { ...formData, [field]: value };
    onChange(newData);
    checkCompletion(newData);
  };

  const checkCompletion = (data: RoofingFormData) => {
    const isComplete = 
      data.workType !== '' &&
      data.roofSize > 0 &&
      data.pitch !== '' &&
      data.stories !== '';
    onComplete(isComplete);
  };

  const toggleObstacle = (obstacleId: string) => {
    const obstacles = formData.obstacles.includes(obstacleId)
      ? formData.obstacles.filter(o => o !== obstacleId)
      : [...formData.obstacles, obstacleId];
    updateField('obstacles', obstacles);
  };

  const getProductStatus = (product: TradeProduct) => {
    if (isExpired(product)) {
      return { status: 'expired', color: 'text-destructive', icon: AlertTriangle };
    }
    if (isExpiringSoon(product)) {
      return { status: 'expiring', color: 'text-amber-600', icon: AlertTriangle };
    }
    if (product.hvhz_approved) {
      return { status: 'hvhz', color: 'text-green-600', icon: Shield };
    }
    return { status: 'valid', color: 'text-green-600', icon: CheckCircle2 };
  };

  const renderProductSelector = (
    category: string,
    selectedProduct: TradeProduct | null,
    onSelect: (product: TradeProduct | null) => void,
    required: boolean = true
  ) => {
    const categoryProducts = products.filter(p => p.product_category === category);
    
    if (categoryProducts.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic p-4 border rounded-lg">
          No {category.toLowerCase()} products available{isHVHZ ? ' for HVHZ' : ''}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {selectedProduct ? (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{selectedProduct.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.manufacturer} • {selectedProduct.noa_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProduct.hvhz_approved && (
                    <Badge variant="secondary" className="text-xs">HVHZ ✓</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {categoryProducts.map((product) => {
              const statusInfo = getProductStatus(product);
              const StatusIcon = statusInfo.icon;
              
              return (
                <button
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className={cn(
                    "w-full p-3 text-left border rounded-lg transition-all hover:border-primary/50",
                    statusInfo.status === 'expired' && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={statusInfo.status === 'expired'}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.manufacturer} • {product.noa_number || product.fl_product_approval}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                      {product.hvhz_approved && (
                        <Badge variant="outline" className="text-xs">HVHZ</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Project Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Home className="h-5 w-5" />
            Project Details
          </CardTitle>
          <CardDescription>Tell us about the roofing work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What type of roof work?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WORK_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateField('workType', type.id as RoofingFormData['workType'])}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all",
                    formData.workType === type.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Roof Size */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Roof Size
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.roofSize || ''}
                  onChange={(e) => updateField('roofSize', parseFloat(e.target.value) || 0)}
                  placeholder="Enter size"
                  className="flex-1"
                />
                <Select
                  value={formData.roofSizeUnit}
                  onValueChange={(val) => updateField('roofSizeUnit', val as 'sqft' | 'squares')}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqft">Sq Ft</SelectItem>
                    <SelectItem value="squares">Squares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.roofSize > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formData.roofSizeUnit === 'sqft' 
                    ? `${(formData.roofSize / 100).toFixed(1)} squares` 
                    : `${(formData.roofSize * 100).toLocaleString()} sq ft`}
                </p>
              )}
            </div>

            {/* Stories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Stories</Label>
              <div className="flex gap-2">
                {['1', '2', '3+'].map((story) => (
                  <button
                    key={story}
                    onClick={() => updateField('stories', story as RoofingFormData['stories'])}
                    className={cn(
                      "flex-1 p-3 border rounded-lg font-medium transition-all",
                      formData.stories === story
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                  >
                    {story}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Roof Pitch</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PITCH_OPTIONS.map((pitch) => (
                <button
                  key={pitch.id}
                  onClick={() => updateField('pitch', pitch.id as RoofingFormData['pitch'])}
                  className={cn(
                    "p-3 border rounded-lg text-center transition-all",
                    formData.pitch === pitch.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl block mb-1">{pitch.icon}</span>
                  <span className="text-xs font-medium">{pitch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Existing Material */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Existing Roof Material</Label>
            <div className="flex flex-wrap gap-2">
              {EXISTING_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => updateField('existingMaterial', mat.id as RoofingFormData['existingMaterial'])}
                  className={cn(
                    "px-4 py-2 border rounded-full text-sm transition-all",
                    formData.existingMaterial === mat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50"
                  )}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Obstacles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Obstacles (select all that apply)</Label>
            <div className="flex flex-wrap gap-3">
              {OBSTACLES.map((obstacle) => (
                <label
                  key={obstacle.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-all",
                    formData.obstacles.includes(obstacle.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={formData.obstacles.includes(obstacle.id)}
                    onCheckedChange={() => toggleObstacle(obstacle.id)}
                  />
                  <span className="text-sm">{obstacle.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 1524 - Building Information (for HVHZ and deck attachment compliance) */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-600" />
                <Label className="text-sm font-medium text-amber-700">FBC Section 1524 Compliance</Label>
              </div>
              {isHVHZ && (
                <Badge variant="destructive" className="text-xs">Required for HVHZ</Badge>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Year Built with auto-detect */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Year Built
                  {propertyLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.yearBuilt || ''}
                    onChange={(e) => {
                      updateField('yearBuilt', parseInt(e.target.value) || null);
                      setYearBuiltSource('manual');
                    }}
                    placeholder="e.g. 1985"
                    min={1900}
                    max={new Date().getFullYear()}
                    className={cn(
                      yearBuiltSource === 'auto' && 'pr-24'
                    )}
                  />
                  {yearBuiltSource === 'auto' && formData.yearBuilt && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Auto-detected</span>
                    </div>
                  )}
                </div>
                {formData.yearBuilt && formData.yearBuilt < 1994 && (
                  <Alert className="py-2 border-amber-300 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <strong>Pre-1994 home:</strong> Deck renailing is required per FBC 1524.3
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Building Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Building Type</Label>
                <div className="flex flex-wrap gap-2">
                  {BUILDING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => updateField('buildingType', type.id as RoofingFormData['buildingType'])}
                      className={cn(
                        "px-3 py-2 border rounded-lg text-sm transition-all",
                        formData.buildingType === type.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Section 1524 Compliance Checklist */}
            {section1524Requirements.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
                    <Shield className="h-4 w-4" />
                    Compliance Requirements ({section1524Requirements.filter(r => r.checked).length}/{section1524Requirements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-2">
                    {section1524Requirements.map((req) => (
                      <div 
                        key={req.id}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-lg transition-colors",
                          req.checked 
                            ? "bg-green-50 border border-green-200" 
                            : "bg-amber-100 border border-amber-300"
                        )}
                      >
                        {req.checked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-sm font-medium",
                              req.checked ? "text-green-800" : "text-amber-800"
                            )}>
                              {req.label}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {req.fbcSection}
                            </Badge>
                            {req.required && !req.checked && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs mt-0.5",
                            req.checked ? "text-green-700" : "text-amber-700"
                          )}>
                            {req.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HVHZ-specific checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50">
                <Checkbox
                  checked={formData.hasExposedCeilings}
                  onCheckedChange={(checked) => updateField('hasExposedCeilings', !!checked)}
                />
                <div>
                  <span className="text-sm font-medium">Exposed/Cathedral Ceilings</span>
                  <p className="text-xs text-muted-foreground">No attic access - roof deck visible from interior</p>
                </div>
              </label>

              {formData.pitch === 'flat' && (
                <>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50">
                    <Checkbox
                      checked={formData.hasPondingWater}
                      onCheckedChange={(checked) => updateField('hasPondingWater', !!checked)}
                    />
                    <div>
                      <span className="text-sm font-medium">Ponding Water Issues</span>
                      <p className="text-xs text-muted-foreground">Standing water on roof after rain</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50">
                    <Checkbox
                      checked={formData.requiresOverflowScuppers}
                      onCheckedChange={(checked) => updateField('requiresOverflowScuppers', !!checked)}
                    />
                    <div>
                      <span className="text-sm font-medium">Overflow Scuppers Required</span>
                      <p className="text-xs text-muted-foreground">Secondary drainage needed for flat roof</p>
                    </div>
                  </label>
                </>
              )}

              {isHVHZ && (
                <label className="flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer">
                  <Checkbox
                    checked={formData.deckAttachmentConfirmed}
                    onCheckedChange={(checked) => updateField('deckAttachmentConfirmed', !!checked)}
                  />
                  <div>
                    <span className="text-sm font-medium text-amber-800">Deck Attachment Compliance</span>
                    <p className="text-xs text-amber-700">
                      Confirm: 8d ring-shank nails @ 6" o.c. field / 4" o.c. edges per FBC HVHZ requirements
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
