import * as React from 'react';
import { Check, ChevronsUpDown, Search, ShieldCheck, FileText, Calendar, AlertTriangle, X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ProductApproval } from '@/hooks/useProductApprovals';
import { format } from 'date-fns';

interface SearchableProductComboboxProps {
  products: ProductApproval[];
  selectedProduct: ProductApproval | null;
  onSelect: (product: ProductApproval | null) => void;
  placeholder?: string;
  label: string;
  isHVHZ: boolean;
  required?: boolean;
  disabled?: boolean;
  isExpired?: (product: ProductApproval) => boolean;
  isExpiringSoon?: (product: ProductApproval) => boolean;
}

interface ManufacturerGroup {
  manufacturer: string;
  products: ProductApproval[];
}

export function SearchableProductCombobox({
  products,
  selectedProduct,
  onSelect,
  placeholder = 'Search or select product...',
  label,
  isHVHZ,
  required = false,
  disabled = false,
  isExpired,
  isExpiringSoon,
}: SearchableProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  // Group products by manufacturer
  const groupedProducts = React.useMemo((): ManufacturerGroup[] => {
    const groups: Record<string, ProductApproval[]> = {};
    
    products.forEach(product => {
      const mfr = product.manufacturer || 'Other';
      if (!groups[mfr]) groups[mfr] = [];
      groups[mfr].push(product);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([manufacturer, products]) => ({
        manufacturer,
        products: products.sort((a, b) => 
          a.product_name.localeCompare(b.product_name)
        )
      }));
  }, [products]);

  // Filter products based on search
  const filteredGroups = React.useMemo((): ManufacturerGroup[] => {
    if (!searchValue) return groupedProducts;

    const query = searchValue.toLowerCase();
    return groupedProducts
      .map(group => ({
        manufacturer: group.manufacturer,
        products: group.products.filter(product =>
          product.product_name.toLowerCase().includes(query) ||
          product.manufacturer.toLowerCase().includes(query) ||
          product.noa_number?.toLowerCase().includes(query) ||
          product.fl_product_approval?.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.products.length > 0);
  }, [groupedProducts, searchValue]);

  const getProductStatus = (product: ProductApproval) => {
    const expired = isExpired?.(product) ?? false;
    const expiring = isExpiringSoon?.(product) ?? false;
    
    if (expired) {
      return { status: 'expired', color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Expired' };
    }
    if (expiring) {
      return { status: 'expiring', color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Expiring Soon' };
    }
    if (isHVHZ && !product.hvhz_approved) {
      return { status: 'not_hvhz', color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Not HVHZ' };
    }
    return { status: 'valid', color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Valid' };
  };

  const handleSelect = (product: ProductApproval) => {
    const status = getProductStatus(product);
    if (status.status === 'expired') return;
    
    onSelect(product);
    setOpen(false);
    setSearchValue('');
  };

  const totalProducts = products.length;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-auto min-h-10 py-2 px-3",
              !selectedProduct && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 text-left flex-1 min-w-0">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              {selectedProduct ? (
                <div className="truncate">
                  <span className="font-medium">{selectedProduct.product_name}</span>
                  <span className="text-muted-foreground ml-1">— {selectedProduct.manufacturer}</span>
                </div>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border shadow-lg" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${totalProducts} products...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No products found.</CommandEmpty>
              {filteredGroups.map((group) => (
                <CommandGroup 
                  key={group.manufacturer} 
                  heading={
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {group.manufacturer}
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {group.products.length}
                      </Badge>
                    </div>
                  }
                >
                  {group.products.map((product) => {
                    const status = getProductStatus(product);
                    const isDisabled = status.status === 'expired';
                    const isSelected = selectedProduct?.id === product.id;
                    
                    return (
                      <CommandItem
                        key={product.id}
                        value={`${product.product_name} ${product.manufacturer} ${product.noa_number || ''}`}
                        onSelect={() => handleSelect(product)}
                        disabled={isDisabled}
                        className={cn(
                          "flex items-center justify-between gap-2 py-2",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "opacity-100 text-primary" : "opacity-0"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{product.product_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {product.noa_number && (
                                <span className="flex items-center gap-0.5">
                                  <FileText className="h-2.5 w-2.5" />
                                  {product.noa_number}
                                </span>
                              )}
                              {product.expiration_date && (
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {format(new Date(product.expiration_date), 'MM/yy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {product.hvhz_approved && (
                            <Badge 
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 border-blue-500/20"
                            >
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                              HVHZ
                            </Badge>
                          )}
                          {status.status !== 'valid' && (
                            <Badge 
                              variant={status.status === 'expired' ? 'destructive' : 'secondary'}
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                status.status === 'expiring' && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              )}
                            >
                              {status.status === 'expired' && <X className="h-2.5 w-2.5 mr-0.5" />}
                              {status.status === 'expiring' && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                              {status.label}
                            </Badge>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
