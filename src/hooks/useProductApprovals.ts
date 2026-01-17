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
  expiration_date: string | null;
  hvhz_approved: boolean;
  wind_speed_rating: number | null;
  file_path: string | null;
  file_url: string | null;
  is_active: boolean;
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
    refetch: fetchProducts,
  };
}
