import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Thermometer, CheckCircle2, Shield } from 'lucide-react';
import { useTradeProducts, TradeProduct } from '@/hooks/useTradeProducts';
import { cn } from '@/lib/utils';
import { SearchableProductCombobox } from './SearchableProductCombobox';
import { ApprovalInfoCard } from './ApprovalInfoCard';
import { ProductApproval } from '@/hooks/useProductApprovals';

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

// Convert TradeProduct to ProductApproval format for the combobox
function tradeProductToApproval(product: TradeProduct): ProductApproval {
  return {
    id: product.id,
    manufacturer: product.manufacturer,
    product_name: product.product_name,
    product_category: product.product_category,
    product_line: null,
    noa_number: product.noa_number,
    fl_product_approval: null,
    uil_number: null,
    expiration_date: product.expiration_date,
    hvhz_approved: product.hvhz_approved,
    wind_speed_rating: null,
    file_path: null,
    file_url: product.file_url,
    is_active: true,
  };
}

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

  // Wrap isExpired/isExpiringSoon to work with ProductApproval
  const isProductExpired = (product: ProductApproval) => {
    const tradeProduct = products.find(p => p.id === product.id);
    return tradeProduct ? isExpired(tradeProduct) : false;
  };

  const isProductExpiringSoon = (product: ProductApproval) => {
    const tradeProduct = products.find(p => p.id === product.id);
    return tradeProduct ? isExpiringSoon(tradeProduct) : false;
  };

  const acUnits = products.filter(p => 
    p.product_category === 'AC Unit' || 
    p.product_category === 'Heat Pump'
  );
  const airHandlers = products.filter(p => p.product_category === 'Air Handler');

  // Convert to ProductApproval format for combobox
  const acUnitsAsApprovals = acUnits.map(tradeProductToApproval);
  const airHandlersAsApprovals = airHandlers.map(tradeProductToApproval);

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
              Search and select approved HVAC equipment
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
                {/* AC Unit / Heat Pump */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {formData.equipmentType === 'heat_pump' ? 'Heat Pump' : 'AC Unit'} 
                    <span className="text-destructive"> *</span>
                  </Label>
                  
                  {formData.selectedUnit ? (
                    <ApprovalInfoCard
                      product={tradeProductToApproval(formData.selectedUnit)}
                      isHVHZ={isHVHZ}
                      onRemove={() => updateField('selectedUnit', null)}
                      isExpired={isProductExpired}
                      isExpiringSoon={isProductExpiringSoon}
                    />
                  ) : (
                    <SearchableProductCombobox
                      products={acUnitsAsApprovals}
                      selectedProduct={null}
                      onSelect={(product) => {
                        if (product) {
                          const tradeProduct = acUnits.find(p => p.id === product.id);
                          if (tradeProduct) updateField('selectedUnit', tradeProduct);
                        }
                      }}
                      placeholder={`Search ${formData.equipmentType === 'heat_pump' ? 'heat pumps' : 'AC units'}...`}
                      label={formData.equipmentType === 'heat_pump' ? 'Heat Pump' : 'AC Unit'}
                      isHVHZ={isHVHZ}
                      required
                      isExpired={isProductExpired}
                      isExpiringSoon={isProductExpiringSoon}
                    />
                  )}
                </div>

                {/* Air Handler */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Air Handler <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  
                  {formData.selectedAirHandler ? (
                    <ApprovalInfoCard
                      product={tradeProductToApproval(formData.selectedAirHandler)}
                      isHVHZ={isHVHZ}
                      onRemove={() => updateField('selectedAirHandler', null)}
                      isExpired={isProductExpired}
                      isExpiringSoon={isProductExpiringSoon}
                    />
                  ) : (
                    <SearchableProductCombobox
                      products={airHandlersAsApprovals}
                      selectedProduct={null}
                      onSelect={(product) => {
                        if (product) {
                          const tradeProduct = airHandlers.find(p => p.id === product.id);
                          if (tradeProduct) updateField('selectedAirHandler', tradeProduct);
                        }
                      }}
                      placeholder="Search air handlers..."
                      label="Air Handler"
                      isHVHZ={isHVHZ}
                      isExpired={isProductExpired}
                      isExpiringSoon={isProductExpiringSoon}
                    />
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
