import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DoorOpen, CheckCircle2, Plus, Minus, Shield } from 'lucide-react';
import { useTradeProducts, TradeProduct } from '@/hooks/useTradeProducts';
import { cn } from '@/lib/utils';
import { SearchableProductCombobox } from './SearchableProductCombobox';
import { ApprovalInfoCard } from './ApprovalInfoCard';
import { ProductApproval } from '@/hooks/useProductApprovals';

export interface WindowDoorFormData {
  windowCount: number;
  doorCount: number;
  slidingDoorCount: number;
  impactRequired: boolean;
  frameMaterial: 'vinyl' | 'aluminum' | 'wood' | 'fiberglass' | '';
  selectedWindowProduct: TradeProduct | null;
  selectedDoorProduct: TradeProduct | null;
  selectedSlidingDoorProduct: TradeProduct | null;
}

interface WindowDoorQuestionsProps {
  isHVHZ: boolean;
  formData: WindowDoorFormData;
  onChange: (data: WindowDoorFormData) => void;
  onComplete: (isComplete: boolean) => void;
}

const FRAME_MATERIALS = [
  { id: 'vinyl', label: 'Vinyl' },
  { id: 'aluminum', label: 'Aluminum' },
  { id: 'wood', label: 'Wood' },
  { id: 'fiberglass', label: 'Fiberglass' },
];

function tradeProductToApproval(product: TradeProduct): ProductApproval & { premium_tier?: number } {
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
    premium_tier: product.premium_tier,
  };
}

export function WindowDoorQuestions({
  isHVHZ,
  formData,
  onChange,
  onComplete,
}: WindowDoorQuestionsProps) {
  const { products, loading, isExpired, isExpiringSoon } = useTradeProducts('windows_doors', isHVHZ);

  const updateField = <K extends keyof WindowDoorFormData>(field: K, value: WindowDoorFormData[K]) => {
    const newData = { ...formData, [field]: value };
    onChange(newData);
    checkCompletion(newData);
  };

  const checkCompletion = (data: WindowDoorFormData) => {
    const hasItems = data.windowCount > 0 || data.doorCount > 0 || data.slidingDoorCount > 0;
    const hasWindowProduct = data.windowCount === 0 || data.selectedWindowProduct !== null;
    const hasDoorProduct = data.doorCount === 0 || data.selectedDoorProduct !== null;
    const hasSlidingProduct = data.slidingDoorCount === 0 || data.selectedSlidingDoorProduct !== null;
    
    onComplete(hasItems && hasWindowProduct && hasDoorProduct && hasSlidingProduct);
  };

  const isProductExpired = (product: ProductApproval) => {
    const tradeProduct = products.find(p => p.id === product.id);
    return tradeProduct ? isExpired(tradeProduct) : false;
  };

  const isProductExpiringSoon = (product: ProductApproval) => {
    const tradeProduct = products.find(p => p.id === product.id);
    return tradeProduct ? isExpiringSoon(tradeProduct) : false;
  };

  const windows = products.filter(p => p.product_category === 'Impact Window');
  const doors = products.filter(p => 
    p.product_category === 'Impact Door' && 
    !p.product_name.toLowerCase().includes('sliding')
  );
  const slidingDoors = products.filter(p => 
    p.product_category === 'Impact Door' && 
    p.product_name.toLowerCase().includes('sliding')
  );

  const windowsAsApprovals = windows.map(tradeProductToApproval);
  const doorsAsApprovals = doors.map(tradeProductToApproval);
  const slidingDoorsAsApprovals = slidingDoors.map(tradeProductToApproval);

  const renderCountInput = (
    label: string,
    value: number,
    onChangeValue: (val: number) => void,
    icon: React.ReactNode
  ) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChangeValue(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center font-medium text-lg">{value}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChangeValue(value + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DoorOpen className="h-5 w-5" />
            Windows & Doors Project
          </CardTitle>
          <CardDescription>
            Enter the quantities for each type
            {isHVHZ && <Badge variant="destructive" className="ml-2">Impact-Rated Required</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isHVHZ && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This property is in an HVHZ zone. All windows and doors must be <strong>impact-rated</strong> with valid NOAs.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {renderCountInput('Windows', formData.windowCount, (val) => updateField('windowCount', val),
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
                <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2" />
              </svg>
            )}
            {renderCountInput('Entry Doors', formData.doorCount, (val) => updateField('doorCount', val),
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
            )}
            {renderCountInput('Sliding Glass Doors', formData.slidingDoorCount, (val) => updateField('slidingDoorCount', val),
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="2" y="4" width="20" height="16" rx="1" strokeWidth="2" />
                <line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" />
              </svg>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <Label className="text-sm font-medium">Frame Material</Label>
            <div className="flex flex-wrap gap-2">
              {FRAME_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => updateField('frameMaterial', mat.id as WindowDoorFormData['frameMaterial'])}
                  className={cn(
                    "px-4 py-2 border rounded-full text-sm transition-all",
                    formData.frameMaterial === mat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50"
                  )}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {(formData.windowCount > 0 || formData.doorCount > 0 || formData.slidingDoorCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Selection</CardTitle>
            <CardDescription>Search and select approved products for each type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : (
              <>
                {formData.windowCount > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Windows ({formData.windowCount})<span className="text-destructive"> *</span></Label>
                    {formData.selectedWindowProduct ? (
                      <ApprovalInfoCard product={tradeProductToApproval(formData.selectedWindowProduct)} isHVHZ={isHVHZ} onRemove={() => updateField('selectedWindowProduct', null)} isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    ) : (
                      <SearchableProductCombobox products={windowsAsApprovals} selectedProduct={null} onSelect={(p) => { if (p) { const tp = windows.find(w => w.id === p.id); if (tp) updateField('selectedWindowProduct', tp); }}} placeholder="Search impact windows..." label="Windows" isHVHZ={isHVHZ} required isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    )}
                  </div>
                )}

                {formData.doorCount > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Entry Doors ({formData.doorCount})<span className="text-destructive"> *</span></Label>
                    {formData.selectedDoorProduct ? (
                      <ApprovalInfoCard product={tradeProductToApproval(formData.selectedDoorProduct)} isHVHZ={isHVHZ} onRemove={() => updateField('selectedDoorProduct', null)} isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    ) : (
                      <SearchableProductCombobox products={doorsAsApprovals} selectedProduct={null} onSelect={(p) => { if (p) { const tp = doors.find(d => d.id === p.id); if (tp) updateField('selectedDoorProduct', tp); }}} placeholder="Search impact doors..." label="Entry Doors" isHVHZ={isHVHZ} required isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    )}
                  </div>
                )}

                {formData.slidingDoorCount > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Sliding Glass Doors ({formData.slidingDoorCount})<span className="text-destructive"> *</span></Label>
                    {formData.selectedSlidingDoorProduct ? (
                      <ApprovalInfoCard product={tradeProductToApproval(formData.selectedSlidingDoorProduct)} isHVHZ={isHVHZ} onRemove={() => updateField('selectedSlidingDoorProduct', null)} isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    ) : (
                      <SearchableProductCombobox products={slidingDoorsAsApprovals} selectedProduct={null} onSelect={(p) => { if (p) { const tp = slidingDoors.find(s => s.id === p.id); if (tp) updateField('selectedSlidingDoorProduct', tp); }}} placeholder="Search sliding doors..." label="Sliding Doors" isHVHZ={isHVHZ} required isExpired={isProductExpired} isExpiringSoon={isProductExpiringSoon} />
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(formData.selectedWindowProduct || formData.selectedDoorProduct || formData.selectedSlidingDoorProduct) && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Product approvals will be auto-sourced:</strong>
            <ul className="mt-1 space-y-1 text-sm">
              {formData.selectedWindowProduct && <li>• {formData.selectedWindowProduct.noa_number} - {formData.selectedWindowProduct.product_name} (×{formData.windowCount})</li>}
              {formData.selectedDoorProduct && <li>• {formData.selectedDoorProduct.noa_number} - {formData.selectedDoorProduct.product_name} (×{formData.doorCount})</li>}
              {formData.selectedSlidingDoorProduct && <li>• {formData.selectedSlidingDoorProduct.noa_number} - {formData.selectedSlidingDoorProduct.product_name} (×{formData.slidingDoorCount})</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
