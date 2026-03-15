export interface RoofPin {
  id: string;
  lat: number;
  lng: number;
  roofType: "flat" | "pitched";
  label: string;
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

export type MeasurementMode = "ai" | "draw";

export const PIN_COLORS = { flat: "#3b82f6", pitched: "#ef4444" } as const;

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
