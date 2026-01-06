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

// Static sample data with REAL external URLs
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
  // === LICENSING & BUSINESS ===
  {
    id: "license-guide-all-states",
    category_id: "1",
    title: "Complete Guide to Contractor Licensing (All 50 States)",
    description: "Comprehensive state-by-state breakdown of contractor license requirements, fees, and exam information.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Full Guide", url: "https://www.levelset.com/blog/general-contractor-license-requirements-state-by-state/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["licensing", "contractor", "requirements"],
    is_premium: false,
    is_published: true,
    view_count: 15400,
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
    external_links: [{ title: "Read Guide", url: "https://foyr.com/learn/general-contractor-license" }],
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
    external_links: [{ title: "Learn More", url: "https://www.harborcompliance.com/general-contractor-license" }],
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
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Resource", url: "https://www.getjobber.com/academy/general-contractor-license/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["nascla", "exam", "licensing"],
    is_premium: false,
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
    external_links: [{ title: "Read Article", url: "https://pro.houzz.com/pro-learn/blog/startup-guide-residential-construction-general-contractor-licensing-requirements-by-state" }],
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
  {
    id: "50-state-licensing-survey",
    category_id: "1",
    title: "50-State Contractors Licensing Survey (PDF)",
    description: "Comprehensive PDF document covering contractor licensing and contract requirements across all 50 states.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Download PDF", url: "https://www.procore.com/library/contractors-license-guide-all-states" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["licensing", "pdf", "all-states"],
    is_premium: false,
    is_published: true,
    view_count: 8100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[0]
  },

  // === INSURANCE GUIDE ===
  {
    id: "ultimate-insurance-guide",
    category_id: "2",
    title: "The Ultimate Insurance Guide for General Contractors",
    description: "Complete overview of GL, Workers' Comp, and Umbrella policies - what you need and why.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Read Full Guide", url: "https://ocmiworkerscomp.com/2025/04/the-ultimate-insurance-guide-for-general-contractors/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "gl", "workers comp"],
    is_premium: false,
    is_published: true,
    view_count: 11200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "umbrella-insurance-contractors",
    category_id: "2",
    title: "Umbrella Insurance for Contractors",
    description: "How umbrella insurance extends your coverage and can save you money on large claims.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Learn More", url: "https://www.levelset.com/blog/umbrella-insurance/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "umbrella", "coverage"],
    is_premium: false,
    is_published: true,
    view_count: 5400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "workers-comp-2025",
    category_id: "2",
    title: "Workers' Comp Insurance for Contractors (2025 Guide)",
    description: "Why workers' compensation is essential, how it differs from GL, and state requirements.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://www.allprocoverage.com/2025/07/11/workers-comp-insurance-for-contractors-2025-guide/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["workers comp", "insurance", "2025"],
    is_premium: false,
    is_published: true,
    view_count: 7800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "umbrella-liability-complete",
    category_id: "2",
    title: "Complete Guide to Umbrella Liability Insurance",
    description: "Extended coverage details for liability claims and how to protect your contracting business.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Read Guide", url: "https://hotchkissinsurance.com/insights-and-resources/the-complete-guide-to-umbrella-liability-insurance-for-contractors" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["umbrella", "liability", "insurance"],
    is_premium: false,
    is_published: true,
    view_count: 4100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "insurance-requirements-contractors",
    category_id: "2",
    title: "Insurance Requirements for Contractors",
    description: "Procurement and maintenance tips for contractor insurance policies.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "View Requirements", url: "https://finance.loyno.edu/risk/insurance-requirements-contractors" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "requirements", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 3600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },
  {
    id: "insurance-cost-guide",
    category_id: "2",
    title: "General Contractors Insurance Cost Guide",
    description: "Cost estimates and coverage breakdown for various types of contractor insurance.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "View Cost Guide", url: "https://honigconte.com/blog/business-insurance/general-contractors-insurance-guide/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "costs", "coverage"],
    is_premium: false,
    is_published: true,
    view_count: 6800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[1]
  },

  // === PERMITS & CODES ===
  {
    id: "building-code-compliance-steps",
    category_id: "3",
    title: "Essential Steps for Building Code Compliance",
    description: "Walkthrough of the permit application process and code compliance requirements.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Read Guide", url: "https://blog.pivla.com/essential-steps-for-building-code-compliance" }],
    thumbnail_url: null,
    target_audience: "contractor",
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
    id: "building-codes-faq",
    category_id: "3",
    title: "Building Codes FAQ - Congressional Research",
    description: "Official FAQ on building codes and their enforcement from Congressional Research Service.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "View FAQ", url: "https://www.congress.gov/crs-product/R47665" }],
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["building codes", "faq", "official"],
    is_premium: false,
    is_published: true,
    view_count: 4200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "new-building-construction",
    category_id: "3",
    title: "New Building Construction Permits Guide",
    description: "Step-by-step guide for obtaining permits for new construction projects.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://www.indy.gov/activity/new-building-construction" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["permits", "construction", "new building"],
    is_premium: false,
    is_published: true,
    view_count: 5100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "essential-permits-guide",
    category_id: "3",
    title: "Essential Guide to Building Permits",
    description: "Comprehensive guide to building permits and code compliance for contractors.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Read Article", url: "https://www.linkedin.com/pulse/essential-guide-building-permits-code-compliance-chris-nelson-nrba-c2ltc" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["permits", "compliance", "guide"],
    is_premium: false,
    is_published: true,
    view_count: 3800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "code-compliance-concepts",
    category_id: "3",
    title: "Building Code Compliance Concepts",
    description: "Understanding building codes and standards for construction professionals.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Learn More", url: "https://www.alooba.com/skills/concepts/building-codes-and-standards-159/code-compliance/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["building codes", "standards", "compliance"],
    is_premium: false,
    is_published: true,
    view_count: 2900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },
  {
    id: "building-code-book",
    category_id: "3",
    title: "Building Code Compliance for Contractors & Inspectors",
    description: "Comprehensive book based on IRC with inspection tips and code requirements.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Book", url: "https://craftsman-book.com/building-code-compliance-for-contractors-inspectors-book-ebook-pdf" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["building codes", "book", "inspections"],
    is_premium: false,
    is_published: true,
    view_count: 4700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[2]
  },

  // === PRODUCT KNOWLEDGE ===
  {
    id: "nccer-plumbing",
    category_id: "4",
    title: "NCCER Plumbing Craft Catalog",
    description: "Official NCCER plumbing curriculum and training resources for contractors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Catalog", url: "https://www.nccer.org/craft-catalog/plumbing/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "nccer", "training"],
    is_premium: false,
    is_published: true,
    view_count: 7200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roofers-pocket-guide",
    category_id: "4",
    title: "Roofer's Pocket Guide - Ventilation Systems",
    description: "Calculation and installation guide for roof vents and ventilation fans.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Download PDF", url: "https://qualityedge.com/wp-content/uploads/2024/02/INTROOFG0922.pdf" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "ventilation", "guide"],
    is_premium: false,
    is_published: true,
    view_count: 5800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "essential-roofing-books",
    category_id: "4",
    title: "Essential Roofing Books for Professionals",
    description: "Curated list of must-read books for roofing contractors and professionals.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "View List", url: "https://contractortrainingcenter.com/blogs/news/essential-roofing-books-for-professionals-contractors" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "books", "education"],
    is_premium: false,
    is_published: true,
    view_count: 3400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roofing-trade-topics",
    category_id: "4",
    title: "Roofing Trade Topics & Resources",
    description: "Comprehensive roofing resources covering materials, installation, and best practices.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Browse Topics", url: "https://www.buildersbook.com/trades-topics/roofing.html" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "materials", "installation"],
    is_premium: false,
    is_published: true,
    view_count: 4100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "plumbing-study-guide",
    category_id: "4",
    title: "Plumbing Study Guide (PDF)",
    description: "Comprehensive study guide covering DWV systems, fixture installation, and plumbing codes.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Download PDF", url: "https://www.lorisweb.com/CMGT235/DIS09/Plumbing_Study_Guide.pdf" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["plumbing", "study guide", "pdf"],
    is_premium: false,
    is_published: true,
    view_count: 6300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },
  {
    id: "roofing-contractor-study",
    category_id: "4",
    title: "Roofing Contractor Study Guide",
    description: "Exam preparation materials for roofing contractor licensing exams.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://theexampros.com/products/roofing-contractor-study-guide" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "exam", "study guide"],
    is_premium: false,
    is_published: true,
    view_count: 4800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[3]
  },

  // === HOMEOWNER RESOURCES ===
  {
    id: "tips-hiring-contractor",
    category_id: "5",
    title: "Top 8 Pro Tips on Hiring a Contractor",
    description: "Expert advice from This Old House on how to find and hire the right contractor for your project.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Read Article", url: "https://www.thisoldhouse.com/home-finances/top-8-pro-tips-on-how-to-hire-a-contractor" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["hiring", "tips", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 12800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "tips-best-contractor",
    category_id: "5",
    title: "Tips for Hiring the Best Contractor",
    description: "Comprehensive guide to finding, vetting, and selecting quality contractors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://porch.com/advice/tips-hiring-best-contractor-job" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["hiring", "vetting", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 8900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "questions-ask-contractor",
    category_id: "5",
    title: "25 Questions to Ask Before Hiring a Contractor",
    description: "Essential checklist of questions every homeowner should ask potential contractors.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: [{ title: "View Checklist", url: "https://goasher.com/home-improvement/questions-to-ask-a-contractor/" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["questions", "hiring", "checklist"],
    is_premium: false,
    is_published: true,
    view_count: 15200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "things-check-hiring",
    category_id: "5",
    title: "10 Things to Check Before Hiring a Contractor",
    description: "Essential verification checklist including licenses, insurance, and references.",
    content: null,
    resource_type: "checklist",
    video_url: null,
    external_links: [{ title: "View Checklist", url: "https://www.greatbuildz.com/blog/10-things-to-check-hiring-a-contractor/" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["verification", "hiring", "checklist"],
    is_premium: false,
    is_published: true,
    view_count: 11400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "hiring-contractor-guide",
    category_id: "5",
    title: "Complete Guide to Hiring a Contractor",
    description: "Step-by-step process for finding, evaluating, and working with contractors.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Read Guide", url: "https://www.meadowlarkbuilders.com/blog/hiring-a-contractor" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["hiring", "guide", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 7600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "homeowners-guide-hiring",
    category_id: "5",
    title: "A Homeowner's Guide to Hiring Contractors",
    description: "What you need to know before hiring a contractor for your home project.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://nelsonkb.com/a-homeowners-guide-to-hiring-contractors-what-you-need-to-know/" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["homeowner", "guide", "hiring"],
    is_premium: false,
    is_published: true,
    view_count: 5200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },
  {
    id: "habitat-hiring-guide",
    category_id: "5",
    title: "How to Hire a Contractor - Habitat Guide",
    description: "Trusted advice from Habitat for Humanity on selecting quality contractors.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Read Article", url: "https://www.habitatebsv.org/blog/how-to-hire-a-contractor" }],
    thumbnail_url: null,
    target_audience: "homeowner",
    state_specific: null,
    tags: ["hiring", "habitat", "homeowner"],
    is_premium: false,
    is_published: true,
    view_count: 4300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[4]
  },

  // === VIDEO LIBRARY ===
  {
    id: "how-measure-roof",
    category_id: "6",
    title: "How to Measure a Roof",
    description: "Complete video guide for accurate roof measurements and material estimates.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=hzFk8zdD8p0",
    external_links: [{ title: "Watch on YouTube", url: "https://www.youtube.com/watch?v=hzFk8zdD8p0" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "measurement", "video"],
    is_premium: false,
    is_published: true,
    view_count: 24500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "roof-inspection-walkthrough",
    category_id: "6",
    title: "Roof Inspection Walkthrough",
    description: "Video tutorial on conducting thorough roof inspections and damage assessment.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=DBYgsSWVJf4",
    external_links: [{ title: "Watch on YouTube", url: "https://www.youtube.com/watch?v=DBYgsSWVJf4" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "inspection", "video"],
    is_premium: false,
    is_published: true,
    view_count: 18700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "insurance-supplement-training",
    category_id: "6",
    title: "Insurance Supplement Training",
    description: "Learn how to write and submit insurance claims and supplements effectively.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=td33emILoyY",
    external_links: [{ title: "Watch on YouTube", url: "https://www.youtube.com/watch?v=td33emILoyY" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["insurance", "supplements", "training"],
    is_premium: false,
    is_published: true,
    view_count: 15200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "osha-jobsite-safety",
    category_id: "6",
    title: "OSHA Safety on the Jobsite",
    description: "Essential OSHA best practices for maintaining safe work environments.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/watch?v=hQQHXssmsOE",
    external_links: [{ title: "Watch on YouTube", url: "https://www.youtube.com/watch?v=hQQHXssmsOE" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["osha", "safety", "training"],
    is_premium: false,
    is_published: true,
    view_count: 21300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "roofing-contractor-playlist",
    category_id: "6",
    title: "Roofing Contractor Training Series",
    description: "Complete playlist covering contracts, best practices, and professional development.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/playlist?list=PLfp5xMUtFBehZmN28UB2hGZjRmlU4k6wb",
    external_links: [{ title: "View Playlist", url: "https://www.youtube.com/playlist?list=PLfp5xMUtFBehZmN28UB2hGZjRmlU4k6wb" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["roofing", "training", "playlist"],
    is_premium: false,
    is_published: true,
    view_count: 32100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },
  {
    id: "excellent-laborer-channel",
    category_id: "6",
    title: "The Excellent Laborer - Plumbing & Electrical Basics",
    description: "YouTube channel with homeowner-friendly explanations of plumbing and electrical work.",
    content: null,
    resource_type: "video",
    video_url: "https://www.youtube.com/c/TheExcellentLaborer",
    external_links: [{ title: "Visit Channel", url: "https://www.youtube.com/c/TheExcellentLaborer" }],
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["plumbing", "electrical", "tutorials"],
    is_premium: false,
    is_published: true,
    view_count: 28900,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[5]
  },

  // === CHECKLISTS & TOOLS ===
  {
    id: "contractor-calculators",
    category_id: "7",
    title: "General Contractor Calculators",
    description: "Online calculators for roofing, siding, and construction quantity and cost estimates.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Use Calculator", url: "https://www.arcsite.com/tools/general-contractor-calculators" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["calculator", "estimating", "tools"],
    is_premium: false,
    is_published: true,
    view_count: 19400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "templates-calculators",
    category_id: "7",
    title: "Free Contractor Templates & Calculators",
    description: "Collection of free business templates and calculators for contractors.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Browse Tools", url: "https://www.housecallpro.com/small-business/templates-calculators/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["templates", "calculators", "free"],
    is_premium: false,
    is_published: true,
    view_count: 14200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "construction-estimate-templates",
    category_id: "7",
    title: "Construction Estimate Templates",
    description: "Professional estimate templates for construction projects in Excel and PDF formats.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Get Templates", url: "https://www.smartsheet.com/content/construction-estimate-templates" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["templates", "estimates", "construction"],
    is_premium: false,
    is_published: true,
    view_count: 11800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "tradify-tools",
    category_id: "7",
    title: "Contractor Business Tools",
    description: "Free tools and resources for running a successful contracting business.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Explore Tools", url: "https://www.tradifyhq.com/tools" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["business", "tools", "free"],
    is_premium: false,
    is_published: true,
    view_count: 8700,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "spreadsheet-templates",
    category_id: "7",
    title: "Free Spreadsheet Templates",
    description: "Excel and Google Sheets templates for budgeting, scheduling, and project management.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Download Templates", url: "https://www.vertex42.com/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["spreadsheets", "templates", "excel"],
    is_premium: false,
    is_published: true,
    view_count: 16300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "contractor-estimate-template",
    category_id: "7",
    title: "Free Contractor Estimate Template",
    description: "Editable PDF template for creating professional contractor estimates.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Get Template", url: "https://www.getjobber.com/free-tools/estimate-template/contractor/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["estimate", "template", "free"],
    is_premium: false,
    is_published: true,
    view_count: 12600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },
  {
    id: "canva-checklists",
    category_id: "7",
    title: "Customizable Checklists",
    description: "Create customizable checklists and templates using Canva's free design tools.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "Create Checklist", url: "https://www.canva.com/checklists/templates/" }],
    thumbnail_url: null,
    target_audience: "both",
    state_specific: null,
    tags: ["checklists", "templates", "design"],
    is_premium: false,
    is_published: true,
    view_count: 9400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[6]
  },

  // === STATE REQUIREMENTS ===
  {
    id: "all-states-license-guide",
    category_id: "8",
    title: "50-State Contractor License Guide",
    description: "Complete guide to contractor licensing requirements in all 50 states.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Guide", url: "https://www.procore.com/library/contractors-license-guide-all-states" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["licensing", "all states", "guide"],
    is_premium: false,
    is_published: true,
    view_count: 22100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "compliance-smart-chart",
    category_id: "8",
    title: "Contractor License Compliance Smart Chart",
    description: "Interactive chart showing compliance requirements by state.",
    content: null,
    resource_type: "tool",
    video_url: null,
    external_links: [{ title: "View Chart", url: "https://www.wolterskluwer.com/en/expert-insights/general-contractor-business-license-compliance-requirements-smart-chart" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["compliance", "chart", "licensing"],
    is_premium: false,
    is_published: true,
    view_count: 15800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "license-requirements-by-state",
    category_id: "8",
    title: "General Contractor License Requirements by State",
    description: "State-by-state breakdown of licensing requirements, fees, and exam information.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "View Requirements", url: "https://www.thimble.com/blog/general-contractor-license-requirements-by-state" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["licensing", "state requirements", "fees"],
    is_premium: false,
    is_published: true,
    view_count: 18400,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "harbor-compliance-guide",
    category_id: "8",
    title: "General Contractor License Requirements",
    description: "Comprehensive guide to licensing requirements with state-specific information.",
    content: null,
    resource_type: "guide",
    video_url: null,
    external_links: [{ title: "Read Guide", url: "https://www.harborcompliance.com/general-contractor-license" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: null,
    tags: ["licensing", "compliance", "requirements"],
    is_premium: false,
    is_published: true,
    view_count: 12300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "florida-dbpr",
    category_id: "8",
    title: "Florida DBPR - Contractor Licensing",
    description: "Official Florida Department of Business and Professional Regulation contractor licensing information.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Visit DBPR", url: "https://www.myfloridalicense.com/intentions2.asp?chession=&profession=3&profession=3&SID=&ession=INTENTSELECT" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["FL"],
    tags: ["florida", "licensing", "official"],
    is_premium: false,
    is_published: true,
    view_count: 14600,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
  {
    id: "california-cslb",
    category_id: "8",
    title: "California CSLB - Contractors State License Board",
    description: "Official California Contractors State License Board for licensing and verification.",
    content: null,
    resource_type: "article",
    video_url: null,
    external_links: [{ title: "Visit CSLB", url: "https://www.cslb.ca.gov/" }],
    thumbnail_url: null,
    target_audience: "contractor",
    state_specific: ["CA"],
    tags: ["california", "licensing", "official"],
    is_premium: false,
    is_published: true,
    view_count: 16200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: sampleCategories[7]
  },
];

export const useResources = (options: UseResourcesOptions = {}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>(sampleCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        // Filter sample resources based on options
        let filtered = [...sampleResources].filter(r => r.is_published);

        if (options.category) {
          const categoryObj = sampleCategories.find(c => c.slug === options.category);
          if (categoryObj) {
            filtered = filtered.filter(r => r.category_id === categoryObj.id);
          }
        }

        if (options.type) {
          filtered = filtered.filter(r => r.resource_type === options.type);
        }

        if (options.audience) {
          filtered = filtered.filter(r => 
            r.target_audience === options.audience || r.target_audience === 'both'
          );
        }

        if (options.state) {
          filtered = filtered.filter(r => 
            !r.state_specific || r.state_specific.includes(options.state!)
          );
        }

        if (options.search) {
          const searchLower = options.search.toLowerCase();
          filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(searchLower) ||
            r.description?.toLowerCase().includes(searchLower) ||
            r.tags?.some(t => t.toLowerCase().includes(searchLower))
          );
        }

        if (options.premiumOnly) {
          filtered = filtered.filter(r => r.is_premium);
        }

        if (options.limit) {
          filtered = filtered.slice(0, options.limit);
        }

        // Sort by view count (most popular first)
        filtered.sort((a, b) => b.view_count - a.view_count);

        setResources(filtered);
        setCategories(sampleCategories);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [options.category, options.type, options.audience, options.state, options.search, options.premiumOnly, options.limit]);

  const getResourceById = (id: string): Resource | undefined => {
    return sampleResources.find(r => r.id === id);
  };

  const getCategoryBySlug = (slug: string): ResourceCategory | undefined => {
    return sampleCategories.find(c => c.slug === slug);
  };

  const getFeaturedResources = (limit: number = 6): Resource[] => {
    return [...sampleResources]
      .filter(r => r.is_published)
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, limit);
  };

  return {
    resources,
    categories,
    loading,
    error,
    getResourceById,
    getCategoryBySlug,
    getFeaturedResources
  };
};
