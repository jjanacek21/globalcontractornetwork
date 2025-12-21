// ES MULTIMAX Window Pricing - South Florida
// Based on uploaded pricing tables

export const ES_MULTIMAX_PRICES: Record<string, Record<string, number>> = {
  singleHung: {
    "17x25": 1134, "17x37": 1211, "17x50": 1292, "17x62": 1372, "17x72": 1434, "17x76": 1460,
    "25x25": 1208, "25x37": 1323, "25x50": 1444, "25x62": 1558, "25x72": 1651, "25x76": 1691,
    "37x25": 1332, "37x37": 1500, "37x50": 1682, "37x62": 1847, "37x72": 1987, "37x76": 2043,
    "52x25": 1472, "52x37": 1710, "52x50": 1964, "52x62": 2199, "52x72": 2397, "52x76": 2474
  },
  roller: {
    "25x37": 1353, "25x50": 1481, "25x62": 1600,
    "37x25": 1344, "37x37": 1530, "37x50": 1719, "37x62": 1896,
    "52x25": 1493, "52x37": 1749, "52x50": 2017, "52x62": 2262,
    "60x25": 1572, "60x37": 1866, "60x50": 2173, "60x62": 2460,
    "72x25": 1691, "72x37": 2040, "72x50": 2411, "72x62": 2754
  },
  liteRoller3: {
    "74x25": 1872, "74x37": 2250, "74x50": 2647, "74x62": 3015,
    "84x25": 1974, "84x37": 2403, "84x50": 2854, "84x62": 3271,
    "96x25": 2099, "96x37": 2586, "96x50": 3102, "96x62": 3578,
    "105x25": 2194, "105x37": 2722, "105x50": 3288, "105x62": 3809,
    "110x25": 2245, "110x37": 2800, "110x50": 3392, "110x62": 3938
  },
  pictureWindow: {
    "25x25": 1183, "25x37": 1215, "25x50": 1394, "25x62": 1560,
    "37x25": 1215, "37x37": 1284, "37x50": 1459, "37x62": 1660,
    "52x25": 1337, "52x37": 1478, "52x50": 1699, "52x62": 1951
  },
  slidingGlassDoor: {
    "60x80": 4851, "72x80": 5121, "96x80": 5661, "108x80": 7424,
    "120x80": 8236, "142x80": 9514, "190x80": 10596,
    "60x96": 5237, "72x96": 5561, "96x96": 6210, "108x96": 8359,
    "120x96": 8876, "142x96": 10348
  },
  frenchDoor: {
    "30x80": 3500, "36x80": 3793, "60x80": 4200, "72x80": 4800
  }
};

export const WINDOW_TYPES = [
  { id: "singleHung", name: "Single Hung", description: "Classic vertical sliding window", image: "single-hung" },
  { id: "roller", name: "Horizontal Roller", description: "Slides horizontally for easy operation", image: "horizontal-roller" },
  { id: "liteRoller3", name: "3 Lite Roller", description: "Three-panel horizontal slider", image: "3-lite-roller" },
  { id: "pictureWindow", name: "Picture Window", description: "Fixed window for maximum views", image: "picture-window" },
  { id: "slidingGlassDoor", name: "Sliding Glass Door", description: "Smooth sliding patio access", image: "sliding-glass-door" },
  { id: "frenchDoor", name: "French Door", description: "Elegant hinged double doors", image: "french-door" }
];

export const DISCOUNTS: Record<string, { label: string; value: number }> = {
  contractor: { label: "Multiline Contractor", value: 0.10 },
  veteran: { label: "Veteran/Military", value: 0.05 },
  aarp: { label: "AARP Member", value: 0.05 },
  wholesale: { label: "Wholesale/Club Member", value: 0.05 },
  ivd: { label: "IVD Discount", value: 0.05 },
  none: { label: "No Discount", value: 0 }
};

export const PERFORMANCE_LEVELS = [
  { id: "standard", name: "Good - Standard Grade", multiplier: 1.0, description: "Basic impact protection" },
  { id: "enhanced", name: "Better - Enhanced Grade", multiplier: 1.15, description: "Improved energy efficiency" },
  { id: "premium", name: "Best - Premium Grade", multiplier: 1.35, description: "Maximum protection & efficiency" }
];

export const COLORS = {
  interior: ["White", "Beige", "Black", "Light Oak", "Medium Oak", "Cherry"],
  exterior: ["White", "Beige", "Black", "Harbor Grey", "Natural Clay", "Barn Red", "Bronze"]
};

export const GLASS_TYPES = [
  { id: "standard", name: "Standard Efficiency", multiplier: 1.0 },
  { id: "enhanced", name: "Enhanced Efficiency (Low-E)", multiplier: 1.10 },
  { id: "premium", name: "Premium Efficiency (Triple Low-E)", multiplier: 1.25 }
];

export const GRID_STYLES = ["Colonial", "Prairie", "Modern Grid", "Custom", "No Grids"];

export const EXISTING_WINDOW_TYPES = ["Wood", "Vinyl", "Aluminum/Metal", "Other/Unsure"];

export const FINANCING_OPTIONS = [
  { id: "cash", name: "Same as Cash (0% for 24 months)", description: "No interest if paid in full" },
  { id: "lowRate", name: "Low Rate (6.99% APR)", description: "Fixed low interest rate" },
  { id: "lowMonthly", name: "Low Monthly Payments", description: "Extended term, lower payments" },
  { id: "none", name: "No Financing Needed", description: "Pay at time of service" }
];

export const getSizeOptions = (windowType: string): string[] => {
  return Object.keys(ES_MULTIMAX_PRICES[windowType] || {});
};

export const calculateWindowPrice = (
  windowType: string,
  size: string,
  quantity: number,
  performanceMultiplier: number,
  glassMultiplier: number,
  discountValue: number
): { base: number; discounted: number } => {
  const basePrice = ES_MULTIMAX_PRICES[windowType]?.[size] || 0;
  const adjustedPrice = basePrice * performanceMultiplier * glassMultiplier * quantity;
  const discountedPrice = adjustedPrice * (1 - discountValue);
  
  return {
    base: Math.round(adjustedPrice),
    discounted: Math.round(discountedPrice)
  };
};
