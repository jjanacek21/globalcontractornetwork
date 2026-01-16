import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Layers, Ruler, AlertTriangle, CheckCircle2, Shield, FileText, X } from 'lucide-react';
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
}

interface RoofingQuestionsProps {
  isHVHZ: boolean;
  formData: RoofingFormData;
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

export function RoofingQuestions({
  isHVHZ,
  formData,
  onChange,
  onComplete,
}: RoofingQuestionsProps) {
  const { products, categorizedProducts, loading, isExpired, isExpiringSoon } = useTradeProducts('roofing', isHVHZ);

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
      data.stories !== '' &&
      (data.selectedUnderlayment !== null || data.workType === 'coating') &&
      (data.selectedCovering !== null || data.workType === 'coating');
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
        </CardContent>
      </Card>

      {/* Product Selection Section */}
      {formData.workType && formData.workType !== 'coating' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Product Selection
            </CardTitle>
            <CardDescription>
              Select approved products for your project
              {isHVHZ && <Badge variant="destructive" className="ml-2">HVHZ Products Only</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                {/* Underlayment */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Underlayment <span className="text-destructive">*</span>
                  </Label>
                  {renderProductSelector(
                    'Underlayment',
                    formData.selectedUnderlayment,
                    (p) => updateField('selectedUnderlayment', p),
                    true
                  )}
                </div>

                {/* Roof Covering based on selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Roof Covering <span className="text-destructive">*</span>
                  </Label>
                  {formData.existingMaterial === 'tile' || formData.newMaterial === 'tile' ? (
                    renderProductSelector(
                      'Roof Tile',
                      formData.selectedCovering,
                      (p) => updateField('selectedCovering', p),
                      true
                    )
                  ) : formData.existingMaterial === 'metal' || formData.newMaterial === 'metal' ? (
                    renderProductSelector(
                      'Metal Roofing',
                      formData.selectedCovering,
                      (p) => updateField('selectedCovering', p),
                      true
                    )
                  ) : (
                    renderProductSelector(
                      'Shingles',
                      formData.selectedCovering,
                      (p) => updateField('selectedCovering', p),
                      true
                    )
                  )}
                </div>

                {/* Fasteners (optional) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Fasteners <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  {renderProductSelector(
                    'Fasteners',
                    formData.selectedFasteners,
                    (p) => updateField('selectedFasteners', p),
                    false
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Products Summary */}
      {(formData.selectedUnderlayment || formData.selectedCovering) && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>NOAs will be auto-sourced:</strong>
            <ul className="mt-1 space-y-1 text-sm">
              {formData.selectedUnderlayment && (
                <li>• {formData.selectedUnderlayment.noa_number} - {formData.selectedUnderlayment.product_name}</li>
              )}
              {formData.selectedCovering && (
                <li>• {formData.selectedCovering.noa_number} - {formData.selectedCovering.product_name}</li>
              )}
              {formData.selectedFasteners && (
                <li>• {formData.selectedFasteners.noa_number || formData.selectedFasteners.fl_product_approval} - {formData.selectedFasteners.product_name}</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
