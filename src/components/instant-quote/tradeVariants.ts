// Single source of truth for the visual trade-wizard variants.
// "items" mode  -> user picks one or many variants and sets a qty per variant.
// "area"  mode  -> user picks one variant (material/type) and enters a total sqft/LF.

export type Variant = {
  id: string;
  label: string;
  icon: string;          // emoji or short glyph (rendered big & animated)
  hint?: string;
  sizes?: string[];      // optional size chips (e.g. ['32"x80"', '36"x80"'])
};

export type VariantGroup = {
  title: string;
  intro?: string;
  mode: "items" | "area";
  unit: "count" | "linear_feet" | "sqft" | "rooms";
  unitLabel: string;     // human label, shown next to numbers
  variants: Variant[];
  // For "area" mode this is the prompt for the numeric field
  areaPrompt?: string;   // e.g. "Approx. wall sqft"
  areaPlaceholder?: string;
};

export type TradeVariantConfig = {
  title: string;
  intro: string;
  groups: VariantGroup[];
  // Numeric extras shown beneath the picker (e.g. # of stories)
  extras?: { key: "stories"; label: string; placeholder?: string }[];
};

const STD_SIZES_DOOR = ['28"x80"', '32"x80"', '36"x80"', '36"x96"'];
const STD_SIZES_WIN = ['24"x36"', '36"x48"', '48"x60"', '60"x60"', '72"x48"'];

const WINDOWS_GROUP: VariantGroup = {
  title: "Windows",
  intro: "Tap each window type, set how many.",
  mode: "items",
  unit: "count",
  unitLabel: "windows",
  variants: [
    { id: "single-hung", label: "Single Hung", icon: "🪟", sizes: STD_SIZES_WIN },
    { id: "double-hung", label: "Double Hung", icon: "🪟", sizes: STD_SIZES_WIN },
    { id: "sliding", label: "Sliding", icon: "↔️", sizes: STD_SIZES_WIN },
    { id: "casement", label: "Casement", icon: "🪟", sizes: STD_SIZES_WIN },
    { id: "picture", label: "Picture / Fixed", icon: "🖼️", sizes: STD_SIZES_WIN },
    { id: "impact", label: "Impact-Rated", icon: "💥", hint: "Hurricane glass", sizes: STD_SIZES_WIN },
  ],
};

const DOORS_GROUP: VariantGroup = {
  title: "Doors",
  intro: "Tap each door type, set how many.",
  mode: "items",
  unit: "count",
  unitLabel: "doors",
  variants: [
    { id: "entry", label: "Entry Door", icon: "🚪", sizes: STD_SIZES_DOOR },
    { id: "sliding-glass", label: "Sliding Glass", icon: "🟦", sizes: ['60"x80"', '72"x80"', '96"x80"'] },
    { id: "french", label: "French Doors", icon: "🚪🚪", sizes: ['60"x80"', '72"x80"'] },
    { id: "garage", label: "Garage Door", icon: "🏚️", sizes: ["8'x7'", "9'x7'", "16'x7'", "16'x8'"] },
    { id: "storm", label: "Storm Door", icon: "🌪️", sizes: STD_SIZES_DOOR },
    { id: "interior", label: "Interior", icon: "🚪", sizes: STD_SIZES_DOOR },
    { id: "bifold", label: "Bifold / Closet", icon: "📐", sizes: ['24"x80"', '30"x80"', '36"x80"'] },
  ],
};

export const TRADE_VARIANTS: Record<string, TradeVariantConfig> = {
  // Combined Windows + Doors (the route /instant-quote/windows uses this)
  windows: {
    title: "Windows & Doors",
    intro: "Pick what you need replaced. You can add both windows and doors.",
    groups: [WINDOWS_GROUP, DOORS_GROUP],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },
  // Doors as its own slug also opens the combined view
  doors: {
    title: "Windows & Doors",
    intro: "Pick what you need replaced. You can add both windows and doors.",
    groups: [WINDOWS_GROUP, DOORS_GROUP],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  siding: {
    title: "Siding",
    intro: "Pick the siding material and tell us how much wall area.",
    groups: [{
      title: "Siding material",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft of wall",
      areaPrompt: "Approx. wall sqft",
      areaPlaceholder: "e.g. 1800",
      variants: [
        { id: "vinyl", label: "Vinyl", icon: "🟦" },
        { id: "fiber-cement", label: "Hardie / Fiber Cement", icon: "🪨" },
        { id: "wood", label: "Wood / Cedar", icon: "🪵" },
        { id: "metal", label: "Metal", icon: "⬜" },
        { id: "stucco-over", label: "Stucco-over", icon: "🏛️" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  stucco: {
    title: "Stucco",
    intro: "Pick the type of stucco work.",
    groups: [{
      title: "Stucco scope",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft of wall",
      areaPrompt: "Wall sqft",
      areaPlaceholder: "e.g. 1500",
      variants: [
        { id: "new", label: "New stucco", icon: "🏗️" },
        { id: "re-stucco", label: "Re-stucco", icon: "🔄" },
        { id: "patch", label: "Patch / Crack repair", icon: "🩹" },
        { id: "decorative", label: "Decorative finish", icon: "✨" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  gutters: {
    title: "Gutters",
    intro: "Pick a gutter profile and tell us the linear footage.",
    groups: [{
      title: "Gutter profile",
      mode: "area",
      unit: "linear_feet",
      unitLabel: "LF",
      areaPrompt: "Linear feet of roof edge",
      areaPlaceholder: "e.g. 180",
      variants: [
        { id: "k5", label: '5" K-Style', icon: "📏" },
        { id: "k6", label: '6" K-Style', icon: "📐" },
        { id: "half-round", label: "Half-Round", icon: "⌒" },
        { id: "box", label: "Box", icon: "▭" },
        { id: "guards", label: "Add Leaf Guards", icon: "🛡️" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  "soffit-fascia": {
    title: "Soffit & Fascia",
    intro: "Pick a material and the linear footage.",
    groups: [{
      title: "Material",
      mode: "area",
      unit: "linear_feet",
      unitLabel: "LF",
      areaPrompt: "Linear feet",
      areaPlaceholder: "e.g. 180",
      variants: [
        { id: "aluminum", label: "Aluminum", icon: "⬜" },
        { id: "vinyl", label: "Vinyl", icon: "🟦" },
        { id: "wood", label: "Wood", icon: "🪵" },
        { id: "combo", label: "Combo", icon: "🧩" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  pavers: {
    title: "Pavers",
    intro: "Pick what you're paving and the area.",
    groups: [{
      title: "Type of paver project",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Square feet",
      areaPlaceholder: "e.g. 600",
      variants: [
        { id: "driveway", label: "Driveway", icon: "🚗" },
        { id: "patio", label: "Patio", icon: "🪴" },
        { id: "pool-deck", label: "Pool Deck", icon: "🏊" },
        { id: "walkway", label: "Walkway", icon: "🚶" },
        { id: "brick", label: "Brick", icon: "🧱" },
        { id: "travertine", label: "Travertine", icon: "🪨" },
      ],
    }],
  },

  "pressure-washing": {
    title: "Pressure Washing",
    intro: "Pick what needs cleaning.",
    groups: [{
      title: "Surface",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Square feet",
      areaPlaceholder: "e.g. 1500",
      variants: [
        { id: "driveway", label: "Driveway", icon: "🚗" },
        { id: "house-wash", label: "House Wash", icon: "🏠" },
        { id: "roof-soft", label: "Roof Soft-Wash", icon: "🏚️" },
        { id: "pool-deck", label: "Pool Deck", icon: "🏊" },
        { id: "fence", label: "Fence", icon: "🧱" },
      ],
    }],
  },

  "exterior-paint": {
    title: "Exterior Paint",
    intro: "Pick the scope, then tell us the area.",
    groups: [{
      title: "Paint scope",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Wall sqft",
      areaPlaceholder: "e.g. 2000",
      variants: [
        { id: "body-trim", label: "Body + Trim", icon: "🎨" },
        { id: "body", label: "Body Only", icon: "🖌️" },
        { id: "trim", label: "Trim Only", icon: "🪞" },
        { id: "doors-shutters", label: "Doors + Shutters", icon: "🚪" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  "eifs-bands": {
    title: "EIFS Bands",
    intro: "Pick a band profile and total length.",
    groups: [{
      title: "Profile",
      mode: "area",
      unit: "linear_feet",
      unitLabel: "LF",
      areaPrompt: "Linear feet",
      areaPlaceholder: "e.g. 120",
      variants: [
        { id: "4in", label: '4" Profile', icon: "▬" },
        { id: "6in", label: '6" Profile', icon: "▭" },
        { id: "8in", label: '8" Profile', icon: "▬▬" },
        { id: "custom", label: "Custom", icon: "✨" },
      ],
    }],
  },

  "crown-molding": {
    title: "Crown Molding",
    intro: "Pick a profile and total length.",
    groups: [{
      title: "Profile",
      mode: "area",
      unit: "linear_feet",
      unitLabel: "LF",
      areaPrompt: "Linear feet",
      areaPlaceholder: "e.g. 80",
      variants: [
        { id: "simple", label: "Simple", icon: "▔" },
        { id: "traditional", label: "Traditional", icon: "🌀" },
        { id: "ornate", label: "Ornate", icon: "👑" },
      ],
    }],
  },

  drywall: {
    title: "Drywall",
    intro: "Pick the scope and area.",
    groups: [{
      title: "Scope",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Square feet",
      areaPlaceholder: "e.g. 500",
      variants: [
        { id: "patch", label: "Patch / Repair", icon: "🩹" },
        { id: "wall", label: "Full Wall", icon: "🟫" },
        { id: "ceiling", label: "Ceiling", icon: "⬜" },
        { id: "whole-room", label: "Whole Room", icon: "🏠" },
      ],
    }],
  },

  texture: {
    title: "Texture",
    intro: "Pick a finish.",
    groups: [{
      title: "Texture finish",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Square feet",
      areaPlaceholder: "e.g. 500",
      variants: [
        { id: "knockdown", label: "Knockdown", icon: "🌊" },
        { id: "orange-peel", label: "Orange Peel", icon: "🍊" },
        { id: "smooth", label: "Smooth", icon: "⬜" },
        { id: "popcorn-removal", label: "Popcorn Removal", icon: "🍿" },
      ],
    }],
  },

  flooring: {
    title: "Flooring",
    intro: "Pick a material.",
    groups: [{
      title: "Flooring material",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft",
      areaPrompt: "Square feet",
      areaPlaceholder: "e.g. 1200",
      variants: [
        { id: "tile", label: "Tile", icon: "🟫" },
        { id: "lvp", label: "LVP / Vinyl Plank", icon: "🪵" },
        { id: "hardwood", label: "Hardwood", icon: "🌳" },
        { id: "carpet", label: "Carpet", icon: "🟦" },
        { id: "polished-concrete", label: "Polished Concrete", icon: "⬛" },
      ],
    }],
  },

  "interior-paint": {
    title: "Interior Paint",
    intro: "Pick what we're painting per room.",
    groups: [{
      title: "Scope",
      mode: "area",
      unit: "rooms",
      unitLabel: "rooms",
      areaPrompt: "# of rooms",
      areaPlaceholder: "e.g. 4",
      variants: [
        { id: "walls", label: "Walls", icon: "🟦" },
        { id: "ceiling", label: "Ceiling", icon: "⬜" },
        { id: "trim", label: "Trim", icon: "🪞" },
        { id: "cabinets", label: "Cabinets", icon: "🗄️" },
      ],
    }],
  },

  cabinets: {
    title: "Cabinets",
    intro: "Pick scope and total LF.",
    groups: [{
      title: "Scope",
      mode: "area",
      unit: "linear_feet",
      unitLabel: "LF",
      areaPrompt: "Linear feet of cabinets",
      areaPlaceholder: "e.g. 25",
      variants: [
        { id: "refinish", label: "Refinish", icon: "🖌️" },
        { id: "reface", label: "Reface", icon: "🪞" },
        { id: "new", label: "New install", icon: "🗄️" },
        { id: "custom", label: "Custom built", icon: "👑" },
      ],
    }],
  },

  plumbing: {
    title: "Plumbing",
    intro: "Pick fixtures and quantities.",
    groups: [{
      title: "Fixtures",
      mode: "items",
      unit: "count",
      unitLabel: "fixtures",
      variants: [
        { id: "faucet", label: "Faucet", icon: "🚰" },
        { id: "toilet", label: "Toilet", icon: "🚽" },
        { id: "sink", label: "Sink", icon: "🪣" },
        { id: "shower", label: "Shower / Tub", icon: "🛁" },
        { id: "water-heater", label: "Water Heater", icon: "🔥" },
        { id: "repipe", label: "Repipe", icon: "🪈" },
        { id: "drain", label: "Drain Cleaning", icon: "🌀" },
      ],
    }],
  },

  electrical: {
    title: "Electrical",
    intro: "Pick what you need.",
    groups: [{
      title: "Items",
      mode: "items",
      unit: "count",
      unitLabel: "items",
      variants: [
        { id: "outlet", label: "Outlet", icon: "🔌" },
        { id: "switch", label: "Switch", icon: "💡" },
        { id: "fixture", label: "Light Fixture", icon: "🪔" },
        { id: "fan", label: "Ceiling Fan", icon: "💨" },
        { id: "panel", label: "Panel Upgrade", icon: "⚡" },
        { id: "ev", label: "EV Charger", icon: "🔋" },
      ],
    }],
  },

  bathrooms: {
    title: "Bathrooms",
    intro: "Pick the bathroom type and how many.",
    groups: [{
      title: "Bathroom type",
      mode: "items",
      unit: "count",
      unitLabel: "bathrooms",
      variants: [
        { id: "powder", label: "Powder (½ bath)", icon: "🚽" },
        { id: "full", label: "Full Bath", icon: "🛁" },
        { id: "master", label: "Master Bath", icon: "🛀" },
        { id: "wet-room", label: "Wet Room / Walk-in", icon: "🚿" },
      ],
    }],
  },

  kitchens: {
    title: "Kitchens",
    intro: "Pick the kitchen scope.",
    groups: [{
      title: "Scope",
      mode: "items",
      unit: "count",
      unitLabel: "kitchens",
      variants: [
        { id: "refresh", label: "Refresh (paint, hardware)", icon: "🖌️" },
        { id: "mid", label: "Mid (cabinets, counters)", icon: "🍽️" },
        { id: "full-gut", label: "Full Gut", icon: "🏗️" },
      ],
    }],
  },

  "interior-renovation": {
    title: "Interior Renovation",
    intro: "Pick which rooms.",
    groups: [{
      title: "Rooms",
      mode: "area",
      unit: "rooms",
      unitLabel: "rooms",
      areaPrompt: "Total rooms",
      areaPlaceholder: "e.g. 3",
      variants: [
        { id: "living", label: "Living Room", icon: "🛋️" },
        { id: "bedroom", label: "Bedroom", icon: "🛏️" },
        { id: "office", label: "Office", icon: "💼" },
        { id: "dining", label: "Dining Room", icon: "🍽️" },
        { id: "whole-home", label: "Whole Home", icon: "🏠" },
      ],
    }],
  },

  "tree-landscaping": {
    title: "Tree & Landscaping",
    intro: "Pick the services and quantities.",
    groups: [{
      title: "Services",
      mode: "items",
      unit: "count",
      unitLabel: "items",
      variants: [
        { id: "tree-removal", label: "Tree Removal", icon: "🪓" },
        { id: "trim", label: "Trimming", icon: "✂️" },
        { id: "stump", label: "Stump Grinding", icon: "🪵" },
        { id: "sod", label: "Sod", icon: "🟩" },
        { id: "mulch", label: "Mulch", icon: "🟫" },
        { id: "hedges", label: "Hedges", icon: "🌳" },
      ],
    }],
  },

  "window-cleaning": {
    title: "Window Cleaning",
    intro: "Pick scope and how many windows.",
    groups: [{
      title: "Scope",
      mode: "area",
      unit: "count",
      unitLabel: "windows",
      areaPrompt: "# of windows",
      areaPlaceholder: "e.g. 12",
      variants: [
        { id: "in-out", label: "Interior + Exterior", icon: "🪟" },
        { id: "ext", label: "Exterior Only", icon: "🌤️" },
        { id: "screens", label: "Screens", icon: "🟦" },
      ],
    }],
    extras: [{ key: "stories", label: "# of stories", placeholder: "1" }],
  },

  "emergency-services": {
    title: "Emergency Services",
    intro: "Pick the type of damage.",
    groups: [{
      title: "Type",
      mode: "area",
      unit: "sqft",
      unitLabel: "sqft affected",
      areaPrompt: "Affected area (sqft)",
      areaPlaceholder: "e.g. 200",
      variants: [
        { id: "water", label: "Water Mitigation", icon: "💧" },
        { id: "mold", label: "Mold Remediation", icon: "🦠" },
        { id: "tarp", label: "Roof Tarp", icon: "⛺" },
        { id: "board-up", label: "Board-Up", icon: "🪵" },
        { id: "fire", label: "Fire / Smoke", icon: "🔥" },
      ],
    }],
  },
};

export function getTradeVariantConfig(slug: string): TradeVariantConfig | null {
  return TRADE_VARIANTS[slug] || null;
}
