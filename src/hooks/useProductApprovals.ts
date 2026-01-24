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
      const { data, error: fetchError } = await supabase
        .from('product_approvals')
        .select('*')
        .eq('is_active', true)
        .order('manufacturer', { ascending: true });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load product approvals');
    } finally {
      setLoading(false);
    }
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

  // Group products by manufacturer
  const getProductsByManufacturer = (categoryProducts: ProductApproval[]) => {
    const groups: Record<string, ProductApproval[]> = {};
    
    categoryProducts.forEach(product => {
      const mfr = product.manufacturer || 'Other';
      if (!groups[mfr]) groups[mfr] = [];
      groups[mfr].push(product);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([manufacturer, products]) => ({
        manufacturer,
        products: products.sort((a, b) => a.product_name.localeCompare(b.product_name))
      }));
  };

  return {
    products,
    loading,
    error,
    getByCategory,
    getByManufacturer,
    getManufacturers,
    getCategories,
    isExpired,
    isExpiringSoon,
    verifyProductForJurisdiction,
    getApprovalDisplay,
    getProductsByManufacturer,
    refetch: fetchProducts,
  };
}
