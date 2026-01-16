import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Check, AlertTriangle, X, Search, Plus, FileText, Calendar, Shield, ShieldCheck } from 'lucide-react';
import { useProductApprovals, ProductApproval, SelectedProduct } from '@/hooks/useProductApprovals';
import { format } from 'date-fns';

interface ProductSelectorProps {
  isHVHZ: boolean;
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
}

export function ProductSelector({ isHVHZ, selectedProducts, onProductsChange }: ProductSelectorProps) {
  const { products, loading, getByCategory, getManufacturers, isExpired, isExpiringSoon } = useProductApprovals();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');

  const manufacturers = useMemo(() => getManufacturers(), [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.product_category === selectedCategory);
    }

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
  }, [products, selectedCategory, selectedManufacturer, searchQuery]);

  const underlayments = getByCategory('underlayment');
  const roofCoverings = getByCategory('roof_covering');

  const selectedUnderlayment = selectedProducts.find(p => p.category === 'underlayment');
  const selectedRoofCovering = selectedProducts.find(p => p.category === 'roof_covering');

  const addProduct = (product: ProductApproval, category: 'underlayment' | 'roof_covering') => {
    const existing = selectedProducts.find(p => p.category === category);
    const newProduct: SelectedProduct = {
      id: product.id,
      product,
      category,
    };

    if (existing) {
      onProductsChange(selectedProducts.map(p => p.category === category ? newProduct : p));
    } else {
      onProductsChange([...selectedProducts, newProduct]);
    }
  };

  const removeProduct = (category: 'underlayment' | 'roof_covering') => {
    onProductsChange(selectedProducts.filter(p => p.category !== category));
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

  const renderProductCard = (product: ProductApproval, category: 'underlayment' | 'roof_covering') => {
    const status = getProductStatus(product);
    const isSelected = selectedProducts.some(p => p.id === product.id);
    const StatusIcon = status.icon;

    return (
      <div
        key={product.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        } ${status.status === 'expired' ? 'opacity-60' : ''}`}
        onClick={() => status.status !== 'expired' && addProduct(product, category)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{product.product_name}</span>
              {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{product.manufacturer}</p>
            
            <div className="flex flex-wrap gap-1.5">
              {product.noa_number && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  NOA: {product.noa_number}
                </Badge>
              )}
              {product.hvhz_approved && (
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  HVHZ
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={status.status === 'valid' ? 'default' : status.status === 'expired' ? 'destructive' : 'secondary'}
              className={`text-xs ${status.status === 'valid' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            {product.expiration_date && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Exp: {format(new Date(product.expiration_date), 'MM/yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSelectedProduct = (selected: SelectedProduct | undefined, category: 'underlayment' | 'roof_covering', label: string) => {
    if (!selected) {
      return (
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
          <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a {label}</p>
        </div>
      );
    }

    const status = getProductStatus(selected.product);
    const StatusIcon = status.icon;

    return (
      <div className="p-4 border rounded-lg bg-primary/5 border-primary">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{selected.product.product_name}</p>
            <p className="text-sm text-muted-foreground">{selected.product.manufacturer}</p>
            <div className="flex items-center gap-2 mt-2">
              {selected.product.noa_number && (
                <Badge variant="outline" className="text-xs">
                  NOA: {selected.product.noa_number}
                </Badge>
              )}
              <Badge 
                variant={status.status === 'valid' ? 'default' : 'secondary'}
                className={status.status === 'valid' ? 'bg-green-500 text-white' : ''}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeProduct(category)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Selected Products Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selected Materials</CardTitle>
          <CardDescription>
            Products you've selected for this permit application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Underlayment</Label>
            {renderSelectedProduct(selectedUnderlayment, 'underlayment', 'underlayment')}
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Roof Covering</Label>
            {renderSelectedProduct(selectedRoofCovering, 'roof_covering', 'roof covering')}
          </div>
        </CardContent>
      </Card>

      {/* Product Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Catalog</CardTitle>
          <CardDescription>
            Browse and select products with valid Florida NOAs
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="underlayment">Underlayment</SelectItem>
                <SelectItem value="roof_covering">Roof Covering</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="w-[180px]">
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

          {/* Underlayments Section */}
          {(selectedCategory === 'all' || selectedCategory === 'underlayment') && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Underlayment Products ({underlayments.filter(p => 
                  (!searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) &&
                  (selectedManufacturer === 'all' || p.manufacturer === selectedManufacturer)
                ).length})
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {underlayments
                  .filter(p => 
                    (!searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     p.noa_number?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (selectedManufacturer === 'all' || p.manufacturer === selectedManufacturer)
                  )
                  .map(product => renderProductCard(product, 'underlayment'))}
              </div>
            </div>
          )}

          {/* Roof Coverings Section */}
          {(selectedCategory === 'all' || selectedCategory === 'roof_covering') && (
            <div className="mt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Roof Covering Products ({roofCoverings.filter(p => 
                  (!searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) &&
                  (selectedManufacturer === 'all' || p.manufacturer === selectedManufacturer)
                ).length})
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {roofCoverings
                  .filter(p => 
                    (!searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     p.noa_number?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                    (selectedManufacturer === 'all' || p.manufacturer === selectedManufacturer)
                  )
                  .map(product => renderProductCard(product, 'roof_covering'))}
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No products match your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
