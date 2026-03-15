// ─── Edge Component Types ─────────────────────────────────────────────────────

export type EdgeType = "ridge" | "hip" | "valley" | "eave" | "rake" | "drip_edge" | "flashing" | "transition";

export const EDGE_COLORS: Record<EdgeType, string> = {
  ridge:     "#ef4444", // red
  hip:       "#f97316", // orange
  valley:    "#22c55e", // green
  eave:      "#a855f7", // purple
  rake:      "#3b82f6", // blue
  drip_edge: "#14b8a6", // teal
  flashing:  "#eab308", // yellow
  transition:"#ec4899", // pink
};

export const EDGE_LABELS: Record<EdgeType, string> = {
  ridge:     "Ridge",
  hip:       "Hip",
  valley:    "Valley",
  eave:      "Eave",
  rake:      "Rake",
  drip_edge: "Drip Edge",
  flashing:  "Flashing",
  transition:"Transition",
};

export const EDGE_DESCRIPTIONS: Record<EdgeType, string> = {
  ridge:     "Horizontal line at top where two slopes meet",
  hip:       "External angle where two roof faces meet",
  valley:    "Internal angle where two roof faces meet",
  eave:      "Lower horizontal edge of the roof",
  rake:      "Sloped edge of a gable roof",
  drip_edge: "Metal edge along eave/rake",
  flashing:  "Metal seal at wall-to-roof junction",
  transition:"Where two different roof sections connect",
};

// ─── Pitch Multipliers ───────────────────────────────────────────────────────

export const PITCH_MULTIPLIERS: Record<string, number> = {
  "Flat":  1.000,
  "1/12":  1.003,
  "2/12":  1.014,
  "3/12":  1.031,
  "4/12":  1.054,
  "5/12":  1.083,
  "6/12":  1.118,
  "7/12":  1.158,
  "8/12":  1.202,
  "9/12":  1.250,
  "10/12": 1.302,
  "11/12": 1.357,
  "12/12": 1.414,
  "14/12": 1.537,
  "16/12": 1.667,
  "18/12": 1.803,
  "20/12": 1.944,
  "22/12": 2.088,
  "24/12": 2.236,
};

export const ALL_PITCHES = Object.keys(PITCH_MULTIPLIERS);

// ─── Waste Options ───────────────────────────────────────────────────────────

export const WASTE_OPTIONS = [5, 10, 13, 15, 20] as const;

// ─── Drawing Tools ───────────────────────────────────────────────────────────

export type DrawingTool = "select" | "facet" | "edge" | "delete";

// ─── Data Structures ─────────────────────────────────────────────────────────

export interface RoofFacet {
  id: string;
  name: string;
  type: "pitched" | "flat";
  pitch: string;           // e.g. "4/12"
  vertices: [number, number][]; // [lng, lat]
  areaSqft: number;
  perimeterFt: number;
  color: string;           // fill color
}

export interface RoofEdge {
  id: string;
  edgeType: EdgeType;
  startVertex: [number, number]; // [lng, lat]
  endVertex: [number, number];
  lengthFt: number;
}

export interface RoofPin {
  id: string;
  lat: number;
  lng: number;
  pitch: string;           // e.g. "4/12", "Flat"
  label: string;
  wastePercent: number;     // per-pin waste
  loading: boolean;
  result: SolarMeasurementData | null;
  error: string | null;
}

export interface SolarMeasurementData {
  address: string;
  quality: "HIGH" | "MEDIUM";
  complexity: string;
  roof_segments_count: number;
  average_pitch_degrees: number;
  average_pitch_over_12: number;
  pitch_multiplier: number;
  waste_percent: number;
  total_flat_area_sqft: number;
  total_pitched_area_sqft: number;
  total_with_waste_sqft: number;
  total_squares: number;
  max_panels_count: number;
  satellite_image: string;
  center: { latitude: number; longitude: number };
  segments: RoofSegment[];
  flat_section_area_sqft: number;
  pitched_section_area_sqft: number;
  ai_roof_type_suggestion: string | null;
  ai_roof_type_warning: string | null;
}

export interface RoofSegment {
  id: string;
  area_sqft: number;
  pitch_degrees: number;
  pitch_over_12: number;
  azimuth_degrees: number;
}

export interface PinCalculation {
  flatSqft: number;
  multiplier: number;
  waste: number;
  pitchedSqft: number;
  withWaste: number;
  squares: number;
}

export interface RoofComponents {
  totalAreaSqft: number;
  totalSquares: number;
  ridgeFt: number;
  hipFt: number;
  valleyFt: number;
  eaveFt: number;
  rakeFt: number;
  dripEdgeFt: number;
  stepFlashingFt: number;
  headwallFt: number;
  flashingFt: number;
  perimeterFt: number;
  pipeBootsCount: number;
  skylightsCount: number;
  chimneyCount: number;
  facetsCount: number;
  stories: number;
  predominantPitch: string;
  complexity: string;
  wastePercent: number;
  pitchMultiplier: number;
}

export interface MaterialTakeoff {
  shingleBundles: number;
  feltRolls: number;
  iceWaterShieldRolls: number;
  ridgeCapBundles: number;
  dripEdgeFt: number;
  starterStripFt: number;
  stepFlashingPcs: number;
  pipeBoots: number;
  ventCount: number;
  nailBoxes: number;
  caulkTubes: number;
}

export interface DrawnPolygon {
  id: string;
  coordinates: [number, number][];
  areaSqft: number;
  perimeterFt: number;
  label: string;
}

export type MeasurementMode = "ai" | "manual";

// Pin color based on pitch
export function getPinColor(pitch: string): string {
  if (pitch === "Flat") return "#3b82f6";       // blue
  const num = parseInt(pitch.split("/")[0]);
  if (num <= 3) return "#22c55e";                // green - low pitch
  if (num <= 6) return "#f97316";                // orange - moderate
  if (num <= 9) return "#ef4444";                // red - steep
  return "#7c3aed";                              // purple - very steep
}

export const PIN_COLORS = { flat: "#3b82f6", pitched: "#ef4444" } as const;

// Facet colors - distinct, muted fills
export const FACET_COLORS = [
  "rgba(59,130,246,0.30)",  // blue
  "rgba(239,68,68,0.30)",   // red
  "rgba(34,197,94,0.30)",   // green
  "rgba(168,85,247,0.30)",  // purple
  "rgba(249,115,22,0.30)",  // orange
  "rgba(236,72,153,0.30)",  // pink
  "rgba(20,184,166,0.30)",  // teal
  "rgba(234,179,8,0.30)",   // yellow
];

export const DEFAULT_COMPONENTS: RoofComponents = {
  totalAreaSqft: 0,
  totalSquares: 0,
  ridgeFt: 0,
  hipFt: 0,
  valleyFt: 0,
  eaveFt: 0,
  rakeFt: 0,
  dripEdgeFt: 0,
  stepFlashingFt: 0,
  headwallFt: 0,
  flashingFt: 0,
  perimeterFt: 0,
  pipeBootsCount: 0,
  skylightsCount: 0,
  chimneyCount: 0,
  facetsCount: 0,
  stories: 1,
  predominantPitch: "4/12",
  complexity: "Moderate",
  wastePercent: 13,
  pitchMultiplier: 1.054,
};

// ─── Measurement Summary ─────────────────────────────────────────────────────

export interface MeasurementSummary {
  facets: RoofFacet[];
  edges: RoofEdge[];
  totalFlatArea: number;
  totalPitchedArea: number;
  totalSquares: number;
  wastePercent: number;
  pitchMultiplier: number;
  materialSquares: number;
  components: RoofComponents;
  takeoff: MaterialTakeoff;
}
