import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Resource, ResourceCategory } from './useResources';

export interface ResourceFormData {
  title: string;
  category_id: string;
  resource_type: string;
  target_audience: string;
  description: string;
  content: string;
  video_url: string;
  external_links: { title: string; url: string }[];
  thumbnail_url: string;
  tags: string[];
  state_specific: string[];
  is_premium: boolean;
  is_published: boolean;
}

// Sample data for admin management (mirrors useResources.tsx)
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

// Import sample resources from a shared location or define inline
const getSampleResources = (): Resource[] => {
  // This matches the sample data from useResources.tsx
  return [
    { id: "fl-licensing-guide", category_id: "1", title: "Complete Guide to Contractor Licensing in Florida", description: "Everything you need to know about getting licensed as a contractor in Florida.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example", external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["FL"], tags: ["licensing", "florida"], is_premium: false, is_published: true, view_count: 12400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[0] },
    { id: "start-contracting-business", category_id: "1", title: "How to Start a Contracting Business", description: "From LLC formation to getting your first customers.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["business", "startup"], is_premium: false, is_published: true, view_count: 9800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[0] },
    { id: "contractor-bonds-explained", category_id: "1", title: "Contractor Bonds Explained", description: "Understanding surety bonds, license bonds, and performance bonds.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["bonds", "licensing"], is_premium: false, is_published: true, view_count: 6200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[0] },
    { id: "nascla-exam-prep", category_id: "1", title: "NASCLA Exam Prep Tips", description: "Study strategies and tips from contractors who passed.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["nascla", "exam"], is_premium: true, is_published: true, view_count: 4500, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[0] },
    { id: "moving-business-new-state", category_id: "1", title: "Moving Your Contractor Business to a New State", description: "Reciprocity agreements and re-licensing requirements.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["reciprocity", "licensing"], is_premium: false, is_published: true, view_count: 3200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[0] },
    { id: "gl-insurance-explained", category_id: "2", title: "Understanding General Liability Insurance", description: "What GL covers, what it doesn't, and how much you need.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "gl"], is_premium: false, is_published: true, view_count: 8200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "workers-comp-guide", category_id: "2", title: "Workers' Compensation Requirements by State", description: "State-by-state breakdown of workers' compensation requirements.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "workers comp"], is_premium: false, is_published: true, view_count: 5400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "umbrella-insurance-guide", category_id: "2", title: "Do You Need Umbrella Insurance?", description: "When umbrella policies make sense for contractors.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "umbrella"], is_premium: false, is_published: true, view_count: 4100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "insurance-coverage-amounts", category_id: "2", title: "How Much Insurance Do Contractors Really Need?", description: "Coverage recommendations based on trade and risk factors.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "coverage"], is_premium: false, is_published: true, view_count: 6800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "filing-insurance-claims", category_id: "2", title: "Filing Insurance Claims Step-by-Step", description: "How to document damage and work with adjusters.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "claims"], is_premium: false, is_published: true, view_count: 7300, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "insurance-certificates-checklist", category_id: "2", title: "Insurance Certificates: What Clients Need to See", description: "Checklist of insurance documentation to provide clients.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "certificates"], is_premium: false, is_published: true, view_count: 3900, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[1] },
    { id: "permit-process-101", category_id: "3", title: "Building Permits Step-by-Step", description: "Complete walkthrough of the permit application process.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "both", state_specific: null, tags: ["permits", "building codes"], is_premium: false, is_published: true, view_count: 6500, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "ibc-code-understanding", category_id: "3", title: "Understanding the International Building Code (IBC)", description: "Key IBC requirements every contractor should know.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["ibc", "building codes"], is_premium: false, is_published: true, view_count: 4800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "common-permit-violations", category_id: "3", title: "Common Permit Violations to Avoid", description: "Top 10 permit violations inspectors catch.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["permits", "violations"], is_premium: false, is_published: true, view_count: 8100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "working-with-inspectors", category_id: "3", title: "Working with Building Inspectors", description: "Tips for preparing for inspections.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["inspections", "permits"], is_premium: false, is_published: true, view_count: 5200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "permit-fee-calculator", category_id: "3", title: "Permit Fee Calculator by Project Type", description: "Estimate permit costs for various projects.", content: null, resource_type: "tool", video_url: null, external_links: null, thumbnail_url: null, target_audience: "both", state_specific: null, tags: ["permits", "calculator"], is_premium: false, is_published: true, view_count: 9400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "florida-building-code-2024", category_id: "3", title: "Florida Building Code Updates 2024", description: "Key changes in the 2024 Florida Building Code.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["FL"], tags: ["florida", "building codes"], is_premium: false, is_published: true, view_count: 7600, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[2] },
    { id: "roofing-shingle-types", category_id: "4", title: "Roofing Shingle Types Compared", description: "Complete guide comparing asphalt, architectural, tile, and metal roofing.", content: null, resource_type: "guide", video_url: null, external_links: [{ title: "GAF Shingle Guide", url: "https://gaf.com" }], thumbnail_url: null, target_audience: "both", state_specific: null, tags: ["roofing", "shingles"], is_premium: false, is_published: true, view_count: 11200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "roof-underlayment-options", category_id: "4", title: "Understanding Roof Underlayment Options", description: "Synthetic vs felt underlayment comparison.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["roofing", "underlayment"], is_premium: false, is_published: true, view_count: 4300, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "flashing-installation", category_id: "4", title: "Flashing Installation Best Practices", description: "Proper flashing techniques for valleys, chimneys, and skylights.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["roofing", "flashing"], is_premium: false, is_published: true, view_count: 5800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "roof-ventilation-systems", category_id: "4", title: "Roof Ventilation Systems Explained", description: "Ridge vents, soffit vents, and attic fans guide.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["roofing", "ventilation"], is_premium: false, is_published: true, view_count: 6100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "metal-vs-shingles", category_id: "4", title: "Metal Roofing vs Shingles: Complete Comparison", description: "Cost, durability, and installation considerations.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example3", external_links: null, thumbnail_url: null, target_audience: "both", state_specific: null, tags: ["roofing", "metal"], is_premium: false, is_published: true, view_count: 8700, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "roof-repair-estimation", category_id: "4", title: "Roof Repair Estimation Guide", description: "How to estimate repair costs accurately.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["roofing", "estimation"], is_premium: true, is_published: true, view_count: 7200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "plumbing-pipes-types", category_id: "4", title: "Types of Plumbing Pipes: PVC, PEX, Copper", description: "Complete guide to plumbing pipe materials.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["plumbing", "pipes"], is_premium: false, is_published: true, view_count: 6400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "dwv-systems-guide", category_id: "4", title: "Understanding Drain-Waste-Vent (DWV) Systems", description: "Complete DWV system design and installation guide.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["plumbing", "dwv"], is_premium: false, is_published: true, view_count: 4900, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "water-heater-installation", category_id: "4", title: "Water Heater Installation Guide", description: "Tank vs tankless installation best practices.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["plumbing", "water heater"], is_premium: false, is_published: true, view_count: 5600, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "common-plumbing-repairs", category_id: "4", title: "Common Plumbing Repairs and Pricing", description: "Pricing guide for common plumbing repairs.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["plumbing", "pricing"], is_premium: false, is_published: true, view_count: 7100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "plumbing-fixture-standards", category_id: "4", title: "Plumbing Fixture Installation Standards", description: "Checklist for proper fixture installation.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["plumbing", "fixtures"], is_premium: false, is_published: true, view_count: 3800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "nec-code-basics", category_id: "4", title: "NEC Code Basics for Contractors", description: "Essential National Electrical Code requirements.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["electrical", "nec"], is_premium: false, is_published: true, view_count: 8300, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "electrical-circuits-101", category_id: "4", title: "Understanding Electrical Circuits", description: "Fundamentals of residential electrical circuits.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["electrical", "circuits"], is_premium: false, is_published: true, view_count: 5200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "gfci-afci-guide", category_id: "4", title: "GFCI vs AFCI: Where and When to Use Each", description: "Requirements and best practices for GFCI and AFCI protection.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["electrical", "gfci"], is_premium: false, is_published: true, view_count: 6700, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "panel-upgrades-guide", category_id: "4", title: "Panel Upgrades: 100A to 200A Guide", description: "Complete guide to residential panel upgrades.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["electrical", "panel"], is_premium: true, is_published: true, view_count: 4400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "electrical-code-violations", category_id: "4", title: "Common Electrical Code Violations", description: "Top electrical violations inspectors catch.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["electrical", "violations"], is_premium: false, is_published: true, view_count: 9100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[3] },
    { id: "roofing-101-homeowners", category_id: "5", title: "Roofing 101 for Homeowners", description: "Everything homeowners need to know about roofing.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example4", external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["roofing", "homeowner"], is_premium: false, is_published: true, view_count: 15400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "questions-before-hiring", category_id: "5", title: "25 Questions to Ask Before Hiring a Contractor", description: "Essential questions every homeowner should ask.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["hiring", "homeowner"], is_premium: false, is_published: true, view_count: 12800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "roof-replacement-expectations", category_id: "5", title: "What to Expect During a Roof Replacement", description: "Timeline, process, and what homeowners should prepare for.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["roofing", "homeowner"], is_premium: false, is_published: true, view_count: 9600, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "verify-contractor-license", category_id: "5", title: "How to Verify a Contractor's License", description: "Step-by-step guide to checking license validity.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["licensing", "homeowner"], is_premium: false, is_published: true, view_count: 7200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "roofing-warranty-guide", category_id: "5", title: "Understanding Your Roofing Warranty", description: "Workmanship vs manufacturer warranties explained.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["warranty", "homeowner"], is_premium: false, is_published: true, view_count: 6100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "signs-need-new-roof", category_id: "5", title: "Signs You Need a New Roof", description: "Warning signs that indicate roof replacement is needed.", content: null, resource_type: "article", video_url: null, external_links: null, thumbnail_url: null, target_audience: "homeowner", state_specific: null, tags: ["roofing", "homeowner"], is_premium: false, is_published: true, view_count: 11300, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[4] },
    { id: "roof-inspection-walkthrough", category_id: "6", title: "Roof Inspection Walkthrough", description: "Complete video guide to performing roof inspections.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example5", external_links: null, thumbnail_url: null, target_audience: "both", state_specific: null, tags: ["inspection", "video"], is_premium: false, is_published: true, view_count: 8900, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[5] },
    { id: "insurance-supplement-training", category_id: "6", title: "Insurance Supplement Training", description: "How to maximize insurance claim supplements.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example6", external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["insurance", "supplements"], is_premium: true, is_published: true, view_count: 6200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[5] },
    { id: "how-to-measure-roof", category_id: "6", title: "How to Measure a Roof", description: "Video tutorial on accurate roof measurement.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example7", external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["measurement", "video"], is_premium: false, is_published: true, view_count: 10500, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[5] },
    { id: "sales-presentation-tips", category_id: "6", title: "Customer Sales Presentation Tips", description: "How to present estimates and close sales.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example8", external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["sales", "video"], is_premium: true, is_published: true, view_count: 5800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[5] },
    { id: "jobsite-safety-video", category_id: "6", title: "Safety on the Jobsite", description: "Essential safety practices for construction sites.", content: null, resource_type: "video", video_url: "https://www.youtube.com/watch?v=example9", external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["safety", "video"], is_premium: false, is_published: true, view_count: 7400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[5] },
    { id: "pre-installation-checklist", category_id: "7", title: "Pre-Installation Checklist", description: "Complete checklist before starting any installation.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["checklist", "installation"], is_premium: false, is_published: true, view_count: 4200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[6] },
    { id: "jobsite-safety-checklist", category_id: "7", title: "Job Site Safety Checklist", description: "Daily safety checklist for construction sites.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["safety", "checklist"], is_premium: false, is_published: true, view_count: 5100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[6] },
    { id: "material-ordering-calculator", category_id: "7", title: "Material Ordering Calculator", description: "Calculate materials needed for roofing projects.", content: null, resource_type: "tool", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["calculator", "materials"], is_premium: false, is_published: true, view_count: 8600, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[6] },
    { id: "final-walkthrough-checklist", category_id: "7", title: "Final Walkthrough Checklist", description: "Ensure nothing is missed before job completion.", content: null, resource_type: "checklist", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: null, tags: ["checklist", "walkthrough"], is_premium: false, is_published: true, view_count: 3700, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[6] },
    { id: "florida-license-requirements", category_id: "8", title: "Florida Contractor License Requirements", description: "Complete guide to Florida contractor licensing.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["FL"], tags: ["florida", "licensing"], is_premium: false, is_published: true, view_count: 9800, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[7] },
    { id: "texas-contractor-regulations", category_id: "8", title: "Texas Contractor Regulations", description: "Understanding Texas contractor requirements.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["TX"], tags: ["texas", "licensing"], is_premium: false, is_published: true, view_count: 6400, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[7] },
    { id: "california-cslb-guide", category_id: "8", title: "California CSLB License Guide", description: "Complete guide to California State License Board requirements.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["CA"], tags: ["california", "cslb"], is_premium: false, is_published: true, view_count: 7200, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[7] },
    { id: "georgia-licensing-overview", category_id: "8", title: "Georgia Contractor Licensing Overview", description: "Georgia contractor licensing requirements and process.", content: null, resource_type: "guide", video_url: null, external_links: null, thumbnail_url: null, target_audience: "contractor", state_specific: ["GA"], tags: ["georgia", "licensing"], is_premium: false, is_published: true, view_count: 4100, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category: sampleCategories[7] },
  ];
};

export const useAdminResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      // For now, use sample data since we don't have a database table yet
      // When database is ready, replace with Supabase query
      const sampleData = getSampleResources();
      setResources(sampleData);
      setCategories(sampleCategories);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createResource = useCallback(async (data: ResourceFormData): Promise<boolean> => {
    try {
      const newResource: Resource = {
        id: `resource-${Date.now()}`,
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        content: data.content || null,
        resource_type: data.resource_type,
        video_url: data.video_url || null,
        external_links: data.external_links.length > 0 ? data.external_links : null,
        thumbnail_url: data.thumbnail_url || null,
        target_audience: data.target_audience,
        state_specific: data.state_specific.length > 0 ? data.state_specific : null,
        tags: data.tags.length > 0 ? data.tags : null,
        is_premium: data.is_premium,
        is_published: data.is_published,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: sampleCategories.find(c => c.id === data.category_id)
      };

      setResources(prev => [newResource, ...prev]);
      toast({
        title: "Success",
        description: "Resource created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const updateResource = useCallback(async (id: string, data: Partial<ResourceFormData>): Promise<boolean> => {
    try {
      setResources(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            ...data,
            external_links: data.external_links && data.external_links.length > 0 ? data.external_links : null,
            state_specific: data.state_specific && data.state_specific.length > 0 ? data.state_specific : null,
            tags: data.tags && data.tags.length > 0 ? data.tags : null,
            category: data.category_id ? sampleCategories.find(c => c.id === data.category_id) : r.category,
            updated_at: new Date().toISOString()
          };
        }
        return r;
      }));
      toast({
        title: "Success",
        description: "Resource updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const deleteResource = useCallback(async (id: string): Promise<boolean> => {
    try {
      setResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Success",
        description: "Resource deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const togglePublished = useCallback(async (id: string): Promise<boolean> => {
    try {
      setResources(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, is_published: !r.is_published, updated_at: new Date().toISOString() };
        }
        return r;
      }));
      return true;
    } catch (error) {
      console.error('Error toggling publish status:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Computed stats
  const stats = {
    total: resources.length,
    published: resources.filter(r => r.is_published).length,
    drafts: resources.filter(r => !r.is_published).length,
    premium: resources.filter(r => r.is_premium).length,
    videos: resources.filter(r => r.resource_type === 'video').length,
  };

  return {
    resources,
    categories,
    loading,
    stats,
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    togglePublished
  };
};
