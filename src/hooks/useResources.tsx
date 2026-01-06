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
  // === LICENSING & BUSINESS (5) ===
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
    id: "start-contracting-business",
    category_id: "1",
    title: "How to Start a Contracting Business",
    description: "From LLC formation to getting your first customers - a complete startup guide for new contractors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["business", "startup", "licensing"],
    is_premium: false,
    is_published: true,
    view_count: 9800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },
  {
    id: "contractor-bonds-explained",
    category_id: "1",
    title: "Contractor Bonds Explained",
    description: "Understanding surety bonds, license bonds, and performance bonds - when you need them and how to get them.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["bonds", "licensing", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 6200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },
  {
    id: "nascla-exam-prep",
    category_id: "1",
    title: "NASCLA Exam Prep Tips",
    description: "Study strategies, practice questions, and tips from contractors who passed the NASCLA exam.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["nascla", "exam", "licensing"],
    is_premium: true,
    is_published: true,
    view_count: 4500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },
  {
    id: "moving-business-new-state",
    category_id: "1",
    title: "Moving Your Contractor Business to a New State",
    description: "Reciprocity agreements, re-licensing requirements, and tips for contractors relocating their business.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["reciprocity", "licensing", "relocation"],
    is_premium: false,
    is_published: true,
    view_count: 3200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },

  // === INSURANCE GUIDE (6) ===
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
    id: "umbrella-insurance-guide",
    category_id: "2",
    title: "Do You Need Umbrella Insurance?",
    description: "When umbrella policies make sense, coverage limits, and cost-benefit analysis for contractors.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "umbrella", "coverage"],
    is_premium: false,
    is_published: true,
    view_count: 4100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "insurance-coverage-amounts",
    category_id: "2",
    title: "How Much Insurance Do Contractors Really Need?",
    description: "Coverage recommendations based on trade, project size, and risk factors.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "coverage", "liability"],
    is_premium: false,
    is_published: true,
    view_count: 6800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "filing-insurance-claims",
    category_id: "2",
    title: "Filing Insurance Claims Step-by-Step",
    description: "How to document damage, file claims, and work with adjusters to get fair settlements.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "claims", "documentation"],
    is_premium: false,
    is_published: true,
    view_count: 7300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "insurance-certificates-checklist",
    category_id: "2",
    title: "Insurance Certificates: What Clients Need to See",
    description: "Checklist of insurance documentation to provide clients and how to explain your coverage.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "certificates", "documentation"],
    is_premium: false,
    is_published: true,
    view_count: 3900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },

  // === PERMITS & CODES (6) ===
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
    id: "ibc-code-understanding",
    category_id: "3",
    title: "Understanding the International Building Code (IBC)",
    description: "Key IBC requirements every contractor should know, with practical examples.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["ibc", "building codes", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 4800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "common-permit-violations",
    category_id: "3",
    title: "Common Permit Violations to Avoid",
    description: "Top 10 permit violations inspectors catch and how to prevent them.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["permits", "violations", "inspections"],
    is_premium: false,
    is_published: true,
    view_count: 8100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "working-with-inspectors",
    category_id: "3",
    title: "Working with Building Inspectors",
    description: "Tips for preparing for inspections and building positive relationships with inspectors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["inspections", "permits", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 5200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "permit-fee-calculator",
    category_id: "3",
    title: "Permit Fee Calculator by Project Type",
    description: "Estimate permit costs for roofing, electrical, plumbing, and general construction projects.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["permits", "fees", "calculator"],
    is_premium: false,
    is_published: true,
    view_count: 9400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "florida-building-code-2024",
    category_id: "3",
    title: "Florida Building Code Updates 2024",
    description: "Key changes in the 2024 Florida Building Code and how they affect contractors.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["FL"],
    tags: ["florida", "building codes", "updates"],
    is_premium: false,
    is_published: true,
    view_count: 7600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },

  // === PRODUCT KNOWLEDGE - ROOFING (6) ===
  {
    id: "roofing-shingle-types",
    category_id: "4",
    title: "Roofing Shingle Types Compared",
    description: "Complete guide comparing asphalt, architectural, tile, and metal roofing options with pros, cons, and pricing.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "GAF Shingle Guide", url: "https://gaf.com" }],
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["roofing", "shingles", "materials"],
    is_premium: false,
    is_published: true,
    view_count: 11200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roof-underlayment-options",
    category_id: "4",
    title: "Understanding Roof Underlayment Options",
    description: "Synthetic vs felt underlayment - when to use each and installation best practices.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "underlayment", "materials"],
    is_premium: false,
    is_published: true,
    view_count: 4300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "flashing-installation",
    category_id: "4",
    title: "Flashing Installation Best Practices",
    description: "Proper flashing techniques for valleys, chimneys, skylights, and wall intersections.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "flashing", "installation"],
    is_premium: false,
    is_published: true,
    view_count: 5800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roof-ventilation-systems",
    category_id: "4",
    title: "Roof Ventilation Systems Explained",
    description: "Ridge vents, soffit vents, and attic fans - calculating and installing proper ventilation.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "ventilation", "installation"],
    is_premium: false,
    is_published: true,
    view_count: 6100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "metal-vs-shingles",
    category_id: "4",
    title: "Metal Roofing vs Shingles: Complete Comparison",
    description: "Cost, durability, energy efficiency, and installation considerations for metal and shingle roofs.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example3",
    external_links: null,
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["roofing", "metal", "shingles", "comparison"],
    is_premium: false,
    is_published: true,
    view_count: 14500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roof-repair-estimation",
    category_id: "4",
    title: "Roof Repair Estimation Guide",
    description: "How to accurately estimate roof repairs including materials, labor, and overhead.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "estimation", "pricing"],
    is_premium: true,
    is_published: true,
    view_count: 8700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },

  // === PRODUCT KNOWLEDGE - PLUMBING (5) ===
  {
    id: "plumbing-pipe-types",
    category_id: "4",
    title: "Types of Plumbing Pipes: PVC, PEX, Copper",
    description: "Complete comparison of pipe materials including costs, durability, and best applications.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "pipes", "materials"],
    is_premium: false,
    is_published: true,
    view_count: 7200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "dwv-systems-explained",
    category_id: "4",
    title: "Understanding Drain-Waste-Vent (DWV) Systems",
    description: "How DWV systems work, sizing requirements, and common installation issues.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "dwv", "drainage"],
    is_premium: false,
    is_published: true,
    view_count: 4600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "water-heater-installation",
    category_id: "4",
    title: "Water Heater Installation Guide",
    description: "Tank vs tankless installation, code requirements, and troubleshooting common issues.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "water heater", "installation"],
    is_premium: false,
    is_published: true,
    view_count: 9100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "plumbing-repairs-pricing",
    category_id: "4",
    title: "Common Plumbing Repairs and Pricing",
    description: "Pricing guide for common plumbing repairs including labor rates and material costs.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "repairs", "pricing"],
    is_premium: true,
    is_published: true,
    view_count: 6400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "plumbing-fixture-standards",
    category_id: "4",
    title: "Plumbing Fixture Installation Standards",
    description: "Checklist of code-compliant fixture installation requirements and best practices.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "fixtures", "codes"],
    is_premium: false,
    is_published: true,
    view_count: 3800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },

  // === PRODUCT KNOWLEDGE - ELECTRICAL (5) ===
  {
    id: "nec-code-basics",
    category_id: "4",
    title: "NEC Code Basics for Contractors",
    description: "Essential National Electrical Code requirements every electrical contractor must know.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["electrical", "nec", "codes"],
    is_premium: false,
    is_published: true,
    view_count: 8900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "electrical-circuits-explained",
    category_id: "4",
    title: "Understanding Electrical Circuits",
    description: "Series vs parallel, load calculations, and circuit sizing fundamentals.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["electrical", "circuits", "fundamentals"],
    is_premium: false,
    is_published: true,
    view_count: 5500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "gfci-afci-guide",
    category_id: "4",
    title: "GFCI vs AFCI: Where and When to Use Each",
    description: "Code requirements for ground fault and arc fault protection in residential and commercial settings.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["electrical", "gfci", "afci", "safety"],
    is_premium: false,
    is_published: true,
    view_count: 7800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "panel-upgrades-guide",
    category_id: "4",
    title: "Panel Upgrades: 100A to 200A Guide",
    description: "Complete guide to upgrading electrical panels including permits, costs, and installation steps.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["electrical", "panels", "upgrades"],
    is_premium: false,
    is_published: true,
    view_count: 10300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "electrical-code-violations",
    category_id: "4",
    title: "Common Electrical Code Violations",
    description: "Top electrical code violations inspectors find and how to avoid them.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["electrical", "violations", "codes"],
    is_premium: false,
    is_published: true,
    view_count: 6700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },

  // === HOMEOWNER RESOURCES (6) ===
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
    id: "contractor-hiring-checklist",
    category_id: "5",
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
    category: sampleCategories[4]
  },
  {
    id: "roof-replacement-expectations",
    category_id: "5",
    title: "What to Expect During a Roof Replacement",
    description: "Timeline, noise levels, safety considerations, and how to prepare your home for a roof replacement.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["roofing", "homeowner", "preparation"],
    is_premium: false,
    is_published: true,
    view_count: 6200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "verify-contractor-license",
    category_id: "5",
    title: "How to Verify a Contractor's License",
    description: "Step-by-step guide to checking contractor licenses, insurance, and reputation.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["licensing", "verification", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 8500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "understanding-roofing-warranty",
    category_id: "5",
    title: "Understanding Your Roofing Warranty",
    description: "Manufacturer vs workmanship warranties, what's covered, and how to file claims.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["warranty", "roofing", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 5100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "signs-need-new-roof",
    category_id: "5",
    title: "Signs You Need a New Roof",
    description: "Visual inspection guide to help homeowners identify when roof replacement is needed.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["roofing", "inspection", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 11800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },

  // === VIDEO LIBRARY (5) ===
  {
    id: "roof-inspection-walkthrough",
    category_id: "6",
    title: "Roof Inspection Walkthrough",
    description: "Video tutorial on conducting thorough roof inspections for damage assessment.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example4",
    external_links: null,
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["roofing", "inspection", "video"],
    is_premium: false,
    is_published: true,
    view_count: 13200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "insurance-supplement-training",
    category_id: "6",
    title: "Insurance Supplement Training",
    description: "How to write and submit insurance supplements to maximize claim payouts.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example5",
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "supplements", "video"],
    is_premium: true,
    is_published: true,
    view_count: 8400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "how-to-measure-roof",
    category_id: "6",
    title: "How to Measure a Roof",
    description: "Complete video guide to measuring roofs for accurate material estimates.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example6",
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "measurement", "video"],
    is_premium: false,
    is_published: true,
    view_count: 15600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "sales-presentation-tips",
    category_id: "6",
    title: "Customer Sales Presentation Tips",
    description: "Techniques for presenting estimates and closing deals with homeowners.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example7",
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["sales", "presentation", "video"],
    is_premium: true,
    is_published: true,
    view_count: 6800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "jobsite-safety-video",
    category_id: "6",
    title: "Safety on the Jobsite",
    description: "OSHA requirements and best practices for maintaining safe work environments.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=example8",
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["safety", "osha", "video"],
    is_premium: false,
    is_published: true,
    view_count: 7200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },

  // === CHECKLISTS & TOOLS (4) ===
  {
    id: "pre-installation-checklist",
    category_id: "7",
    title: "Pre-Installation Checklist",
    description: "Complete checklist to run through before starting any installation project.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["checklist", "installation", "preparation"],
    is_premium: false,
    is_published: true,
    view_count: 5400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "jobsite-safety-checklist",
    category_id: "7",
    title: "Job Site Safety Checklist",
    description: "Daily safety checklist for contractors to ensure OSHA compliance.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["safety", "osha", "checklist"],
    is_premium: false,
    is_published: true,
    view_count: 4100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "material-ordering-calculator",
    category_id: "7",
    title: "Material Ordering Calculator",
    description: "Calculate material quantities and costs for roofing, siding, and general construction.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["calculator", "materials", "estimation"],
    is_premium: false,
    is_published: true,
    view_count: 12100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "final-walkthrough-checklist",
    category_id: "7",
    title: "Final Walkthrough Checklist",
    description: "Ensure project completion with this comprehensive final inspection checklist.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["checklist", "inspection", "completion"],
    is_premium: false,
    is_published: true,
    view_count: 6300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },

  // === STATE REQUIREMENTS (4) ===
  {
    id: "florida-contractor-license",
    category_id: "8",
    title: "Florida Contractor License Requirements",
    description: "Complete guide to licensing requirements, fees, and application process in Florida.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "FL DBPR", url: "https://www.myfloridalicense.com" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["FL"],
    tags: ["florida", "licensing", "requirements"],
    is_premium: false,
    is_published: true,
    view_count: 9700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "texas-contractor-regulations",
    category_id: "8",
    title: "Texas Contractor Regulations",
    description: "Understanding Texas contractor regulations, local licensing, and TRCC requirements.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["TX"],
    tags: ["texas", "licensing", "requirements"],
    is_premium: false,
    is_published: true,
    view_count: 6800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "california-cslb-guide",
    category_id: "8",
    title: "California CSLB License Guide",
    description: "Step-by-step guide to obtaining and maintaining a California contractor license.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "CSLB Website", url: "https://www.cslb.ca.gov" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["CA"],
    tags: ["california", "cslb", "licensing"],
    is_premium: false,
    is_published: true,
    view_count: 8200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "georgia-contractor-licensing",
    category_id: "8",
    title: "Georgia Contractor Licensing Overview",
    description: "Georgia licensing requirements including local jurisdictions and state certifications.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: null,
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["GA"],
    tags: ["georgia", "licensing", "requirements"],
    is_premium: false,
    is_published: true,
    view_count: 4500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
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
