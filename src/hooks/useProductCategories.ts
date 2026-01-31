import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductCategory {
  category: string;
  productCount: number;
}

export interface CategoryGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  required: boolean;
  allowMultiple: boolean;
  description: string;
  dbCategories: string[];
}

// High-level category groupings that map multiple DB categories
// Use EXACT database category names for reliable matching
// Use EXACT database category names (case-insensitive matching applied in hook)
const CATEGORY_GROUPS: Record<string, Omit<CategoryGroup, 'dbCategories'> & { matchPatterns: string[] }> = {
  roof_covering: {
    id: 'roof_covering',
    label: 'Roof Covering',
    icon: 'Home',
    color: 'bg-green-500',
    required: true,
    allowMultiple: true,
    description: 'Primary roofing material (shingles, tile, metal)',
    // Exact DB category names from product_approvals table
    matchPatterns: [
      'Shingles', 'shingles', 'shingle',
      'Metal Roofing', 'metal',
      'Metal Tile Panels',
      'Roof Tile', 'tiles',
      'Stone Coated Steel',
      'Roofing Slate',
      'roof_covering'
    ],
  },
  flat_roofing: {
    id: 'flat_roofing',
    label: 'Flat/Low-Slope Roofing',
    icon: 'Layers',
    color: 'bg-purple-500',
    required: false,
    allowMultiple: true,
    description: 'For flat or low-slope roof sections (TPO, EPDM, modified bitumen, coatings)',
    matchPatterns: [
      'Flat Roofing - TPO', 'Flat Roofing - EPDM', 'Flat Roofing - PVC',
      'Flat Roofing - Modified Bitumen', 'flat_roof',
      'Single Ply Roof Systems',
      'Modified Bitumen Roof Systems',
      'Built Up Roofing',
      'Spray Applied Polyurethene Roof Sys',
      'Liquid Applied Roof Systems',
      'Roof Coating',
      'Waterproofing'
    ],
  },
  underlayment: {
    id: 'underlayment',
    label: 'Underlayment',
    icon: 'Layers',
    color: 'bg-blue-500',
    required: true,
    allowMultiple: true,
    description: 'Protective layer under roof covering (synthetic, peel & stick, felt)',
    matchPatterns: ['Underlayment', 'underlayment', 'Roofing Insulation', 'Insulation'],
  },
  deck_fasteners: {
    id: 'deck_fasteners',
    label: 'Deck Fasteners',
    icon: 'Hammer',
    color: 'bg-orange-500',
    required: true,
    allowMultiple: false,
    description: 'Nails or screws for attaching to deck',
    matchPatterns: ['Deck Fasteners', 'Deck - Roof', 'Deck - Floor'],
  },
  cap_tabs: {
    id: 'cap_tabs',
    label: 'Cap Tabs / Caps',
    icon: 'CircleDot',
    color: 'bg-yellow-500',
    required: true,
    allowMultiple: false,
    description: 'Tin tabs, plastic or metal caps',
    matchPatterns: ['Cap Tabs'],
  },
  roofing_fasteners: {
    id: 'roofing_fasteners',
    label: 'Roofing Fasteners',
    icon: 'Hammer',
    color: 'bg-red-500',
    required: true,
    allowMultiple: false,
    description: 'For attaching roof covering',
    matchPatterns: ['Roofing Fasteners', 'Fasteners'],
  },
  ventilation: {
    id: 'ventilation',
    label: 'Ventilation',
    icon: 'Layers',
    color: 'bg-teal-500',
    required: false,
    allowMultiple: true,
    description: 'Ridge vents, turbines, and roof ventilation',
    matchPatterns: ['Ventilation', 'Roof Ventilation'],
  },
  sealants: {
    id: 'sealants',
    label: 'Sealants & Adhesives',
    icon: 'Layers',
    color: 'bg-indigo-500',
    required: false,
    allowMultiple: true,
    description: 'Roof sealants, adhesives, and flashing',
    matchPatterns: ['Sealants & Adhesives', 'adhesive', 'Flashing'],
  },
  skylights: {
    id: 'skylights',
    label: 'Skylights',
    icon: 'Layers',
    color: 'bg-cyan-500',
    required: false,
    allowMultiple: true,
    description: 'Skylights and roof windows',
    matchPatterns: ['Skylights', 'skylight'],
  },
  gutters: {
    id: 'gutters',
    label: 'Gutters & Downspouts',
    icon: 'Layers',
    color: 'bg-slate-500',
    required: false,
    allowMultiple: true,
    description: 'Gutter systems and downspouts',
    matchPatterns: ['Gutters & Downspouts'],
  },
};

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch ALL products to get accurate category counts
        // Supabase default limit is 1000 rows, so we need to paginate or fetch more
        let allData: { product_category: string | null }[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error: fetchError } = await supabase
            .from('product_approvals')
            .select('product_category')
            .eq('is_active', true)
            .not('product_category', 'is', null)
            .not('product_category', 'eq', '')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (fetchError) throw fetchError;

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }
        }

        // Count occurrences of each category
        const categoryMap: Record<string, number> = {};
        allData.forEach((row) => {
          const cat = row.product_category?.trim();
          if (cat) {
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
          }
        });

        const categoryList = Object.entries(categoryMap)
          .map(([category, productCount]) => ({ category, productCount }))
          .sort((a, b) => a.category.localeCompare(b.category));

        setCategories(categoryList);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load product categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Build dynamic category groups based on actual database categories
  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (categories.length === 0) return [];

    return Object.entries(CATEGORY_GROUPS).map(([groupId, config]) => {
      // Find all database categories that match this group's patterns
      const matchedDbCategories = categories
        .filter((cat) => {
          const catLower = cat.category.toLowerCase();
          return config.matchPatterns.some(
            (pattern) =>
              catLower === pattern.toLowerCase() || // Exact match (case-insensitive)
              catLower.includes(pattern.toLowerCase()) ||
              pattern.toLowerCase().includes(catLower)
          );
        })
        .map((cat) => cat.category);

      return {
        id: groupId,
        label: config.label,
        icon: config.icon,
        color: config.color,
        required: config.required,
        allowMultiple: config.allowMultiple,
        description: config.description,
        dbCategories: matchedDbCategories,
      };
    }).filter((group) => group.dbCategories.length > 0);
  }, [categories]);

  // Get ungrouped categories (those not matched by any group)
  const ungroupedCategories = useMemo((): ProductCategory[] => {
    if (categories.length === 0) return [];

    const groupedCats = new Set<string>();
    categoryGroups.forEach((group) => {
      group.dbCategories.forEach((cat) => groupedCats.add(cat));
    });

    return categories.filter((cat) => !groupedCats.has(cat.category));
  }, [categories, categoryGroups]);

  return {
    categories,
    categoryGroups,
    ungroupedCategories,
    loading,
    error,
  };
}
