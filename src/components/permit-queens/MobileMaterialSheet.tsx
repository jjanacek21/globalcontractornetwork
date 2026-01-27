import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Plus, X, Shield, Home, Layers, Hammer, CircleDot } from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { MultiSelectedProduct, MaterialCategory } from './MultiMaterialSelector';
import { cn } from '@/lib/utils';

interface MobileMaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHVHZ: boolean;
  roofType: 'steep' | 'flat' | 'mixed';
  selectedProducts: MultiSelectedProduct[];
  onProductsChange: (products: MultiSelectedProduct[]) => void;
}

// Category configuration matching MultiMaterialSelector
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
    dbCategories: ['Shingles', 'shingles', 'Metal Roofing', 'Metal Panel', 'Roof Tile', 'tiles', 'Stone Coated Steel', 'Metal Tile Panels', 'roof_covering'],
    icon: Home,
    color: 'bg-green-500',
    required: true,
    allowMultiple: true,
    description: 'Primary roofing material'
  },
  flat_roofing: {
    label: 'Flat Roofing',
    dbCategories: ['Flat Roofing - TPO', 'Flat Roofing - EPDM', 'Flat Roofing - PVC', 'Flat Roofing - Modified Bitumen'],
    icon: Layers,
    color: 'bg-purple-500',
    required: false,
    allowMultiple: true,
    description: 'For flat/low-slope sections'
  },
  underlayment: {
    label: 'Underlayment',
    dbCategories: ['Underlayment', 'underlayment', 'Self-Adhered Underlayment', 'Synthetic Underlayment'],
    icon: Layers,
    color: 'bg-blue-500',
    required: true,
    allowMultiple: true,
    description: 'Protective layer under covering'
  },
  deck_fasteners: {
    label: 'Deck Fasteners',
    dbCategories: ['Deck Fasteners'],
    icon: Hammer,
    color: 'bg-orange-500',
    required: true,
    allowMultiple: false,
    description: 'Nails/screws for deck'
  },
  cap_tabs: {
    label: 'Cap Tabs',
    dbCategories: ['Cap Tabs'],
    icon: CircleDot,
    color: 'bg-yellow-500',
    required: true,
    allowMultiple: false,
    description: 'Tin tabs, plastic or metal caps'
  },
  roofing_fasteners: {
    label: 'Roofing Fasteners',
    dbCategories: ['Roofing Fasteners'],
    icon: Hammer,
    color: 'bg-red-500',
    required: true,
    allowMultiple: false,
    description: 'For attaching roof covering'
  }
};

export function MobileMaterialSheet({
  open,
  onOpenChange,
  isHVHZ,
  roofType,
  selectedProducts,
  onProductsChange,
}: MobileMaterialSheetProps) {
  const { products, loading, isExpired, isExpiringSoon } = useProductApprovals();
  const [expandedCategory, setExpandedCategory] = useState<string>('');

  // Get products for a specific material category
  const getProductsForCategory = (category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    if (!config) return [];
    
    return products.filter(p => 
      config.dbCategories.some(dbCat => 
        p.product_category?.toLowerCase().includes(dbCat.toLowerCase()) ||
        dbCat.toLowerCase().includes(p.product_category?.toLowerCase() || '')
      )
    );
  };

  // Get selected products for a category
  const getSelectedForCategory = (category: MaterialCategory) => {
    return selectedProducts.filter(p => p.category === category);
  };

  // Check if product is selected
  const isProductSelected = (productId: string, category: MaterialCategory) => {
    return selectedProducts.some(p => p.id === productId && p.category === category);
  };

  // Toggle product selection
  const toggleProduct = (product: ProductApproval, category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    const isSelected = isProductSelected(product.id, category);

    if (isSelected) {
      // Remove
      onProductsChange(selectedProducts.filter(p => !(p.id === product.id && p.category === category)));
    } else {
      // Add
      const newProduct: MultiSelectedProduct = {
        id: product.id,
        product,
        category,
      };

      if (config?.allowMultiple) {
        onProductsChange([...selectedProducts, newProduct]);
      } else {
        // Replace existing selection for this category
        const filtered = selectedProducts.filter(p => p.category !== category);
        onProductsChange([...filtered, newProduct]);
      }
    }
  };

  // Determine which categories to show based on roof type
  const visibleCategories = (() => {
    const categories = Object.keys(CATEGORY_CONFIG) as MaterialCategory[];
    
    if (roofType === 'steep') {
      return categories.filter(c => c !== 'flat_roofing');
    }
    if (roofType === 'flat') {
      return categories.filter(c => c !== 'roof_covering');
    }
    return categories;
  })();

  const totalSelected = selectedProducts.length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Select Materials
              </DrawerTitle>
              <DrawerDescription>
                {totalSelected} product{totalSelected !== 1 ? 's' : ''} selected
              </DrawerDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
          
          {isHVHZ && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700">HVHZ Zone - Only NOA-approved products shown</span>
            </div>
          )}
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : (
            <Accordion 
              type="single" 
              collapsible 
              value={expandedCategory}
              onValueChange={setExpandedCategory}
              className="space-y-2"
            >
              {visibleCategories.map(category => {
                const config = CATEGORY_CONFIG[category];
                const categoryProducts = getProductsForCategory(category);
                const selected = getSelectedForCategory(category);
                const Icon = config.icon;

                return (
                  <AccordionItem 
                    key={category} 
                    value={category}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.color)}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{config.label}</span>
                            {config.required && <span className="text-destructive text-xs">*</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                        <Badge 
                          variant={selected.length > 0 ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {selected.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {categoryProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No products available in this category
                          </p>
                        ) : (
                          categoryProducts.map(product => {
                            const isSelected = isProductSelected(product.id, category);
                            const expired = isExpired(product);
                            const expiringSoon = isExpiringSoon(product);

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => !expired && toggleProduct(product, category)}
                                disabled={expired}
                                className={cn(
                                  "w-full p-3 rounded-lg border text-left transition-all",
                                  isSelected 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border hover:border-primary/50",
                                  expired && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                                    isSelected 
                                      ? "border-primary bg-primary" 
                                      : "border-muted-foreground"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{product.product_name}</p>
                                    <p className="text-xs text-muted-foreground">{product.manufacturer}</p>
                                    {product.noa_number && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        NOA: {product.noa_number}
                                      </p>
                                    )}
                                    <div className="flex gap-1 mt-1">
                                      {expired && (
                                        <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                                      )}
                                      {expiringSoon && !expired && (
                                        <Badge variant="secondary" className="text-[10px]">Expiring Soon</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>

        {/* Selected Summary Footer */}
        {totalSelected > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {selectedProducts.slice(0, 3).map(sel => (
                <Badge 
                  key={`${sel.id}-${sel.category}`} 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span className="truncate max-w-[100px]">{sel.product.product_name}</span>
                  <button
                    type="button"
                    onClick={() => toggleProduct(sel.product, sel.category)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {totalSelected > 3 && (
                <Badge variant="outline">+{totalSelected - 3} more</Badge>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
