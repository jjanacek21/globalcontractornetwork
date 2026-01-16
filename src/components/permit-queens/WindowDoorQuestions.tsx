import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DoorOpen, CheckCircle2, AlertTriangle, X, Plus, Minus, Shield } from 'lucide-react';
import { useTradeProducts, TradeProduct } from '@/hooks/useTradeProducts';
import { cn } from '@/lib/utils';

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

  const getProductStatus = (product: TradeProduct) => {
    if (isExpired(product)) {
      return { status: 'expired', color: 'text-destructive', icon: AlertTriangle };
    }
    if (isExpiringSoon(product)) {
      return { status: 'expiring', color: 'text-amber-600', icon: AlertTriangle };
    }
    return { status: 'valid', color: 'text-green-600', icon: CheckCircle2 };
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

  const renderCountInput = (
    label: string,
    value: number,
    onChange: (val: number) => void,
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
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center font-medium text-lg">{value}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

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
                <div className="flex items-center gap-2">
                  {selectedProduct.hvhz_approved && (
                    <Badge variant="secondary" className="text-xs">HVHZ ✓</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DoorOpen className="h-5 w-5" />
            Windows & Doors Project
          </CardTitle>
          <CardDescription>
            Enter the quantities for each type
            {isHVHZ && (
              <Badge variant="destructive" className="ml-2">Impact-Rated Required</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* HVHZ Notice */}
          {isHVHZ && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This property is in an HVHZ zone. All windows and doors must be 
                <strong> impact-rated</strong> with valid NOAs.
              </AlertDescription>
            </Alert>
          )}

          {/* Quantity Inputs */}
          <div className="space-y-3">
            {renderCountInput(
              'Windows',
              formData.windowCount,
              (val) => updateField('windowCount', val),
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
                <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2" />
              </svg>
            )}
            
            {renderCountInput(
              'Entry Doors',
              formData.doorCount,
              (val) => updateField('doorCount', val),
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
            )}
            
            {renderCountInput(
              'Sliding Glass Doors',
              formData.slidingDoorCount,
              (val) => updateField('slidingDoorCount', val),
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="2" y="4" width="20" height="16" rx="1" strokeWidth="2" />
                <line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" />
                <circle cx="10" cy="12" r="1" fill="currentColor" />
                <circle cx="14" cy="12" r="1" fill="currentColor" />
              </svg>
            )}
          </div>

          {/* Frame Material */}
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

      {/* Product Selection */}
      {(formData.windowCount > 0 || formData.doorCount > 0 || formData.slidingDoorCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Selection</CardTitle>
            <CardDescription>
              Select approved products for each type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                {/* Windows */}
                {formData.windowCount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Windows ({formData.windowCount})
                      <span className="text-destructive"> *</span>
                    </Label>
                    {renderProductSelector(
                      windows,
                      formData.selectedWindowProduct,
                      (p) => updateField('selectedWindowProduct', p),
                      'Impact Windows'
                    )}
                  </div>
                )}

                {/* Entry Doors */}
                {formData.doorCount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Entry Doors ({formData.doorCount})
                      <span className="text-destructive"> *</span>
                    </Label>
                    {renderProductSelector(
                      doors,
                      formData.selectedDoorProduct,
                      (p) => updateField('selectedDoorProduct', p),
                      'Impact Doors'
                    )}
                  </div>
                )}

                {/* Sliding Doors */}
                {formData.slidingDoorCount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Sliding Glass Doors ({formData.slidingDoorCount})
                      <span className="text-destructive"> *</span>
                    </Label>
                    {renderProductSelector(
                      slidingDoors,
                      formData.selectedSlidingDoorProduct,
                      (p) => updateField('selectedSlidingDoorProduct', p),
                      'Sliding Glass Doors'
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Products Summary */}
      {(formData.selectedWindowProduct || formData.selectedDoorProduct || formData.selectedSlidingDoorProduct) && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Product approvals will be auto-sourced:</strong>
            <ul className="mt-1 space-y-1 text-sm">
              {formData.selectedWindowProduct && (
                <li>• {formData.selectedWindowProduct.noa_number} - {formData.selectedWindowProduct.product_name} (×{formData.windowCount})</li>
              )}
              {formData.selectedDoorProduct && (
                <li>• {formData.selectedDoorProduct.noa_number} - {formData.selectedDoorProduct.product_name} (×{formData.doorCount})</li>
              )}
              {formData.selectedSlidingDoorProduct && (
                <li>• {formData.selectedSlidingDoorProduct.noa_number} - {formData.selectedSlidingDoorProduct.product_name} (×{formData.slidingDoorCount})</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
