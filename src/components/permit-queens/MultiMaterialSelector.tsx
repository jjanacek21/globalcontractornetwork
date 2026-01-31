import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Shield, Hammer, Layers, Home, CircleDot, Check, Loader2
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { useProductCategories, CategoryGroup } from '@/hooks/useProductCategories';
import { SearchableProductCombobox } from './SearchableProductCombobox';
import { ApprovalInfoCard } from './ApprovalInfoCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Extended category type for multi-material selection
export type MaterialCategory = string;

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

// Icon mapping for category groups
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Layers,
  Hammer,
  CircleDot,
  Shield,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Layers;
}

export function MultiMaterialSelector({ 
  isHVHZ, 
  roofType, 
  selectedProducts, 
  onProductsChange,
  onRoofTypeChange
}: MultiMaterialSelectorProps) {
  const { products, loading: productsLoading, isExpired, isExpiringSoon, refetch } = useProductApprovals();
  const { categoryGroups, loading: categoriesLoading, ungroupedCategories } = useProductCategories();
  const [showAddDropdown, setShowAddDropdown] = useState<Record<string, boolean>>({});
  const [sourcingProducts, setSourcingProducts] = useState<Set<string>>(new Set());

  const loading = productsLoading || categoriesLoading;

  // Helper to check if product has a PDF
  const hasPdf = (product: ProductApproval) => {
    return !!(product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url);
  };

  // Get products for a specific material category, sorted with PDFs first
  const getProductsForCategory = (categoryGroup: CategoryGroup) => {
    if (!categoryGroup.dbCategories.length) return [];
    
    return products
      .filter(p => {
        const productCat = p.product_category?.trim() || '';
        return categoryGroup.dbCategories.some(dbCat => 
          productCat.toLowerCase() === dbCat.toLowerCase()
        );
      })
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
  const getSelectedForCategory = (categoryId: string) => {
    return selectedProducts.filter(p => p.category === categoryId);
  };

  // Trigger background PDF sourcing for a product
  const triggerBackgroundSourcing = async (product: ProductApproval) => {
    if (hasPdf(product)) return;
    if (sourcingProducts.has(product.id)) return;
    
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
  const addProduct = (product: ProductApproval, categoryId: string, allowMultiple: boolean) => {
    const newProduct: MultiSelectedProduct = {
      id: product.id,
      product,
      category: categoryId,
    };

    if (allowMultiple) {
      const exists = selectedProducts.some(p => p.id === product.id && p.category === categoryId);
      if (!exists) {
        onProductsChange([...selectedProducts, newProduct]);
      }
    } else {
      const filtered = selectedProducts.filter(p => p.category !== categoryId);
      onProductsChange([...filtered, newProduct]);
    }
    
    if (!hasPdf(product)) {
      triggerBackgroundSourcing(product);
    }
    
    setShowAddDropdown(prev => ({ ...prev, [categoryId]: false }));
  };

  // Remove a specific product
  const removeProduct = (productId: string, categoryId: string) => {
    onProductsChange(selectedProducts.filter(p => !(p.id === productId && p.category === categoryId)));
  };

  // Filter categories based on roof type
  const visibleCategories = useMemo(() => {
    if (roofType === 'steep') {
      return categoryGroups.filter(c => c.id !== 'flat_roofing');
    }
    if (roofType === 'flat') {
      return categoryGroups.filter(c => c.id !== 'roof_covering');
    }
    return categoryGroups;
  }, [roofType, categoryGroups]);

  const renderCategorySection = (categoryGroup: CategoryGroup) => {
    const categoryProducts = getProductsForCategory(categoryGroup);
    const selected = getSelectedForCategory(categoryGroup.id);
    const Icon = getIcon(categoryGroup.icon);
    const showingAddDropdown = showAddDropdown[categoryGroup.id];
    
    const availableProducts = categoryProducts.filter(
      p => !selected.some(s => s.id === p.id)
    );

    // Skip if no products in this category
    if (categoryProducts.length === 0) return null;

    return (
      <div key={categoryGroup.id} className="space-y-3">
        {/* Category Header */}
        <div className="flex items-center gap-3">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", categoryGroup.color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{categoryGroup.label}</Label>
              {categoryGroup.required && <span className="text-destructive">*</span>}
              {categoryGroup.allowMultiple && (
                <Badge variant="secondary" className="text-[10px]">Multi-select</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {categoryProducts.length} products
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{categoryGroup.description}</p>
          </div>
          <Badge variant={selected.length > 0 ? 'default' : 'secondary'} className="shrink-0">
            {selected.length} selected
          </Badge>
        </div>

        {/* Main dropdown (show when no selection or single-select) */}
        {(selected.length === 0 || (!categoryGroup.allowMultiple && selected.length === 0)) && (
          <SearchableProductCombobox
            products={categoryProducts}
            selectedProduct={null}
            onSelect={(product) => product && addProduct(product, categoryGroup.id, categoryGroup.allowMultiple)}
            placeholder={`Search ${categoryGroup.label.toLowerCase()}...`}
            label={categoryGroup.label}
            isHVHZ={isHVHZ}
            required={categoryGroup.required}
            isExpired={isExpired}
            isExpiringSoon={isExpiringSoon}
          />
        )}

        {/* Selected products as ApprovalInfoCards */}
        {selected.length > 0 && (
          <div className="space-y-2">
            {selected.map(sel => (
              <ApprovalInfoCard
                key={`${sel.id}-${categoryGroup.id}`}
                product={sel.product}
                isHVHZ={isHVHZ}
                onRemove={() => removeProduct(sel.id, categoryGroup.id)}
                showRemoveButton={true}
                isExpired={isExpired}
                isExpiringSoon={isExpiringSoon}
              />
            ))}
          </div>
        )}

        {/* Add Another button for multi-select categories */}
        {categoryGroup.allowMultiple && selected.length > 0 && (
          <div className="space-y-2">
            {showingAddDropdown ? (
              <div className="space-y-2">
                <SearchableProductCombobox
                  products={availableProducts}
                  selectedProduct={null}
                  onSelect={(product) => product && addProduct(product, categoryGroup.id, categoryGroup.allowMultiple)}
                  placeholder={`Search ${categoryGroup.label.toLowerCase()}...`}
                  label={categoryGroup.label}
                  isHVHZ={isHVHZ}
                  isExpired={isExpired}
                  isExpiringSoon={isExpiringSoon}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDropdown(prev => ({ ...prev, [categoryGroup.id]: false }))}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDropdown(prev => ({ ...prev, [categoryGroup.id]: true }))}
                className="text-xs gap-1.5"
                disabled={availableProducts.length === 0}
              >
                <Plus className="h-3 w-3" />
                Add another {categoryGroup.label.toLowerCase()}
              </Button>
            )}
          </div>
        )}

        {/* Single-select: show dropdown to change selection */}
        {!categoryGroup.allowMultiple && selected.length > 0 && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeProduct(selected[0].id, categoryGroup.id)}
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
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
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
              {visibleCategories.map(categoryGroup => {
                const selected = getSelectedForCategory(categoryGroup.id);
                const Icon = getIcon(categoryGroup.icon);
                const productCount = getProductsForCategory(categoryGroup).length;
                
                if (productCount === 0) return null;
                
                return (
                  <div key={categoryGroup.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", categoryGroup.color)}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium text-sm">{categoryGroup.label}</span>
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
                        {categoryGroup.required ? 'Required - not selected' : 'Optional - not selected'}
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
            {ungroupedCategories.length > 0 && (
              <span className="block text-xs mt-1">
                + {ungroupedCategories.length} additional categories available
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {visibleCategories.map(categoryGroup => renderCategorySection(categoryGroup))}
        </CardContent>
      </Card>
    </div>
  );
}
