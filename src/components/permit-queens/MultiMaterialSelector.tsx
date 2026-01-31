import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Shield, Hammer, Layers, Home, CircleDot, Check, Loader2
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { SearchableProductCombobox } from './SearchableProductCombobox';
import { ApprovalInfoCard } from './ApprovalInfoCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended category type for multi-material selection
export type MaterialCategory = 
  | 'roof_covering'
  | 'flat_roofing'
  | 'underlayment'
  | 'deck_fasteners'
  | 'cap_tabs'
  | 'roofing_fasteners'
  | 'ventilation';

export interface MultiSelectedProduct {
  id: string;
  product: ProductApproval;
  category: MaterialCategory;
  area?: string;
  quantity?: number;
  notes?: string;
}

interface MultiMaterialSelectorProps {
  isHVHZ: boolean;
  roofType: 'steep' | 'flat' | 'mixed';
  selectedProducts: MultiSelectedProduct[];
  onProductsChange: (products: MultiSelectedProduct[]) => void;
  onRoofTypeChange?: (type: 'steep' | 'flat' | 'mixed') => void;
}

// Category configuration for display and filtering
// Updated to match actual database product_category values exactly
const CATEGORY_CONFIG: Record<string, { 
  label: string; 
  dbCategories: string[]; 
  icon: typeof Layers;
  color: string;
  required: boolean;
  allowMultiple: boolean;
  description: string;
}> = {
  roof_covering: {
    label: 'Roof Covering',
    dbCategories: [
      // Shingles (68 + 5 + 4 = 77)
      'Shingles', 'shingles', 'shingle',
      // Metal (877 + 14 + 7 = 898)
      'Metal Roofing', 'metal', 'Metal Tile Panels',
      // Tile (96 + 2 = 98)
      'Roof Tile', 'tiles',
      // Stone Coated (32)
      'Stone Coated Steel',
      // Slate (10)
      'Roofing Slate',
      // Legacy
      'roof_covering'
    ],
    icon: Home,
    color: 'bg-green-500',
    required: true,
    allowMultiple: true,
    description: 'Primary roofing material (shingles, tile, metal)'
  },
  flat_roofing: {
    label: 'Flat/Low-Slope Roofing',
    dbCategories: [
      // Flat Roofing specific (31 + 13 + 10 + 10 + 1 = 65)
      'Flat Roofing - Modified Bitumen', 'Flat Roofing - TPO', 'Flat Roofing - PVC', 'Flat Roofing - EPDM', 'flat_roof',
      // System types (160 + 121 + 35 + 34 + 26 = 376)
      'Single Ply Roof Systems', 'Modified Bitumen Roof Systems', 
      'Built Up Roofing', 'Spray Applied Polyurethene Roof Sys',
      'Liquid Applied Roof Systems',
      // Coatings (138 + 64 = 202)
      'Roof Coating', 'Waterproofing'
    ],
    icon: Layers,
    color: 'bg-purple-500',
    required: false,
    allowMultiple: true,
    description: 'For flat or low-slope roof sections (TPO, EPDM, modified bitumen, coatings)'
  },
  underlayment: {
    label: 'Underlayment',
    dbCategories: [
      // Underlayment (190 + 2 = 192)
      'Underlayment', 'underlayment',
      // Insulation (23 + 9 = 32)
      'Roofing Insulation', 'Insulation'
    ],
    icon: Layers,
    color: 'bg-blue-500',
    required: true,
    allowMultiple: true,
    description: 'Protective layer under roof covering (synthetic, peel & stick, felt)'
  },
  deck_fasteners: {
    label: 'Deck Fasteners',
    dbCategories: [
      // Deck Fasteners (8)
      'Deck Fasteners',
      // Deck (4 + 1 = 5)
      'Deck - Roof', 'Deck - Floor'
    ],
    icon: Hammer,
    color: 'bg-orange-500',
    required: true,
    allowMultiple: false,
    description: 'Nails or screws for attaching to deck'
  },
  cap_tabs: {
    label: 'Cap Tabs / Caps',
    dbCategories: [
      // Cap Tabs (11)
      'Cap Tabs'
    ],
    icon: CircleDot,
    color: 'bg-yellow-500',
    required: true,
    allowMultiple: false,
    description: 'Tin tabs, plastic or metal caps'
  },
  roofing_fasteners: {
    label: 'Roofing Fasteners',
    dbCategories: [
      // Roofing Fasteners (12)
      'Roofing Fasteners',
      // General Fasteners (38)
      'Fasteners'
    ],
    icon: Hammer,
    color: 'bg-red-500',
    required: true,
    allowMultiple: false,
    description: 'For attaching roof covering'
  },
  ventilation: {
    label: 'Ventilation',
    dbCategories: [
      // Ventilation (75 + 5 = 80)
      'Ventilation', 'Roof Ventilation'
    ],
    icon: Layers,
    color: 'bg-teal-500',
    required: false,
    allowMultiple: true,
    description: 'Ridge vents, turbines, and roof ventilation'
  }
};

export function MultiMaterialSelector({ 
  isHVHZ, 
  roofType, 
  selectedProducts, 
  onProductsChange,
  onRoofTypeChange
}: MultiMaterialSelectorProps) {
  const { products, loading, isExpired, isExpiringSoon, refetch } = useProductApprovals();
  const [showAddDropdown, setShowAddDropdown] = useState<Record<string, boolean>>({});
  const [sourcingProducts, setSourcingProducts] = useState<Set<string>>(new Set());

  // Helper to check if product has a PDF
  const hasPdf = (product: ProductApproval) => {
    return !!(product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url);
  };

  // Get products for a specific material category, sorted with PDFs first
  const getProductsForCategory = (category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    if (!config) return [];
    
    return products
      .filter(p => 
        config.dbCategories.some(dbCat => 
          p.product_category?.toLowerCase().includes(dbCat.toLowerCase()) ||
          dbCat.toLowerCase().includes(p.product_category?.toLowerCase() || '')
        )
      )
      .sort((a, b) => {
        // Sort products with PDFs first
        const aPdf = hasPdf(a);
        const bPdf = hasPdf(b);
        if (aPdf && !bPdf) return -1;
        if (!aPdf && bPdf) return 1;
        return a.product_name.localeCompare(b.product_name);
      });
  };

  // Get selected products for a category
  const getSelectedForCategory = (category: MaterialCategory) => {
    return selectedProducts.filter(p => p.category === category);
  };

  // Trigger background PDF sourcing for a product
  const triggerBackgroundSourcing = async (product: ProductApproval) => {
    if (hasPdf(product)) return; // Already has PDF
    if (sourcingProducts.has(product.id)) return; // Already sourcing
    
    setSourcingProducts(prev => new Set(prev).add(product.id));
    
    try {
      console.log(`Triggering background sourcing for ${product.product_name}`);
      const { data, error } = await supabase.functions.invoke('source-product-pdf', {
        body: { productId: product.id }
      });
      
      if (error) {
        console.warn('Background sourcing failed:', error);
      } else if (data?.success && data?.fileUrl) {
        toast.success(`PDF sourced for ${product.product_name}`);
        // Refresh product list to get updated URL
        refetch();
      }
    } catch (e) {
      console.warn('Background sourcing error:', e);
    } finally {
      setSourcingProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // Add a product selection
  const addProduct = (product: ProductApproval, category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    const newProduct: MultiSelectedProduct = {
      id: product.id,
      product,
      category,
    };

    if (config?.allowMultiple) {
      // Check if already selected
      const exists = selectedProducts.some(p => p.id === product.id && p.category === category);
      if (!exists) {
        onProductsChange([...selectedProducts, newProduct]);
      }
    } else {
      // Replace existing selection for this category
      const filtered = selectedProducts.filter(p => p.category !== category);
      onProductsChange([...filtered, newProduct]);
    }
    
    // If product doesn't have a PDF, trigger background sourcing
    if (!hasPdf(product)) {
      triggerBackgroundSourcing(product);
    }
    
    // Hide the add dropdown after selection
    setShowAddDropdown(prev => ({ ...prev, [category]: false }));
  };

  // Remove a specific product
  const removeProduct = (productId: string, category: MaterialCategory) => {
    onProductsChange(selectedProducts.filter(p => !(p.id === productId && p.category === category)));
  };

  // Determine which categories to show based on roof type
  const visibleCategories = useMemo(() => {
    const categories = Object.keys(CATEGORY_CONFIG) as MaterialCategory[];
    
    if (roofType === 'steep') {
      return categories.filter(c => c !== 'flat_roofing');
    }
    if (roofType === 'flat') {
      return categories.filter(c => c !== 'roof_covering');
    }
    return categories; // Mixed shows all
  }, [roofType]);

  const renderCategorySection = (category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    const categoryProducts = getProductsForCategory(category);
    const selected = getSelectedForCategory(category);
    const Icon = config.icon;
    const showingAddDropdown = showAddDropdown[category];
    
    // Filter out already selected products from the dropdown
    const availableProducts = categoryProducts.filter(
      p => !selected.some(s => s.id === p.id)
    );

    return (
      <div key={category} className="space-y-3">
        {/* Category Header */}
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{config.label}</Label>
              {config.required && <span className="text-destructive">*</span>}
              {config.allowMultiple && (
                <Badge variant="secondary" className="text-[10px]">Multi-select</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
          <Badge variant={selected.length > 0 ? 'default' : 'secondary'} className="shrink-0">
            {selected.length} selected
          </Badge>
        </div>

        {/* Main dropdown (show when no selection or single-select) */}
        {(selected.length === 0 || (!config.allowMultiple && selected.length === 0)) && (
          <SearchableProductCombobox
            products={categoryProducts}
            selectedProduct={null}
            onSelect={(product) => product && addProduct(product, category)}
            placeholder={`Search ${config.label.toLowerCase()}...`}
            label={config.label}
            isHVHZ={isHVHZ}
            required={config.required}
            isExpired={isExpired}
            isExpiringSoon={isExpiringSoon}
          />
        )}

        {/* Selected products as ApprovalInfoCards */}
        {selected.length > 0 && (
          <div className="space-y-2">
            {selected.map(sel => (
              <ApprovalInfoCard
                key={`${sel.id}-${category}`}
                product={sel.product}
                isHVHZ={isHVHZ}
                onRemove={() => removeProduct(sel.id, category)}
                showRemoveButton={true}
                isExpired={isExpired}
                isExpiringSoon={isExpiringSoon}
              />
            ))}
          </div>
        )}

        {/* Add Another button for multi-select categories */}
        {config.allowMultiple && selected.length > 0 && (
          <div className="space-y-2">
            {showingAddDropdown ? (
              <div className="space-y-2">
                <SearchableProductCombobox
                  products={availableProducts}
                  selectedProduct={null}
                  onSelect={(product) => product && addProduct(product, category)}
                  placeholder={`Search ${config.label.toLowerCase()}...`}
                  label={config.label}
                  isHVHZ={isHVHZ}
                  isExpired={isExpired}
                  isExpiringSoon={isExpiringSoon}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDropdown(prev => ({ ...prev, [category]: false }))}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDropdown(prev => ({ ...prev, [category]: true }))}
                className="text-xs gap-1.5"
                disabled={availableProducts.length === 0}
              >
                <Plus className="h-3 w-3" />
                Add another {config.label.toLowerCase()}
              </Button>
            )}
          </div>
        )}

        {/* Single-select: show dropdown to change selection */}
        {!config.allowMultiple && selected.length > 0 && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeProduct(selected[0].id, category)}
              className="text-xs text-muted-foreground"
            >
              Change selection
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading product approvals...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HVHZ Notice */}
      {isHVHZ && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Shield className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            This project is in a <strong>High Velocity Hurricane Zone (HVHZ)</strong>. 
            Only HVHZ-approved products with valid NOAs will be accepted.
          </AlertDescription>
        </Alert>
      )}

      {/* Roof Type Selector */}
      {onRoofTypeChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Roof Configuration
            </CardTitle>
            <CardDescription>Select your roof type to show relevant material categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['steep', 'flat', 'mixed'] as const).map(type => (
                <Button
                  key={type}
                  variant={roofType === type ? 'default' : 'outline'}
                  onClick={() => onRoofTypeChange(type)}
                  className="flex-1"
                >
                  {type === 'steep' && 'Steep Slope'}
                  {type === 'flat' && 'Flat / Low-Slope'}
                  {type === 'mixed' && 'Mixed (Both)'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Selected Materials Summary</CardTitle>
          <CardDescription>
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProducts.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No materials selected yet. Browse the categories below.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleCategories.map(category => {
                const config = CATEGORY_CONFIG[category];
                const selected = getSelectedForCategory(category);
                const Icon = config.icon;
                
                return (
                  <div key={category} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-6 w-6 rounded-full ${config.color} flex items-center justify-center`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium text-sm">{config.label}</span>
                    </div>
                    {selected.length > 0 ? (
                      <div className="space-y-1">
                        {selected.map(sel => (
                          <div key={sel.id} className="text-xs flex items-center justify-between gap-1">
                            <span className="truncate">{sel.product.product_name}</span>
                            {sourcingProducts.has(sel.id) ? (
                              <Loader2 className="h-3 w-3 text-blue-500 flex-shrink-0 animate-spin" />
                            ) : hasPdf(sel.product) ? (
                              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <span className="text-[10px] text-orange-500">No PDF</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {config.required ? 'Required - not selected' : 'Optional - not selected'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Selection - Dropdown Based */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Material Selection</CardTitle>
          <CardDescription>
            Search and select products with valid Florida product approvals for each category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {visibleCategories.map(category => renderCategorySection(category))}
        </CardContent>
      </Card>
    </div>
  );
}
