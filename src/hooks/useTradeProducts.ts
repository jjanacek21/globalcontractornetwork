import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TradeProduct {
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
  applicable_trades: string[];
  uil_number: string | null;
  file_path: string | null;
  file_url: string | null;
  is_active: boolean;
  premium_tier?: number;
}

export type TradeType = 'roofing' | 'hvac' | 'electrical' | 'plumbing' | 'windows_doors' | 'general_construction';

export interface ProductCategory {
  category: string;
  products: TradeProduct[];
  required: boolean;
  description: string;
}

const TRADE_CATEGORIES: Record<TradeType, { categories: string[]; required: string[] }> = {
  roofing: {
    categories: ['Underlayment', 'Roof Tile', 'Shingles', 'Metal Roofing', 'Fasteners'],
    required: ['Underlayment', 'Roof Tile', 'Shingles', 'Metal Roofing'], // At least one covering required
  },
  hvac: {
    categories: ['AC Unit', 'Heat Pump', 'Air Handler'],
    required: ['AC Unit', 'Heat Pump'], // At least one unit required
  },
  electrical: {
    categories: ['Electrical Panel'],
    required: ['Electrical Panel'],
  },
  plumbing: {
    categories: ['Water Heater'],
    required: ['Water Heater'],
  },
  windows_doors: {
    categories: ['Impact Window', 'Impact Door'],
    required: ['Impact Window', 'Impact Door'],
  },
  general_construction: {
    categories: [],
    required: [],
  },
};

export function useTradeProducts(trade: TradeType, isHVHZ: boolean = false) {
  const [products, setProducts] = useState<TradeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [trade, isHVHZ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('product_approvals')
        .select('*')
        .eq('is_active', true)
        .contains('applicable_trades', [trade]);

      if (isHVHZ) {
        query = query.eq('hvhz_approved', true);
      }

      const { data, error: fetchError } = await query.order('manufacturer', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Map data to include applicable_trades and premium_tier
      const mappedProducts = (data || []).map(p => ({
        ...p,
        applicable_trades: (p as any).applicable_trades || [trade],
        uil_number: (p as any).uil_number || null,
        premium_tier: (p as any).premium_tier || 2,
      })) as TradeProduct[];
      
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching trade products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const categorizedProducts = useMemo((): ProductCategory[] => {
    const tradeConfig = TRADE_CATEGORIES[trade] || { categories: [], required: [] };
    
    return tradeConfig.categories.map(category => ({
      category,
      products: products.filter(p => p.product_category === category),
      required: tradeConfig.required.includes(category),
      description: getCategoryDescription(category),
    }));
  }, [products, trade]);

  const getByCategory = (category: string): TradeProduct[] => {
    return products.filter(p => p.product_category === category);
  };

  const getManufacturers = (): string[] => {
    return [...new Set(products.map(p => p.manufacturer))].sort();
  };

  const isExpired = (product: TradeProduct): boolean => {
    if (!product.expiration_date) return false;
    return new Date(product.expiration_date) < new Date();
  };

  const isExpiringSoon = (product: TradeProduct, days: number = 90): boolean => {
    if (!product.expiration_date) return false;
    const expDate = new Date(product.expiration_date);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);
    return expDate <= thresholdDate && expDate > new Date();
  };

  return {
    products,
    categorizedProducts,
    loading,
    error,
    getByCategory,
    getManufacturers,
    isExpired,
    isExpiringSoon,
    refetch: fetchProducts,
  };
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'Underlayment': 'Required secondary water barrier under roof covering',
    'Roof Tile': 'Concrete or clay tile roof covering',
    'Shingles': 'Asphalt or composite shingle roof covering',
    'Metal Roofing': 'Standing seam or metal panel roof covering',
    'Fasteners': 'Nails, screws, or clips for roof attachment',
    'AC Unit': 'Air conditioning condenser unit',
    'Heat Pump': 'Heat pump condenser unit',
    'Air Handler': 'Indoor air handler unit',
    'Electrical Panel': 'Main electrical service panel',
    'Water Heater': 'Tank or tankless water heater',
    'Impact Window': 'Hurricane impact-rated window',
    'Impact Door': 'Hurricane impact-rated door',
  };
  return descriptions[category] || category;
}
