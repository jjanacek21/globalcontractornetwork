import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Check, AlertTriangle, X, Search, Plus, FileText, Calendar, Shield, ShieldCheck,
  ChevronDown, ChevronRight, Hammer, Layers, Home, CircleDot
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { format } from 'date-fns';

// Extended category type for multi-material selection
export type MaterialCategory = 
  | 'roof_covering'
  | 'flat_roofing'
  | 'underlayment'
  | 'deck_fasteners'
  | 'cap_tabs'
  | 'roofing_fasteners';

export interface MultiSelectedProduct {
  id: string;
  product: ProductApproval;
  category: MaterialCategory;
  area?: string; // e.g., "main roof", "flat section"
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
    dbCategories: ['Shingles', 'Metal Panel', 'Roof Tile', 'Stone Coated Steel', 'Metal Tile Panels'],
    icon: Home,
    color: 'bg-green-500',
    required: true,
    allowMultiple: true,
    description: 'Primary roofing material (shingles, tile, metal)'
  },
  flat_roofing: {
    label: 'Flat/Low-Slope Roofing',
    dbCategories: ['Flat Roofing - TPO', 'Flat Roofing - EPDM', 'Flat Roofing - PVC', 'Flat Roofing - Modified Bitumen'],
    icon: Layers,
    color: 'bg-purple-500',
    required: false,
    allowMultiple: true,
    description: 'For flat or low-slope roof sections'
  },
  underlayment: {
    label: 'Underlayment',
    dbCategories: ['Underlayment', 'Self-Adhered Underlayment', 'Synthetic Underlayment'],
    icon: Layers,
    color: 'bg-blue-500',
    required: true,
    allowMultiple: true,
    description: 'Protective layer under roof covering'
  },
  deck_fasteners: {
    label: 'Deck Fasteners',
    dbCategories: ['Deck Fasteners'],
    icon: Hammer,
    color: 'bg-orange-500',
    required: true,
    allowMultiple: false,
    description: 'Nails or screws for attaching to deck'
  },
  cap_tabs: {
    label: 'Cap Tabs / Caps',
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

export function MultiMaterialSelector({ 
  isHVHZ, 
  roofType, 
  selectedProducts, 
  onProductsChange,
  onRoofTypeChange
}: MultiMaterialSelectorProps) {
  const { products, loading, getManufacturers, isExpired, isExpiringSoon, getCategories } = useProductApprovals();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('roof_covering');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['roof_covering', 'underlayment']));

  const manufacturers = useMemo(() => getManufacturers(), [products]);
  const dbCategories = useMemo(() => getCategories(), [products]);

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

  // Filter products based on search and manufacturer
  const filterProducts = (categoryProducts: ProductApproval[]) => {
    let filtered = categoryProducts;

    if (selectedManufacturer !== 'all') {
      filtered = filtered.filter(p => p.manufacturer === selectedManufacturer);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.product_name.toLowerCase().includes(query) ||
        p.manufacturer.toLowerCase().includes(query) ||
        p.noa_number?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Get selected products for a category
  const getSelectedForCategory = (category: MaterialCategory) => {
    return selectedProducts.filter(p => p.category === category);
  };

  // Add or toggle a product selection
  const toggleProduct = (product: ProductApproval, category: MaterialCategory, area?: string) => {
    const config = CATEGORY_CONFIG[category];
    const existingIndex = selectedProducts.findIndex(p => p.id === product.id && p.category === category);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      onProductsChange(selectedProducts.filter((_, i) => i !== existingIndex));
    } else {
      const newProduct: MultiSelectedProduct = {
        id: product.id,
        product,
        category,
        area,
      };

      if (config?.allowMultiple) {
        // Add to existing selections
        onProductsChange([...selectedProducts, newProduct]);
      } else {
        // Replace existing selection for this category
        const filtered = selectedProducts.filter(p => p.category !== category);
        onProductsChange([...filtered, newProduct]);
      }
    }
  };

  // Remove a specific product
  const removeProduct = (productId: string, category: MaterialCategory) => {
    onProductsChange(selectedProducts.filter(p => !(p.id === productId && p.category === category)));
  };

  const getProductStatus = (product: ProductApproval) => {
    if (isExpired(product)) {
      return { status: 'expired', icon: X, color: 'destructive', label: 'Expired' };
    }
    if (isExpiringSoon(product)) {
      return { status: 'expiring', icon: AlertTriangle, color: 'warning', label: 'Expiring Soon' };
    }
    if (isHVHZ && !product.hvhz_approved) {
      return { status: 'not_hvhz', icon: AlertTriangle, color: 'warning', label: 'Not HVHZ Approved' };
    }
    return { status: 'valid', icon: Check, color: 'success', label: 'Valid' };
  };

  const toggleCategoryExpanded = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
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

  const renderProductCard = (product: ProductApproval, category: MaterialCategory) => {
    const status = getProductStatus(product);
    const isSelected = selectedProducts.some(p => p.id === product.id && p.category === category);
    const StatusIcon = status.icon;
    const isDisabled = status.status === 'expired';

    return (
      <div
        key={`${product.id}-${category}`}
        className={`p-3 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !isDisabled && toggleProduct(product, category)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{product.product_name}</span>
              {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{product.manufacturer}</p>
            
            <div className="flex flex-wrap gap-1">
              {product.noa_number && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <FileText className="h-2.5 w-2.5 mr-0.5" />
                  {product.noa_number}
                </Badge>
              )}
              {product.hvhz_approved && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                  HVHZ
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={status.status === 'valid' ? 'default' : status.status === 'expired' ? 'destructive' : 'secondary'}
              className={`text-[10px] px-1.5 py-0 ${status.status === 'valid' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}
            >
              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
              {status.label}
            </Badge>
            {product.expiration_date && (
              <span className="text-[10px] text-muted-foreground flex items-center">
                <Calendar className="h-2.5 w-2.5 mr-0.5" />
                {format(new Date(product.expiration_date), 'MM/yy')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySection = (category: MaterialCategory) => {
    const config = CATEGORY_CONFIG[category];
    const categoryProducts = getProductsForCategory(category);
    const filteredProducts = filterProducts(categoryProducts);
    const selected = getSelectedForCategory(category);
    const isExpanded = expandedCategories.has(category);
    const Icon = config.icon;

    return (
      <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category)}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.label}</span>
                  {config.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                  {config.allowMultiple && <Badge variant="secondary" className="text-[10px]">Multi-select</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={selected.length > 0 ? 'default' : 'secondary'}>
                {selected.length} selected
              </Badge>
              <span className="text-xs text-muted-foreground">({filteredProducts.length} available)</span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-3 space-y-3">
            {/* Selected products for this category */}
            {selected.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Selected:</Label>
                <div className="flex flex-wrap gap-2">
                  {selected.map(sel => (
                    <Badge 
                      key={sel.id} 
                      variant="default"
                      className="pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      <span className="text-xs">{sel.product.product_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProduct(sel.id, category);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredProducts.map(product => renderProductCard(product, category))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No products found for this category
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
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
                          <div key={sel.id} className="text-xs flex items-center justify-between">
                            <span className="truncate">{sel.product.product_name}</span>
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
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

      {/* Product Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Material Selection</CardTitle>
          <CardDescription>
            Select products with valid Florida product approvals for each category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or NOA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map(mfr => (
                  <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Category Sections */}
          <div className="space-y-3">
            {visibleCategories.map(category => renderCategorySection(category))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
