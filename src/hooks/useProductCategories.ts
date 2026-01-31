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
const CATEGORY_GROUPS: Record<string, Omit<CategoryGroup, 'dbCategories'> & { matchPatterns: string[] }> = {
  roof_covering: {
    id: 'roof_covering',
    label: 'Roof Covering',
    icon: 'Home',
    color: 'bg-green-500',
    required: true,
    allowMultiple: true,
    description: 'Primary roofing material (shingles, tile, metal)',
    matchPatterns: [
      'shingle', 'metal roofing', 'metal tile', 'roof tile', 'tiles',
      'stone coated', 'roofing slate', 'roof_covering', 'metal'
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
      'flat roofing', 'flat_roof', 'single ply', 'modified bitumen',
      'built up roofing', 'spray applied', 'liquid applied',
      'roof coating', 'waterproofing', 'tpo', 'epdm', 'pvc'
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
    matchPatterns: ['underlayment', 'roofing insulation', 'insulation'],
  },
  deck_fasteners: {
    id: 'deck_fasteners',
    label: 'Deck Fasteners',
    icon: 'Hammer',
    color: 'bg-orange-500',
    required: true,
    allowMultiple: false,
    description: 'Nails or screws for attaching to deck',
    matchPatterns: ['deck fastener', 'deck - roof', 'deck - floor'],
  },
  cap_tabs: {
    id: 'cap_tabs',
    label: 'Cap Tabs / Caps',
    icon: 'CircleDot',
    color: 'bg-yellow-500',
    required: true,
    allowMultiple: false,
    description: 'Tin tabs, plastic or metal caps',
    matchPatterns: ['cap tab', 'tin cap', 'cap'],
  },
  roofing_fasteners: {
    id: 'roofing_fasteners',
    label: 'Roofing Fasteners',
    icon: 'Hammer',
    color: 'bg-red-500',
    required: true,
    allowMultiple: false,
    description: 'For attaching roof covering',
    matchPatterns: ['roofing fastener', 'fastener'],
  },
  ventilation: {
    id: 'ventilation',
    label: 'Ventilation',
    icon: 'Layers',
    color: 'bg-teal-500',
    required: false,
    allowMultiple: true,
    description: 'Ridge vents, turbines, and roof ventilation',
    matchPatterns: ['ventilation', 'vent'],
  },
  sealants: {
    id: 'sealants',
    label: 'Sealants & Adhesives',
    icon: 'Layers',
    color: 'bg-indigo-500',
    required: false,
    allowMultiple: true,
    description: 'Roof sealants, adhesives, and flashing',
    matchPatterns: ['sealant', 'adhesive', 'flashing'],
  },
  skylights: {
    id: 'skylights',
    label: 'Skylights',
    icon: 'Layers',
    color: 'bg-cyan-500',
    required: false,
    allowMultiple: true,
    description: 'Skylights and roof windows',
    matchPatterns: ['skylight'],
  },
  gutters: {
    id: 'gutters',
    label: 'Gutters & Downspouts',
    icon: 'Layers',
    color: 'bg-slate-500',
    required: false,
    allowMultiple: true,
    description: 'Gutter systems and downspouts',
    matchPatterns: ['gutter', 'downspout'],
  },
};

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('product_approvals')
          .select('product_category')
          .not('product_category', 'is', null)
          .not('product_category', 'eq', '');

        if (fetchError) throw fetchError;

        // Count occurrences of each category
        const categoryMap: Record<string, number> = {};
        (data || []).forEach((row) => {
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
