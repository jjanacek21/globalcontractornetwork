// ============================================
// PACKAGE PRICING - SINGLE SOURCE OF TRUTH
// ============================================
// All package pricing MUST be imported from this file.
// DO NOT duplicate pricing logic elsewhere.

export interface PackageLineItem {
  description: string;
  included: boolean;
}

export interface PackageAllowance {
  description: string;
  limit: string;
}

export interface PackageConfig {
  id: string;
  name: string;
  displayName: string;
  tier: "economy" | "standard" | "premium" | "luxury";
  category: "shingle" | "metal" | "tile";
  priceLow: number;  // Per square
  priceHigh: number; // Per square
  lineItems: PackageLineItem[];
  allowances: PackageAllowance[];
  warranty: string;
  installDays: string;
  benefits: string[];
  idealFor: string[];
  highlights: string[];
  isPopular?: boolean;
  color: string; // For PDF branding
}

// Updated pricing as of January 2026
export const PACKAGE_CONFIGS: PackageConfig[] = [
  {
    id: "bronze",
    name: "Bronze Roof Package",
    displayName: "Bronze",
    tier: "economy",
    category: "shingle",
    priceLow: 575,
    priceHigh: 650,
    lineItems: [
      { description: "Architectural Shingles (3-Tab Upgrade Available)", included: true },
      { description: "Synthetic Underlayment for Enhanced Water Resistance", included: true },
      { description: "Ridge Vent System for Improved Attic Ventilation", included: true },
      { description: "Code-Compliant Drip Edge & Flashing", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "5-Year Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 3 Sheets" },
      { description: "Fascia Repair", limit: "Up to 10 LF" },
    ],
    warranty: "5-year workmanship, 20-25 year materials",
    installDays: "1-2 days",
    benefits: [
      "Quick installation (1-2 days for average homes)",
      "Energy-efficient enough to potentially lower minor insurance premiums",
      "Standard warranty (20-25 years on materials)",
      "Minimal disruption during installation"
    ],
    idealFor: [
      "Budget-conscious homeowners",
      "Roofs in solid or needs-work condition",
      "Short-term stays (1-7 years)",
      "1-story homes without active leaks"
    ],
    highlights: [
      "Most affordable option",
      "Quick turnaround",
      "Proven materials"
    ],
    color: "#CD7F32"
  },
  {
    id: "silver",
    name: "Silver Roof Package",
    displayName: "Silver",
    tier: "standard",
    category: "shingle",
    priceLow: 700,
    priceHigh: 725,
    lineItems: [
      { description: "Premium Architectural Shingles", included: true },
      { description: "Standard Peel-and-Stick Underlayment", included: true },
      { description: "Ridge Vents or Gooseneck Vents (with additional vents as needed)", included: true },
      { description: "Ice & Water Shield at Eaves and Valleys", included: true },
      { description: "Code-Compliant Drip Edge & Flashing", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "10-Year Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 5 Sheets" },
      { description: "Fascia Repair", limit: "Up to 25 LF" },
    ],
    warranty: "10-year workmanship, 25-30 year materials",
    installDays: "2-3 days",
    benefits: [
      "Improved aesthetics for home value boost",
      "25-30 year warranty on materials",
      "Better storm resistance than economy options",
      "Versatile for most climates"
    ],
    idealFor: [
      "Homeowners seeking reliable protection without luxury extras",
      "7-15 year stays",
      "Storm protection concerns",
      "1-2 story homes"
    ],
    highlights: [
      "Best value for most homeowners",
      "Enhanced storm protection",
      "Longer warranty"
    ],
    isPopular: true,
    color: "#C0C0C0"
  },
  {
    id: "gold",
    name: "Gold Roof Package",
    displayName: "Gold",
    tier: "premium",
    category: "shingle",
    priceLow: 800,
    priceHigh: 850,
    lineItems: [
      { description: "Premium Architectural Shingles with Enhanced Durability", included: true },
      { description: "High-Temperature Peel-and-Stick Underlayment", included: true },
      { description: "Solar Attic Fan for Energy-Efficient Ventilation", included: true },
      { description: "Ice & Water Shield at All Critical Penetrations", included: true },
      { description: "6-Inch Seamless Gutters with Downspouts", included: true },
      { description: "Premium Drip Edge & Flashing Package", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "Lifetime Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 7 Sheets" },
      { description: "Fascia Repair & Painting", limit: "Up to 30 LF" },
    ],
    warranty: "Lifetime workmanship, 30-40 year materials",
    installDays: "3-4 days",
    benefits: [
      "Enhanced storm resistance and energy savings",
      "Up to 20% reduction on cooling costs via better ventilation",
      "Aesthetically pleasing with color options",
      "Can lower insurance premiums significantly"
    ],
    idealFor: [
      "Getting-urgent roof conditions",
      "Home value or storm protection concerns",
      "7+ year stays",
      "2-story homes",
      "HOA communities"
    ],
    highlights: [
      "Includes gutters & solar fan",
      "Maximum shingle protection",
      "Lifetime warranty"
    ],
    isPopular: true,
    color: "#FFD700"
  },
  {
    id: "blue-collar",
    name: "The Blue Collar Special",
    displayName: "Blue Collar",
    tier: "standard",
    category: "metal",
    priceLow: 860,
    priceHigh: 860,
    lineItems: [
      { description: "5V Crimp Metal Roof in Mill Finish", included: true },
      { description: "Polyglass Synthetic Underlayment", included: true },
      { description: "Standard Ridge or Gooseneck Vents", included: true },
      { description: "Code-Compliant Edge Metal & Flashing", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "10-Year Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 5 Sheets" },
      { description: "Fascia Repair", limit: "Up to 25 LF" },
    ],
    warranty: "10-year workmanship, 30-40 year materials",
    installDays: "3-5 days",
    benefits: [
      "Low maintenance with subtle industrial look",
      "30-40 year warranty",
      "Good for reducing insurance due to impact resistance",
      "Fire-rated in some areas"
    ],
    idealFor: [
      "Practical upgrades from shingles",
      "Storm protection focus",
      "Needs-work to urgent conditions",
      "7-15 year stays"
    ],
    highlights: [
      "Entry-level metal roof",
      "Durable & low maintenance",
      "Great storm resistance"
    ],
    color: "#4A90D9"
  },
  {
    id: "blue-collar-plus",
    name: "Blue Collar+",
    displayName: "Blue Collar+",
    tier: "premium",
    category: "metal",
    priceLow: 930,
    priceHigh: 930,
    lineItems: [
      { description: "5V Crimp Metal Roof with Kynar-Coated Finish", included: true },
      { description: "High-Temperature Polyglass Underlayment", included: true },
      { description: "Solar-Powered Ventilation System", included: true },
      { description: "Premium Edge Metal & Flashing Package", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "Lifetime Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 7 Sheets" },
      { description: "Fascia Repair", limit: "Up to 30 LF" },
    ],
    warranty: "Lifetime workmanship, 40-50 year materials",
    installDays: "4-6 days",
    benefits: [
      "Premium coating for color longevity and UV protection",
      "Better airflow reducing attic heat by up to 30%",
      "40-50 year warranty",
      "Excellent for HOA aesthetics"
    ],
    idealFor: [
      "Enhanced protection needs",
      "Storm or appearance concerns",
      "Urgent conditions",
      "15+ year stays",
      "2-3 story homes"
    ],
    highlights: [
      "Kynar color coating",
      "Solar ventilation included",
      "Extended warranty"
    ],
    color: "#2E5A8C"
  },
  {
    id: "platinum",
    name: "Platinum Roof Package",
    displayName: "Platinum",
    tier: "premium",
    category: "metal",
    // UPDATED PRICING: $1,100-$1,300 per square
    priceLow: 1100,
    priceHigh: 1300,
    lineItems: [
      { description: "24-Gauge Standing Seam Metal Roofing System (Kynar-Coated)", included: true },
      { description: "Polyglass MTS High-Temperature Underlayment", included: true },
      { description: "Ice & Water Protection at All Critical Penetrations", included: true },
      { description: "Solar Attic Fan Ventilation System", included: true },
      { description: "Wind-Rated System Installation (Up to 150 MPH)", included: true },
      { description: "Code-Compliant Fastening & Edge Metal", included: true },
      { description: "Fire Barrier Underlayment (Where Required by Code)", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "Manufacturer & Workmanship Warranty Package", included: true },
    ],
    allowances: [
      { description: "Fascia Repair & Painting", limit: "Up to 30 LF" },
      { description: "Plywood Replacement", limit: "Up to 7 Sheets" },
    ],
    warranty: "Lifetime workmanship and materials",
    installDays: "5-7 days",
    benefits: [
      "Seamless design for maximum leak prevention",
      "High wind/storm rating (up to 150 mph)",
      "Lifetime warranty potential",
      "Boosts home resale value significantly",
      "Customizable colors available"
    ],
    idealFor: [
      "Premium needs with multiple concerns",
      "Emergency conditions",
      "Forever homes",
      "HOA communities",
      "Active leak situations"
    ],
    highlights: [
      "Standing seam metal roof",
      "150 MPH wind rating",
      "Premium Kynar coating",
      "Lifetime warranty"
    ],
    isPopular: true,
    color: "#E5E4E2"
  },
  {
    id: "tile",
    name: "Tile Roof Package",
    displayName: "Tile",
    tier: "standard",
    category: "tile",
    priceLow: 900,
    priceHigh: 1000,
    lineItems: [
      { description: "Complete Removal and Replacement of Existing Tile Roof", included: true },
      { description: "Standard Tile Underlayment with Screw-Down Fastening", included: true },
      { description: "All Accessories Matched to Existing Style", included: true },
      { description: "Basic Ventilation Upgrade", included: true },
      { description: "Code-Compliant Tile Fastening", included: true },
      { description: "Tear-Off & Disposal of Existing Tile", included: true },
      { description: "Permit Processing & Inspections", included: true },
      { description: "Jobsite Protection & Cleanup", included: true },
      { description: "10-Year Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 3 Sheets" },
      { description: "Fascia Repair", limit: "Up to 20 LF" },
    ],
    warranty: "10-year workmanship, 30-40 year materials",
    installDays: "4-6 days",
    benefits: [
      "Restores original look with improved fastening",
      "30-40 year durability",
      "Maintains home aesthetics",
      "Matches common styles (Spanish, flat)"
    ],
    idealFor: [
      "Tile tear-offs in good to urgent conditions",
      "Storm protection concerns",
      "7-15 year stays",
      "HOA requirements for tile"
    ],
    highlights: [
      "Matches existing style",
      "Proven tile system",
      "Traditional aesthetics"
    ],
    color: "#C45C26"
  },
  {
    id: "tile-plus",
    name: "Tile+ Roof Package",
    displayName: "Tile+",
    tier: "premium",
    category: "tile",
    // UPDATED PRICING: $1,100-$1,300 per square
    priceLow: 1100,
    priceHigh: 1300,
    lineItems: [
      { description: "Premium Tile Roofing System (Concrete or Clay)", included: true },
      { description: "Polyglass TU MAX High-Performance Tile Underlayment", included: true },
      { description: "Glued & Screwed Tile Installation System", included: true },
      { description: "Upgraded Ventilation System", included: true },
      { description: "Code-Compliant Tile Fastening", included: true },
      { description: "Tear-Off & Disposal of Existing Tile", included: true },
      { description: "Permit Processing & Inspections", included: true },
      { description: "Jobsite Protection & Cleanup", included: true },
      { description: "Extended Material & Workmanship Warranty", included: true },
    ],
    allowances: [
      { description: "Fascia Repair & Paint", limit: "Up to 20 LF" },
      { description: "Plywood Replacement", limit: "Up to 3 Sheets" },
    ],
    warranty: "Lifetime workmanship, 40-50 year materials",
    installDays: "5-7 days",
    benefits: [
      "Enhanced adhesion and waterproofing",
      "Better impact resistance for hail/storms",
      "40-50 year warranty",
      "Premium tiles with color options",
      "Fascia painting included"
    ],
    idealFor: [
      "Urgent to emergency tile roofs",
      "Value/appearance concerns",
      "Forever homes",
      "High-end communities"
    ],
    highlights: [
      "Premium underlayment",
      "Glued & screwed system",
      "Maximum tile durability"
    ],
    color: "#8B4513"
  },
  {
    id: "ultimate",
    name: "Ultimate Roof Package",
    displayName: "Ultimate",
    tier: "luxury",
    category: "metal",
    priceLow: 1360,
    priceHigh: 1850,
    lineItems: [
      { description: "Premium Standing Seam Metal Roof (1.5\" with Clips) or Stone-Coated Steel", included: true },
      { description: "Polyglass XFR High-Temp and Fire-Rated Underlayment", included: true },
      { description: "Attic Breeze Solar-Powered Ventilation System", included: true },
      { description: "Complete Roof-to-Wall Flashing and Stucco Refinishing", included: true },
      { description: "Maximum Wind Rating Installation (180+ MPH)", included: true },
      { description: "Integrated Solar Panel Preparation (Optional)", included: true },
      { description: "Full Tear-Off & Disposal", included: true },
      { description: "Permit Handling & Inspections", included: true },
      { description: "Comprehensive Final Inspection", included: true },
      { description: "Final Cleanup & Magnetic Nail Sweep", included: true },
      { description: "Lifetime Comprehensive Warranty", included: true },
    ],
    allowances: [
      { description: "Plywood Replacement", limit: "Up to 10 Sheets" },
      { description: "Fascia Repair & Painting", limit: "Up to 30 LF" },
      { description: "Stucco Refinishing", limit: "Included" },
    ],
    warranty: "Lifetime comprehensive warranty",
    installDays: "7+ days",
    benefits: [
      "Ultimate durability with noise reduction and energy efficiency",
      "Withstands extreme weather with potential mold prevention",
      "Lifetime warranty on everything",
      "Maximizes insurance savings",
      "Custom options including integrated solar"
    ],
    idealFor: [
      "High-end forever homes",
      "Emergency needs",
      "Multiple concerns (insurance, value, storms)",
      "3-story homes",
      "Active leaks with mold risk"
    ],
    highlights: [
      "Highest-tier materials",
      "180+ MPH wind rating",
      "Solar-ready",
      "Complete peace of mind"
    ],
    color: "#1C1C1C"
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getPackageById = (id: string): PackageConfig | undefined => {
  return PACKAGE_CONFIGS.find(pkg => pkg.id === id);
};

export const getPackageByName = (name: string): PackageConfig | undefined => {
  return PACKAGE_CONFIGS.find(pkg => 
    pkg.name.toLowerCase().includes(name.toLowerCase()) ||
    pkg.displayName.toLowerCase() === name.toLowerCase()
  );
};

export const getPackagesByCategory = (category: "shingle" | "metal" | "tile"): PackageConfig[] => {
  return PACKAGE_CONFIGS.filter(pkg => pkg.category === category);
};

export const getPackagesByTier = (tier: "economy" | "standard" | "premium" | "luxury"): PackageConfig[] => {
  return PACKAGE_CONFIGS.filter(pkg => pkg.tier === tier);
};

// Calculate estimate range for a package
export const calculateEstimate = (
  packageConfig: PackageConfig,
  roofSquares: number,
  multiplier: number = 1.0
): { low: number; high: number } => {
  return {
    low: Math.round(packageConfig.priceLow * roofSquares * multiplier),
    high: Math.round(packageConfig.priceHigh * roofSquares * multiplier)
  };
};

// Format price range for display
export const formatPriceRange = (low: number, high: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (low === high) {
    return formatter.format(low);
  }
  return `${formatter.format(low)} - ${formatter.format(high)}`;
};

// Format per-square price for display
export const formatPerSquarePrice = (pkg: PackageConfig): string => {
  if (pkg.priceLow === pkg.priceHigh) {
    return `$${pkg.priceLow}/sq`;
  }
  return `$${pkg.priceLow}-$${pkg.priceHigh}/sq`;
};

// Get Good/Better/Best packages based on category preference
export const getGoodBetterBest = (
  preferredCategory: "shingle" | "metal" | "tile" = "shingle"
): { good: PackageConfig; better: PackageConfig; best: PackageConfig } => {
  if (preferredCategory === "tile") {
    return {
      good: getPackageById("tile")!,
      better: getPackageById("tile-plus")!,
      best: getPackageById("ultimate")!
    };
  }
  
  if (preferredCategory === "metal") {
    return {
      good: getPackageById("blue-collar")!,
      better: getPackageById("platinum")!,
      best: getPackageById("ultimate")!
    };
  }
  
  // Default shingle path
  return {
    good: getPackageById("bronze")!,
    better: getPackageById("gold")!,
    best: getPackageById("platinum")!
  };
};

// Trust footer text for all estimate PDFs
export const PRICING_DISCLAIMER = `Why pricing is shown as a range:
Roofing costs vary based on deck condition, code upgrades, and material availability. Your final price is locked in after inspection — no surprise add-ons.

"Final pricing may adjust if decking, fascia, or code upgrades exceed allowances."`;

export const ESTIMATE_VALIDITY_DAYS = 30;
