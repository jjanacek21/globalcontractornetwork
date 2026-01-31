import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductApproval {
  id: string;
  manufacturer: string;
  product_name: string;
  product_category: string;
  product_line: string | null;
  noa_number: string | null;
  fl_product_approval: string | null;
  uil_number: string | null;
  expiration_date: string | null;
  hvhz_approved: boolean;
  wind_speed_rating: number | null;
  file_path: string | null;
  file_url: string | null;
  noa_pdf_url?: string | null;
  fl_approval_pdf_url?: string | null;
  ul_listing_url?: string | null;
  is_active: boolean;
  premium_tier?: number;
}

export interface ApprovalDisplay {
  type: 'NOA' | 'FL Product Approval' | null;
  number: string | null;
  pdfUrl: string | null;
}

export interface SelectedProduct {
  id: string;
  product: ProductApproval;
  category: 'underlayment' | 'roof_covering' | 'flat_roofing' | 'deck_fasteners' | 'cap_tabs' | 'roofing_fasteners' | 'fasteners' | 'other';
  area?: string;
  quantity?: number;
  notes?: string;
}

export function useProductApprovals() {
  const [products, setProducts] = useState<ProductApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Paginate to fetch ALL products (Supabase default limit is 1000)
      let allProducts: ProductApproval[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: fetchError } = await supabase
          .from('product_approvals')
          .select('*')
          .eq('is_active', true)
          .order('premium_tier', { ascending: false })
          .order('manufacturer', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allProducts = [...allProducts, data as unknown as ProductApproval[]].flat();
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      setProducts(allProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load product approvals');
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if product has PDF available
  const hasPdf = (product: ProductApproval) => {
    return !!(product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url);
  };

  const getByCategory = (category: string) => {
    return products.filter(p => p.product_category === category);
  };

  const getByManufacturer = (manufacturer: string) => {
    return products.filter(p => p.manufacturer === manufacturer);
  };

  const getManufacturers = () => {
    return [...new Set(products.map(p => p.manufacturer))].sort();
  };

  const getCategories = () => {
    return [...new Set(products.map(p => p.product_category))].sort();
  };

  // Get products sorted with PDFs first
  const getProductsSortedByPdfAvailability = () => {
    return [...products].sort((a, b) => {
      const aPdf = hasPdf(a);
      const bPdf = hasPdf(b);
      if (aPdf && !bPdf) return -1;
      if (!aPdf && bPdf) return 1;
      return a.product_name.localeCompare(b.product_name);
    });
  };

  const isExpired = (product: ProductApproval) => {
    if (!product.expiration_date) return false;
    return new Date(product.expiration_date) < new Date();
  };

  const isExpiringSoon = (product: ProductApproval, daysThreshold = 90) => {
    if (!product.expiration_date) return false;
    const expirationDate = new Date(product.expiration_date);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    return expirationDate <= thresholdDate && expirationDate > new Date();
  };

  const verifyProductForJurisdiction = async (productId: string, isHVHZ: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { valid: false, reason: 'Product not found' };
    }

    if (isExpired(product)) {
      return { valid: false, reason: 'NOA has expired', product };
    }

    if (isHVHZ && !product.hvhz_approved) {
      return { valid: false, reason: 'Product not approved for HVHZ', product };
    }

    return { valid: true, product };
  };

  // Get approval display info based on HVHZ status
  const getApprovalDisplay = (product: ProductApproval, isHVHZ: boolean): ApprovalDisplay => {
    if (isHVHZ && product.noa_number) {
      return {
        type: 'NOA',
        number: product.noa_number,
        pdfUrl: product.file_url,
      };
    }
    if (product.fl_product_approval) {
      return {
        type: 'FL Product Approval',
        number: product.fl_product_approval,
        pdfUrl: product.file_url,
      };
    }
    if (product.noa_number) {
      return {
        type: 'NOA',
        number: product.noa_number,
        pdfUrl: product.file_url,
      };
    }
    return { type: null, number: null, pdfUrl: null };
  };

  // Group products by manufacturer, sorted by premium_tier
  const getProductsByManufacturer = (categoryProducts: ProductApproval[]) => {
    const groups: Record<string, { products: ProductApproval[]; maxTier: number }> = {};
    
    categoryProducts.forEach(product => {
      const mfr = product.manufacturer || 'Other';
      if (!groups[mfr]) {
        groups[mfr] = { products: [], maxTier: 0 };
      }
      groups[mfr].products.push(product);
      groups[mfr].maxTier = Math.max(groups[mfr].maxTier, product.premium_tier || 0);
    });

    // Sort manufacturers by premium_tier (highest first), then alphabetically
    return Object.entries(groups)
      .sort(([aName, aData], [bName, bData]) => {
        if (bData.maxTier !== aData.maxTier) return bData.maxTier - aData.maxTier;
        return aName.localeCompare(bName);
      })
      .map(([manufacturer, data]) => ({
        manufacturer,
        products: data.products.sort((a, b) => {
          // Within manufacturer: PDFs first, then by name
          const aPdf = hasPdf(a);
          const bPdf = hasPdf(b);
          if (aPdf && !bPdf) return -1;
          if (!aPdf && bPdf) return 1;
          return a.product_name.localeCompare(b.product_name);
        })
      }));
  };

  return {
    products,
    loading,
    error,
    hasPdf,
    getByCategory,
    getByManufacturer,
    getManufacturers,
    getCategories,
    getProductsSortedByPdfAvailability,
    isExpired,
    isExpiringSoon,
    verifyProductForJurisdiction,
    getApprovalDisplay,
    getProductsByManufacturer,
    refetch: fetchProducts,
  };
}
