// Roofing Recommendation Engine
// Calculates pricing and recommends Good/Better/Best packages based on quiz answers

export interface QuizInputs {
  cityState: string;
  currentRoof: string;
  condition: "solid" | "needs-work" | "urgent" | "emergency";
  stories: 1 | 2 | 3;
  hasHOA: boolean;
  hasLeak: boolean;
  concerns: string[];
  desiredRoof: string;
  underlayment: string;
  ventilation: string;
  hasGutters: boolean;
  wantsGutters: "yes" | "no" | "unsure";
  timeInHome: "short" | "medium" | "forever";
  roofSquares: number;
  notes?: string;
}

export interface ExpandedPackage {
  name: string;
  pricePerSquare: string;
  features: string[];
  tier: "economy" | "standard" | "premium" | "luxury";
  category: "shingle" | "metal" | "tile" | "flat";
  description: string;
  benefits: string[];
  idealFor: string[];
  warranty: string;
  installDays: string;
  isPopular?: boolean;
}

export interface PricingMultipliers {
  stories: number;
  condition: number;
  location: number;
  gutters: number;
  fireBarrier: number;
  total: number;
}

export interface PackageRecommendation {
  tier: "good" | "better" | "best";
  package: ExpandedPackage;
  estimateLow: number;
  estimateHigh: number;
  reason: string;
  multipliers: PricingMultipliers;
}

// Counties that require fire barriers for metal roofs
const FIRE_BARRIER_COUNTIES = [
  "los angeles", "san diego", "orange", "ventura", "riverside",
  "san bernardino", "santa barbara", "marin", "sonoma", "napa"
];

// Parse price string to get low/high values
export const parsePrice = (priceStr: string): { low: number; high: number } | null => {
  const cleaned = priceStr.replace(/[,$]/g, '').replace('/sq', '').replace('/square', '');
  const parts = cleaned.split('-').map(p => parseFloat(p.trim()));
  
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { low: parts[0], high: parts[1] };
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return { low: parts[0], high: parts[0] };
  }
  return null;
};

// Calculate pricing multipliers based on quiz inputs
export const calculateMultipliers = (inputs: QuizInputs): PricingMultipliers => {
  // Story multiplier: higher = more labor
  const storyMultipliers: Record<number, number> = { 1: 1.0, 2: 1.10, 3: 1.17 };
  const stories = storyMultipliers[inputs.stories] || 1.0;
  
  // Condition multiplier: worse condition = more prep work
  const conditionMultipliers: Record<string, number> = {
    "solid": 1.0,
    "needs-work": 1.05,
    "urgent": 1.10,
    "emergency": 1.15
  };
  const condition = conditionMultipliers[inputs.condition] || 1.0;
  
  // Location multiplier (simplified - can be expanded with real data)
  const location = 1.0; // Base rate
  
  // Gutter cost addition (estimated per linear foot)
  let gutters = 0;
  if (inputs.wantsGutters === "yes") {
    // Rough estimate: ~160 linear feet for average home, $8/ft
    gutters = 1280 / (inputs.roofSquares * 100) * 100; // Normalized per square
  }
  
  // Fire barrier for metal in certain counties
  let fireBarrier = 0;
  const cityLower = inputs.cityState.toLowerCase();
  const needsFireBarrier = FIRE_BARRIER_COUNTIES.some(county => cityLower.includes(county));
  if (needsFireBarrier && (inputs.desiredRoof === "metal" || inputs.desiredRoof === "stone-coated")) {
    fireBarrier = 75; // Additional cost per square
  }
  
  const total = stories * condition * location;
  
  return { stories, condition, location, gutters, fireBarrier, total };
};

// Get recommendations based on quiz inputs
export const getRecommendations = (
  inputs: QuizInputs,
  packages: ExpandedPackage[]
): PackageRecommendation[] => {
  const multipliers = calculateMultipliers(inputs);
  
  const findPackage = (name: string) => 
    packages.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  
  const findByCategory = (category: string, tier?: string) =>
    packages.find(p => 
      p.category === category && 
      (tier ? p.tier === tier : true)
    );
  
  let good: ExpandedPackage | undefined;
  let better: ExpandedPackage | undefined;
  let best: ExpandedPackage | undefined;
  
  // Tile roofs must stay with tile packages
  if (inputs.currentRoof === "tile") {
    good = findPackage("Tile Roof Package");
    better = findPackage("Tile+");
    best = findPackage("Ultimate");
  }
  // User wants cheapest - prioritize economy
  else if (inputs.concerns.includes("cheapest")) {
    good = findPackage("Bronze");
    better = findPackage("Silver");
    best = findPackage("Gold");
  }
  // User wants metal
  else if (inputs.desiredRoof === "metal" || inputs.desiredRoof === "standing-seam") {
    good = findPackage("Blue Collar Special");
    better = findPackage("Blue Collar+") || findPackage("Platinum");
    best = findPackage("Ultimate");
  }
  // Forever home with storm/value concerns
  else if (inputs.timeInHome === "forever" && 
           (inputs.concerns.includes("storms") || inputs.concerns.includes("value"))) {
    good = findPackage("Gold");
    better = findPackage("Platinum");
    best = findPackage("Ultimate");
  }
  // Forever home general
  else if (inputs.timeInHome === "forever") {
    good = findPackage("Silver");
    better = findPackage("Gold");
    best = findPackage("Platinum");
  }
  // Urgent/Emergency conditions
  else if (inputs.condition === "urgent" || inputs.condition === "emergency") {
    good = findPackage("Silver");
    better = findPackage("Gold");
    best = findPackage("Platinum");
  }
  // Default shingle path
  else {
    good = findPackage("Bronze");
    better = findPackage("Silver");
    best = findPackage("Gold");
  }
  
  // Fallback to sorted packages if not found
  if (!good || !better || !best) {
    const sorted = packages
      .filter(p => parsePrice(p.pricePerSquare) !== null)
      .sort((a, b) => (parsePrice(a.pricePerSquare)?.low || 0) - (parsePrice(b.pricePerSquare)?.low || 0));
    good = good || sorted[0];
    better = better || sorted[Math.floor(sorted.length / 2)];
    best = best || sorted[sorted.length - 1];
  }
  
  const createRecommendation = (
    pkg: ExpandedPackage, 
    tier: "good" | "better" | "best"
  ): PackageRecommendation => {
    const price = parsePrice(pkg.pricePerSquare)!;
    
    // Apply multipliers to base price
    const adjustedLow = (price.low + multipliers.gutters + multipliers.fireBarrier) * multipliers.total;
    const adjustedHigh = (price.high + multipliers.gutters + multipliers.fireBarrier) * multipliers.total;
    
    // Generate reason based on tier and user inputs
    let reason = "";
    switch (tier) {
      case "good":
        reason = inputs.concerns.includes("cheapest") 
          ? "Best value for budget-conscious homeowners"
          : inputs.timeInHome === "forever"
            ? "Reliable protection for your forever home"
            : "Quality protection at an excellent price";
        break;
      case "better":
        reason = "Recommended balance of quality, durability, and value";
        break;
      case "best":
        reason = inputs.hasLeak 
          ? "Premium protection to stop leaks permanently"
          : inputs.concerns.includes("storms")
            ? "Maximum storm resistance and durability"
            : "Top-tier materials with lifetime warranty";
        break;
    }
    
    return {
      tier,
      package: pkg,
      estimateLow: Math.round(adjustedLow * inputs.roofSquares),
      estimateHigh: Math.round(adjustedHigh * inputs.roofSquares),
      reason,
      multipliers
    };
  };
  
  return [
    createRecommendation(good!, "good"),
    createRecommendation(better!, "better"),
    createRecommendation(best!, "best")
  ];
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Expanded package data with all details
export const expandedPackages: ExpandedPackage[] = [
  {
    name: "Bronze Roof Package",
    pricePerSquare: "$575-$650",
    features: [
      "Architectural shingles",
      "Synthetic underlayment for enhanced water resistance",
      "Ridge vent system for improved attic ventilation",
      "Includes 3 sheets of plywood and 10 linear feet of fascia replacement",
      "Backed by a 5-year workmanship warranty"
    ],
    tier: "economy",
    category: "shingle",
    description: "Affordable entry-level option with solid weather resistance. Reduces minor leaks and granule loss without over-investing.",
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
      "No HOA requirements",
      "1-story homes without active leaks"
    ],
    warranty: "5-year workmanship, 20-25 year materials",
    installDays: "1-2 days"
  },
  {
    name: "Silver Roof Package",
    pricePerSquare: "$700-$725",
    features: [
      "Architectural shingles",
      "Standard peel-and-stick underlayment",
      "Ridge vents or gooseneck vents (with additional vents as needed)",
      "Includes 5 sheets of plywood and 25 linear feet of fascia",
      "Comes with a 10-year workmanship warranty"
    ],
    tier: "standard",
    category: "shingle",
    description: "Balanced durability with better adhesion and ventilation, helping prevent ice dams and heat buildup.",
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
      "Roofs in needs-work condition",
      "1-2 story homes"
    ],
    warranty: "10-year workmanship, 25-30 year materials",
    installDays: "2-3 days",
    isPopular: true
  },
  {
    name: "Gold Roof Package",
    pricePerSquare: "$800-$850",
    features: [
      "Architectural shingles",
      "High-temperature peel-and-stick underlayment for superior protection",
      "Solar attic fan for energy-efficient ventilation",
      "Includes 7 sheets of plywood and 30 linear feet of painted fascia",
      "6-inch seamless gutters with downspouts",
      "Lifetime roof warranty included"
    ],
    tier: "premium",
    category: "shingle",
    description: "Enhanced storm resistance and energy savings (up to 20% on cooling costs via better ventilation).",
    benefits: [
      "Aesthetically pleasing with color options",
      "30-40 year warranty potential",
      "Can lower insurance premiums significantly",
      "UV-resistant materials for longevity"
    ],
    idealFor: [
      "Getting-urgent roof conditions",
      "Home value or storm protection concerns",
      "7+ year stays",
      "2-story homes",
      "HOA communities"
    ],
    warranty: "Lifetime workmanship, 30-40 year materials",
    installDays: "3-4 days",
    isPopular: true
  },
  {
    name: "The Blue Collar Special",
    pricePerSquare: "$860",
    features: [
      "5V crimp metal roof in mill finish",
      "Polyglass synthetic underlayment",
      "Standard ridge or gooseneck vents",
      "Includes 5 sheets of plywood and 25 linear feet of fascia",
      "Covered by a 10-year workmanship warranty"
    ],
    tier: "standard",
    category: "metal",
    description: "Economical metal entry point with rust-resistant materials for long-term weatherproofing.",
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
      "7-15 year stays",
      "1-2 story homes"
    ],
    warranty: "10-year workmanship, 30-40 year materials",
    installDays: "3-5 days"
  },
  {
    name: "Blue Collar+",
    pricePerSquare: "$930",
    features: [
      "5V crimp metal roof with Kynar-coated finish",
      "High-temperature Polyglass underlayment",
      "Solar-powered ventilation system",
      "Includes 7 sheets of plywood and 30 linear feet of fascia",
      "Lifetime workmanship warranty"
    ],
    tier: "premium",
    category: "metal",
    description: "Premium coating for color longevity and UV protection with better airflow reducing attic heat by up to 30%.",
    benefits: [
      "40-50 year warranty",
      "Excellent for HOA aesthetics",
      "Eco-friendly solar ventilation",
      "Edge sealing for wind uplift resistance"
    ],
    idealFor: [
      "Enhanced protection needs",
      "Storm or appearance concerns",
      "Urgent conditions",
      "15+ year stays",
      "2-3 story homes"
    ],
    warranty: "Lifetime workmanship, 40-50 year materials",
    installDays: "4-6 days"
  },
  {
    name: "Platinum Roof Package",
    pricePerSquare: "$1000-$1200",
    features: [
      "1\" Snap-lock standing seam metal roof (24-gauge, Kynar-coated)",
      "Polyglass MTS high-temp underlayment",
      "Solar attic fan ventilation",
      "Includes 7 sheets of plywood and 30 linear feet of painted fascia",
      "Lifetime roof warranty"
    ],
    tier: "premium",
    category: "metal",
    description: "Seamless design for maximum leak prevention with high wind/storm rating (up to 150 mph).",
    benefits: [
      "Lifetime warranty potential",
      "Boosts home resale value significantly",
      "Customizable colors available",
      "Fire barrier included if required"
    ],
    idealFor: [
      "Premium needs with multiple concerns",
      "Emergency conditions",
      "Forever homes",
      "HOA communities",
      "Active leak situations"
    ],
    warranty: "Lifetime workmanship and materials",
    installDays: "5-7 days",
    isPopular: true
  },
  {
    name: "Tile Roof Package",
    pricePerSquare: "$900-$1000",
    features: [
      "Complete removal and replacement of existing tile roof",
      "Standard tile underlayment with screw-down fastening",
      "All accessories matched to existing style",
      "Includes 3 sheets of plywood and 20 linear feet of fascia",
      "10-year workmanship warranty"
    ],
    tier: "standard",
    category: "tile",
    description: "Restores original look with improved fastening for better wind resistance.",
    benefits: [
      "30-40 year durability",
      "Maintains home aesthetics",
      "Matches common styles (Spanish, flat)",
      "Basic ventilation upgrade included"
    ],
    idealFor: [
      "Tile tear-offs in good to urgent conditions",
      "Storm protection concerns",
      "7-15 year stays",
      "HOA requirements for tile"
    ],
    warranty: "10-year workmanship, 30-40 year materials",
    installDays: "4-6 days"
  },
  {
    name: "Tile+ Roof Package",
    pricePerSquare: "$1000-$1100",
    features: [
      "Tile removal and replacement with premium materials",
      "Polyglass TU MAX underlayment",
      "Glued and screwed for extra durability",
      "Upgraded ventilation system",
      "Includes 6 sheets of plywood and 30 linear feet of fascia"
    ],
    tier: "premium",
    category: "tile",
    description: "Enhanced adhesion and waterproofing with better impact resistance for hail/storms.",
    benefits: [
      "40-50 year warranty",
      "Premium tiles with color options",
      "HOA-friendly",
      "Fascia painting included"
    ],
    idealFor: [
      "Urgent to emergency tile roofs",
      "Value/appearance concerns",
      "Forever homes",
      "High-end communities"
    ],
    warranty: "Lifetime workmanship, 40-50 year materials",
    installDays: "5-7 days"
  },
  {
    name: "Ultimate Roof Package",
    pricePerSquare: "$1360-$1850",
    features: [
      "Premium standing seam metal roof (1.5\" with clips) or stone-coated steel (Tefute/Novatik)",
      "Polyglass XFR high-temp and fire-rated underlayment",
      "Attic Breeze solar-powered ventilation system",
      "Includes 10 sheets of plywood and 30 linear feet of painted fascia",
      "Complete roof-to-wall flashing and stucco refinishing",
      "Lifetime roof warranty"
    ],
    tier: "luxury",
    category: "metal",
    description: "Ultimate durability with noise reduction and energy efficiency. Withstands extreme weather with potential mold prevention.",
    benefits: [
      "Lifetime warranty on everything",
      "Maximizes insurance savings",
      "Custom options including integrated solar",
      "Comprehensive inspection included"
    ],
    idealFor: [
      "High-end forever homes",
      "Emergency needs",
      "Multiple concerns (insurance, value, storms)",
      "3-story homes",
      "Active leaks with mold risk"
    ],
    warranty: "Lifetime comprehensive warranty",
    installDays: "7+ days"
  }
];
