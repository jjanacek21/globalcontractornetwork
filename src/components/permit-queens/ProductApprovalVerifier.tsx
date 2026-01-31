import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Download,
  ExternalLink,
  Building2,
  Loader2
} from 'lucide-react';
import { useProductApprovals, ProductApproval } from '@/hooks/useProductApprovals';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductApprovalVerifierProps {
  onProductSelect?: (product: ProductApproval) => void;
  showSelectButton?: boolean;
}

export function ProductApprovalVerifier({ 
  onProductSelect,
  showSelectButton = false 
}: ProductApprovalVerifierProps) {
  const { products, loading, getCategories, getManufacturers, isExpired, isExpiringSoon } = useProductApprovals();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [hvhzOnly, setHvhzOnly] = useState(false);
  const [validOnly, setValidOnly] = useState(true);
  const [hasDocumentsOnly, setHasDocumentsOnly] = useState(false);

  const categories = getCategories();
  const manufacturers = getManufacturers();

  // Filter manufacturers based on search input
  const filteredManufacturers = useMemo(() => {
    if (!manufacturerSearch) return [];
    const search = manufacturerSearch.toLowerCase();
    return manufacturers.filter(m => m.toLowerCase().includes(search));
  }, [manufacturers, manufacturerSearch]);
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search query - check NOA, FL Product Approval, manufacturer, product name
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.noa_number?.toLowerCase().includes(query) ||
          product.fl_product_approval?.toLowerCase().includes(query) ||
          product.manufacturer.toLowerCase().includes(query) ||
          product.product_name.toLowerCase().includes(query) ||
          product.product_category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && product.product_category !== selectedCategory) {
        return false;
      }

      // Manufacturer filter
      if (selectedManufacturer !== 'all' && product.manufacturer !== selectedManufacturer) {
        return false;
      }

      // HVHZ filter
      if (hvhzOnly && !product.hvhz_approved) {
        return false;
      }

      // Valid only filter
      if (validOnly && isExpired(product)) {
        return false;
      }

      // Has documents filter
      if (hasDocumentsOnly && !product.file_url) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedManufacturer, hvhzOnly, validOnly, hasDocumentsOnly, isExpired]);

  const getProductStatus = (product: ProductApproval) => {
    if (isExpired(product)) {
      return { label: 'Expired', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (isExpiringSoon(product)) {
      return { label: 'Expiring Soon', variant: 'secondary' as const, icon: Clock };
    }
    if (product.hvhz_approved) {
      return { label: 'HVHZ Approved', variant: 'default' as const, icon: Shield };
    }
    return { label: 'Valid', variant: 'secondary' as const, icon: CheckCircle2 };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedManufacturer('all');
    setHvhzOnly(false);
    setValidOnly(true);
    setHasDocumentsOnly(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading product approvals...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Product Approval Verification
        </CardTitle>
        <CardDescription>
          Search and verify Florida Building Code approved products by NOA number, FL Product Approval, or manufacturer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NOA number, FL Product Approval, manufacturer, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search manufacturer..."
              value={manufacturerSearch}
              onChange={(e) => setManufacturerSearch(e.target.value)}
              className="pl-10"
            />
            {manufacturerSearch && filteredManufacturers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setSelectedManufacturer('all');
                    setManufacturerSearch('');
                  }}
                >
                  All Manufacturers
                </button>
                {filteredManufacturers.slice(0, 20).map(mfr => (
                  <button
                    key={mfr}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      selectedManufacturer === mfr && "bg-accent"
                    )}
                    onClick={() => {
                      setSelectedManufacturer(mfr);
                      setManufacturerSearch('');
                    }}
                  >
                    {mfr}
                  </button>
                ))}
                {filteredManufacturers.length > 20 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    +{filteredManufacturers.length - 20} more...
                  </p>
                )}
              </div>
            )}
            {selectedManufacturer !== 'all' && !manufacturerSearch && (
              <div className="absolute z-50 w-full mt-1">
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  {selectedManufacturer}
                  <button
                    type="button"
                    className="ml-1 hover:text-destructive"
                    onClick={() => setSelectedManufacturer('all')}
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="hvhz" 
                checked={hvhzOnly} 
                onCheckedChange={(checked) => setHvhzOnly(!!checked)} 
              />
              <Label htmlFor="hvhz" className="text-sm">HVHZ Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="valid" 
                checked={validOnly} 
                onCheckedChange={(checked) => setValidOnly(!!checked)} 
              />
              <Label htmlFor="valid" className="text-sm">Valid Only</Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox 
              id="hasDocs" 
              checked={hasDocumentsOnly} 
              onCheckedChange={(checked) => setHasDocumentsOnly(!!checked)} 
            />
            <Label htmlFor="hasDocs" className="text-sm">Has NOA Document</Label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{filteredProducts.length}</strong> of {products.length} products
          </p>
          {(searchQuery || selectedCategory !== 'all' || selectedManufacturer !== 'all' || hvhzOnly || hasDocumentsOnly) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <Separator />

        {/* Results */}
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-3 max-h-[600px] overflow-y-auto">
            {filteredProducts.slice(0, 50).map(product => {
              const status = getProductStatus(product);
              const StatusIcon = status.icon;

              return (
                <div 
                  key={product.id}
                  className={cn(
                    "p-4 border rounded-lg hover:border-primary/50 transition-colors",
                    isExpired(product) && "opacity-60 bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{product.product_name}</h4>
                        <Badge variant={status.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        {product.hvhz_approved && status.label !== 'HVHZ Approved' && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            <Shield className="h-3 w-3 mr-1" />
                            HVHZ
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Manufacturer:</span>{' '}
                          <span className="font-medium">{product.manufacturer}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          <span>{product.product_category}</span>
                        </div>
                        {product.noa_number && (
                          <div>
                            <span className="text-muted-foreground">NOA:</span>{' '}
                            <span className="font-mono text-xs">{product.noa_number}</span>
                          </div>
                        )}
                        {product.fl_product_approval && (
                          <div>
                            <span className="text-muted-foreground">FL Approval:</span>{' '}
                            <span className="font-mono text-xs">{product.fl_product_approval}</span>
                          </div>
                        )}
                        {product.wind_speed_rating && (
                          <div>
                            <span className="text-muted-foreground">Wind Rating:</span>{' '}
                            <span>{product.wind_speed_rating} mph</span>
                          </div>
                        )}
                        {product.expiration_date && (
                          <div>
                            <span className="text-muted-foreground">Expires:</span>{' '}
                            <span className={isExpired(product) ? 'text-destructive' : isExpiringSoon(product) ? 'text-orange-600' : ''}>
                              {format(new Date(product.expiration_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {product.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-1" />
                            NOA
                          </a>
                        </Button>
                      )}
                      {showSelectButton && onProductSelect && !isExpired(product) && (
                        <Button size="sm" onClick={() => onProductSelect(product)}>
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length > 50 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                Showing first 50 results. Refine your search to see more specific products.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
