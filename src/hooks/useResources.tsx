import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResourceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  resource_type: string;
  video_url: string | null;
  external_links: { title: string; url: string }[] | null;
  thumbnail_url: string | null;
  target_audience: string;
  state_specific: string[] | null;
  tags: string[] | null;
  is_premium: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  category?: ResourceCategory;
}

interface UseResourcesOptions {
  category?: string;
  type?: string;
  audience?: string;
  state?: string;
  search?: string;
  premiumOnly?: boolean;
  limit?: number;
}

// Static sample data until database is populated
const sampleCategories: ResourceCategory[] = [
  { id: "1", name: "Licensing & Business", description: "State requirements, exams, bonds, reciprocity guides", icon: "ClipboardList", slug: "licensing", sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: "2", name: "Insurance Guide", description: "GL, Workers' Comp, Umbrella policies explained", icon: "Shield", slug: "insurance", sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: "3", name: "Permits & Codes", description: "Building codes, permit processes, compliance", icon: "Building", slug: "permits", sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: "4", name: "Product Knowledge", description: "Trade-specific guides for roofing, plumbing, electrical", icon: "Wrench", slug: "products", sort_order: 4, is_active: true, created_at: new Date().toISOString() },
  { id: "5", name: "Homeowner Resources", description: "Hiring tips, Q&A, project expectations", icon: "Home", slug: "homeowner", sort_order: 5, is_active: true, created_at: new Date().toISOString() },
  { id: "6", name: "Video Library", description: "Tutorials, demos, expert interviews", icon: "Video", slug: "videos", sort_order: 6, is_active: true, created_at: new Date().toISOString() },
  { id: "7", name: "Checklists & Tools", description: "Downloadable templates, calculators", icon: "CheckSquare", slug: "checklists", sort_order: 7, is_active: true, created_at: new Date().toISOString() },
  { id: "8", name: "State Requirements", description: "State-by-state licensing and compliance", icon: "MapPin", slug: "states", sort_order: 8, is_active: true, created_at: new Date().toISOString() },
];

const sampleResources: Resource[] = [
  {
    id: "fl-licensing-guide",
    category_id: "1",
    title: "Complete Guide to Contractor Licensing in Florida",
    description: "Everything you need to know about getting licensed as a contractor in Florida, including exam prep, requirements, and reciprocity.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example",
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["FL"],
    tags: ["licensing", "florida", "contractor"],
    is_premium: false,
    is_published: true,
    view_count: 12400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },
  {
    id: "gl-insurance-explained",
    category_id: "2",
    title: "Understanding General Liability Insurance",
    description: "What GL covers, what it doesn't, and how much you actually need.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "gl", "liability"],
    is_premium: false,
    is_published: true,
    view_count: 8200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "permit-process-101",
    category_id: "3",
    title: "Building Permits Step-by-Step",
    description: "A complete walkthrough of the permit application process from start to finish.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["permits", "building codes", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 6500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "roofing-homeowner-101",
    category_id: "5",
    title: "Roofing 101 for Homeowners",
    description: "Everything homeowners need to know before hiring a roofer.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example2",
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["roofing", "homeowner", "hiring"],
    is_premium: false,
    is_published: true,
    view_count: 9800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "workers-comp-guide",
    category_id: "2",
    title: "Workers' Compensation Requirements by State",
    description: "State-by-state breakdown of workers' compensation requirements for contractors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "workers comp", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 5400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "contractor-hiring-checklist",
    category_id: "7",
    title: "25 Questions to Ask Before Hiring a Contractor",
    description: "Essential checklist for homeowners to vet contractors before signing a contract.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["hiring", "checklist", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 7800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
];

export const useResources = (options: UseResourcesOptions = {}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use sample data for now - will be replaced with DB calls once tables exist
      setCategories(sampleCategories);
      
      let filteredResources = [...sampleResources];
      
      if (options.category) {
        const cat = sampleCategories.find(c => c.slug === options.category);
        if (cat) {
          filteredResources = filteredResources.filter(r => r.category_id === cat.id);
        }
      }
      
      if (options.type) {
        filteredResources = filteredResources.filter(r => r.resource_type === options.type);
      }
      
      if (options.audience && options.audience !== 'both') {
        filteredResources = filteredResources.filter(r => 
          r.target_audience === options.audience || r.target_audience === 'both'
        );
      }
      
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredResources = filteredResources.filter(r => 
          r.title.toLowerCase().includes(searchLower) || 
          r.description?.toLowerCase().includes(searchLower)
        );
      }
      
      if (options.limit) {
        filteredResources = filteredResources.slice(0, options.limit);
      }
      
      // Sort by view count
      filteredResources.sort((a, b) => b.view_count - a.view_count);
      
      setResources(filteredResources);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourceBySlug = async (slug: string): Promise<Resource | null> => {
    const resource = sampleResources.find(r => r.id === slug);
    return resource || null;
  };

  const incrementViewCount = async (resourceId: string) => {
    // Will be implemented when DB tables exist
    console.log('View count increment for:', resourceId);
  };

  useEffect(() => {
    fetchData();
  }, [options.category, options.type, options.audience, options.state, options.search, options.limit]);

  return {
    resources,
    categories,
    loading,
    error,
    fetchResources: fetchData,
    getResourceBySlug,
    incrementViewCount
  };
};
