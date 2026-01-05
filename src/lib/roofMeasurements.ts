// Shared roof measurement constants and utilities

// Pitch factors for different roof angles
export const PITCH_FACTORS = {
  flat: 1.0,
  lowSlope: 1.05,
  standard: 1.10,
  steep: 1.15,
  veryStep: 1.20
} as const;

// Waste factors by roof complexity
export const WASTE_FACTORS = {
  flat: 1.05,    // 5% waste for flat roofs
  gable: 1.10,   // 10% waste
  hip: 1.15,     // 15% waste
  complex: 1.20  // 20% waste
} as const;

// Complexity factors for adjusting area
export const COMPLEXITY_FACTORS = {
  flat: 1.0,
  gable: 1.10,
  hip: 1.15,
  complex: 1.17
} as const;

export type RoofComplexity = 'flat' | 'gable' | 'hip' | 'complex';
export type Confidence = 'high' | 'medium' | 'low';

export interface MeasurementResult {
  flatArea: number;
  trueSqft: number;
  totalWithWaste: number;
  squares: number;
  roofComplexity: RoofComplexity;
  confidence: Confidence;
  polygonData?: GeoJSON.FeatureCollection;
  address: string;
  coordinates: { lat: number; lng: number };
}

export interface VisionEstimation {
  estimatedSqft: number;
  estimatedSqftLow: number;
  estimatedSqftHigh: number;
  confidence: Confidence;
  methodology: string;
  roofShape: string;
  roofComplexity: RoofComplexity;
  satelliteImageUrl: string;
}

// Calculate roof area with pitch and waste
export function calculateRoofArea(
  flatArea: number, 
  complexity: RoofComplexity,
  pitchFactor: number = PITCH_FACTORS.standard
): { trueSqft: number; totalWithWaste: number; squares: number } {
  const trueSqft = flatArea * pitchFactor;
  const wasteFactor = WASTE_FACTORS[complexity] || WASTE_FACTORS.flat;
  const totalWithWaste = trueSqft * wasteFactor;
  const squares = totalWithWaste / 100;
  
  return { trueSqft, totalWithWaste, squares };
}

// Apply pitch factor based on complexity for pitched roofs
export function applyPitchFactor(
  flatSqft: number, 
  complexity: string
): { adjustedSqft: number; factor: number } {
  const trueSqft = flatSqft * PITCH_FACTORS.standard;
  const complexityFactor = COMPLEXITY_FACTORS[complexity as RoofComplexity] || 1.0;
  
  return {
    adjustedSqft: trueSqft * complexityFactor,
    factor: PITCH_FACTORS.standard * complexityFactor
  };
}

// Get confidence color class
export function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

// Get complexity label
export function getComplexityLabel(complexity: string): string {
  switch (complexity) {
    case 'flat': return 'Flat Roof';
    case 'gable': return 'Gable (2-sided)';
    case 'hip': return 'Hip (4-sided)';
    case 'complex': return 'Complex';
    default: return complexity;
  }
}

// Get complexity factor percentage
export function getComplexityFactor(complexity: string): string {
  switch (complexity) {
    case 'gable': return '+10%';
    case 'hip': return '+15%';
    case 'complex': return '+17%';
    default: return '';
  }
}

// Convert degrees to pitch ratio
export function degreesToPitchRatio(degrees: number): string {
  const rise = Math.tan(degrees * Math.PI / 180) * 12;
  return `${rise.toFixed(0)}/12`;
}

// Estimate pitch degrees from complexity
export function getPitchDegreesFromComplexity(complexity: RoofComplexity): number {
  switch (complexity) {
    case 'flat': return 0;
    case 'gable': return 25;
    case 'hip': return 30;
    case 'complex': return 35;
    default: return 20;
  }
}
