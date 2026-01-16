import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Thermometer, CheckCircle2, AlertTriangle, Shield, X } from 'lucide-react';
import { useTradeProducts, TradeProduct } from '@/hooks/useTradeProducts';
import { cn } from '@/lib/utils';

export interface HVACFormData {
  workType: 'replace' | 'new_install' | 'ductwork' | 'repair' | '';
  equipmentType: 'split' | 'package' | 'heat_pump' | 'mini_split' | '';
  tonnage: string;
  location: 'ground' | 'rooftop' | 'closet' | '';
  ductworkIncluded: 'new' | 'modify' | 'none' | '';
  selectedUnit: TradeProduct | null;
  selectedAirHandler: TradeProduct | null;
  electricalUpgrade: boolean;
  seerRating: string;
}

interface HVACQuestionsProps {
  isHVHZ: boolean;
  formData: HVACFormData;
  onChange: (data: HVACFormData) => void;
  onComplete: (isComplete: boolean) => void;
}

const WORK_TYPES = [
  { id: 'replace', label: 'Replace Unit', description: 'Swap existing AC/heat pump' },
  { id: 'new_install', label: 'New Install', description: 'First time installation' },
  { id: 'ductwork', label: 'Ductwork Only', description: 'Modify or add ducts' },
  { id: 'repair', label: 'Major Repair', description: 'Component replacement' },
];

const EQUIPMENT_TYPES = [
  { id: 'split', label: 'Split System' },
  { id: 'package', label: 'Package Unit' },
  { id: 'heat_pump', label: 'Heat Pump' },
  { id: 'mini_split', label: 'Mini-Split' },
];

const TONNAGE_OPTIONS = ['1.5', '2', '2.5', '3', '3.5', '4', '5'];

const LOCATIONS = [
  { id: 'ground', label: 'Ground Level', description: 'Side of house' },
  { id: 'rooftop', label: 'Rooftop', description: 'On the roof' },
  { id: 'closet', label: 'Interior', description: 'Closet or garage' },
];

export function HVACQuestions({
  isHVHZ,
  formData,
  onChange,
  onComplete,
}: HVACQuestionsProps) {
  const { products, loading, isExpired, isExpiringSoon } = useTradeProducts('hvac', isHVHZ);

  const updateField = <K extends keyof HVACFormData>(field: K, value: HVACFormData[K]) => {
    const newData = { ...formData, [field]: value };
    onChange(newData);
    checkCompletion(newData);
  };

  const checkCompletion = (data: HVACFormData) => {
    const isComplete = 
      data.workType !== '' &&
      data.equipmentType !== '' &&
      data.tonnage !== '' &&
      data.location !== '' &&
      (data.selectedUnit !== null || data.workType === 'ductwork');
    onComplete(isComplete);
  };

  const getProductStatus = (product: TradeProduct) => {
    if (isExpired(product)) {
      return { status: 'expired', color: 'text-destructive', icon: AlertTriangle };
    }
    if (isExpiringSoon(product)) {
      return { status: 'expiring', color: 'text-amber-600', icon: AlertTriangle };
    }
    return { status: 'valid', color: 'text-green-600', icon: CheckCircle2 };
  };

  const acUnits = products.filter(p => 
    p.product_category === 'AC Unit' || 
    p.product_category === 'Heat Pump'
  );
  const airHandlers = products.filter(p => p.product_category === 'Air Handler');

  const renderProductSelector = (
    productList: TradeProduct[],
    selectedProduct: TradeProduct | null,
    onSelect: (product: TradeProduct | null) => void,
    label: string
  ) => {
    if (productList.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic p-4 border rounded-lg">
          No {label.toLowerCase()} products available{isHVHZ ? ' for HVHZ' : ''}
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
                <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {productList.map((product) => {
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
                        {product.manufacturer} • {product.noa_number}
                      </p>
                    </div>
                    <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5" />
            HVAC Project Details
          </CardTitle>
          <CardDescription>Tell us about the HVAC work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What type of HVAC work?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WORK_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateField('workType', type.id as HVACFormData['workType'])}
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

          {/* Equipment Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Equipment Type</Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateField('equipmentType', type.id as HVACFormData['equipmentType'])}
                  className={cn(
                    "px-4 py-2 border rounded-full text-sm transition-all",
                    formData.equipmentType === type.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tonnage & SEER */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tonnage</Label>
              <div className="flex flex-wrap gap-2">
                {TONNAGE_OPTIONS.map((ton) => (
                  <button
                    key={ton}
                    onClick={() => updateField('tonnage', ton)}
                    className={cn(
                      "px-4 py-2 border rounded-lg text-sm font-medium transition-all min-w-[3rem]",
                      formData.tonnage === ton
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/50"
                    )}
                  >
                    {ton}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum SEER Rating</Label>
              <Input
                value={formData.seerRating}
                onChange={(e) => updateField('seerRating', e.target.value)}
                placeholder="e.g., 16"
                className="max-w-32"
              />
              <p className="text-xs text-muted-foreground">
                Florida requires minimum 15 SEER for new installations
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Equipment Location</Label>
            <div className="grid grid-cols-3 gap-3">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => updateField('location', loc.id as HVACFormData['location'])}
                  className={cn(
                    "p-3 border rounded-lg text-center transition-all",
                    formData.location === loc.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-sm">{loc.label}</p>
                  <p className="text-xs text-muted-foreground">{loc.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ductwork */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ductwork Included?</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'new', label: 'Yes - New Ducts' },
                { id: 'modify', label: 'Yes - Modify Existing' },
                { id: 'none', label: 'No' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateField('ductworkIncluded', option.id as HVACFormData['ductworkIncluded'])}
                  className={cn(
                    "px-4 py-2 border rounded-full text-sm transition-all",
                    formData.ductworkIncluded === option.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Electrical Upgrade */}
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
            <Checkbox
              checked={formData.electricalUpgrade}
              onCheckedChange={(checked) => updateField('electricalUpgrade', !!checked)}
            />
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Electrical Upgrade Required
              </p>
              <p className="text-xs text-muted-foreground">
                Panel upgrade, new circuit, or disconnect
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Equipment Selection */}
      {formData.workType && formData.workType !== 'ductwork' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipment Selection</CardTitle>
            <CardDescription>
              Select approved HVAC equipment
              {isHVHZ && <Badge variant="destructive" className="ml-2">HVHZ Only</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {formData.equipmentType === 'heat_pump' ? 'Heat Pump' : 'AC Unit'} 
                    <span className="text-destructive"> *</span>
                  </Label>
                  {renderProductSelector(
                    acUnits,
                    formData.selectedUnit,
                    (p) => updateField('selectedUnit', p),
                    formData.equipmentType === 'heat_pump' ? 'Heat Pump' : 'AC Unit'
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Air Handler <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  {renderProductSelector(
                    airHandlers,
                    formData.selectedAirHandler,
                    (p) => updateField('selectedAirHandler', p),
                    'Air Handler'
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Products Summary */}
      {formData.selectedUnit && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Product approvals will be auto-sourced:</strong>
            <ul className="mt-1 space-y-1 text-sm">
              <li>• {formData.selectedUnit.noa_number} - {formData.selectedUnit.product_name}</li>
              {formData.selectedAirHandler && (
                <li>• {formData.selectedAirHandler.noa_number} - {formData.selectedAirHandler.product_name}</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
