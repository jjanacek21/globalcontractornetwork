import type { RoofPin, PinCalculation, RoofComponents, MaterialTakeoff } from "./types";

export function calcPin(pin: RoofPin): PinCalculation | null {
  if (!pin.result) return null;
  const flatSqft = pin.result.total_flat_area_sqft;
  const multiplier = pin.roofType === "flat" ? 1.0 : pin.result.pitch_multiplier;
  const waste = pin.roofType === "flat" ? 5 : pin.result.waste_percent;
  const pitchedSqft = flatSqft * multiplier;
  const withWaste = pitchedSqft * (1 + waste / 100);
  const squares = withWaste / 100;
  return { flatSqft, multiplier, waste, pitchedSqft, withWaste, squares };
}

export function calculateMaterialTakeoff(components: RoofComponents): MaterialTakeoff {
  const { totalSquares, ridgeFt, hipFt, eaveFt, rakeFt, dripEdgeFt, stepFlashingFt, pipeBootsCount } = components;

  // 3 bundles per square for standard 3-tab shingles
  const shingleBundles = Math.ceil(totalSquares * 3);
  // 1 roll of felt covers ~4 squares
  const feltRolls = Math.ceil(totalSquares / 4);
  // Ice & water shield: valleys + eaves (6 ft wide)
  const iceWaterLinearFt = (components.valleyFt || 0) + (eaveFt || 0);
  const iceWaterShieldRolls = Math.ceil(iceWaterLinearFt / 66.7); // 66.7 ft per roll
  // Ridge cap: 1 bundle per ~35 linear ft of ridge + hip
  const ridgeCapBundles = Math.ceil(((ridgeFt || 0) + (hipFt || 0)) / 35);
  // Drip edge: total eave + rake length
  const totalDripEdge = Math.ceil((dripEdgeFt || 0) + (eaveFt || 0) + (rakeFt || 0));
  // Starter strip: eave + rake length
  const starterStripFt = Math.ceil((eaveFt || 0) + (rakeFt || 0));
  // Step flashing: 1 piece per 5 inches = ~2.4 per ft
  const stepFlashingPcs = Math.ceil((stepFlashingFt || 0) * 2.4);
  // Pipe boots
  const pipeBoots = pipeBootsCount || 0;
  // Vents: 1 per 150 sqft of attic space (rough)
  const ventCount = Math.ceil(components.totalAreaSqft / 150);
  // Nails: ~1.5 boxes per square
  const nailBoxes = Math.ceil(totalSquares * 1.5);
  // Caulk: 1 tube per 20 linear ft of flashing
  const caulkTubes = Math.ceil(((stepFlashingFt || 0) + (components.headwallFt || 0) + (components.flashingFt || 0)) / 20);

  return {
    shingleBundles,
    feltRolls,
    iceWaterShieldRolls,
    ridgeCapBundles,
    dripEdgeFt: totalDripEdge,
    starterStripFt,
    stepFlashingPcs,
    pipeBoots,
    ventCount,
    nailBoxes,
    caulkTubes,
  };
}

// Estimate line lengths from Solar API data
export function estimateComponentsFromSolar(
  pins: RoofPin[],
  totalSqft: number,
  totalSquares: number
): Partial<RoofComponents> {
  const measuredPins = pins.filter(p => p.result);
  if (measuredPins.length === 0) return {};

  const primaryResult = measuredPins[0].result!;
  const segmentCount = primaryResult.roof_segments_count;

  // Rough estimation formulas based on industry standards
  const sideLength = Math.sqrt(totalSqft); // approximate side of equivalent square
  const perimeterFt = sideLength * 4 * 0.85; // most roofs aren't square

  // Ridge ≈ longest dimension / 2 for gable, less for hip
  const ridgeFt = Math.round(sideLength * 0.45);
  // Hip: for hip roofs, roughly equal to perimeter * 0.3
  const hipFt = segmentCount > 4 ? Math.round(perimeterFt * 0.25) : 0;
  // Valley: ~15% of perimeter for moderate complexity
  const valleyFt = segmentCount > 3 ? Math.round(perimeterFt * 0.15) : 0;
  // Eave: ~50% of perimeter
  const eaveFt = Math.round(perimeterFt * 0.5);
  // Rake: ~25% of perimeter (gable ends)
  const rakeFt = Math.round(perimeterFt * 0.25);

  return {
    totalAreaSqft: Math.round(totalSqft),
    totalSquares: +totalSquares.toFixed(2),
    ridgeFt,
    hipFt,
    valleyFt,
    eaveFt,
    rakeFt,
    dripEdgeFt: eaveFt + rakeFt,
    perimeterFt: Math.round(perimeterFt),
    facetsCount: segmentCount,
    complexity: primaryResult.complexity,
    wastePercent: primaryResult.waste_percent,
    pitchMultiplier: primaryResult.pitch_multiplier,
    predominantPitch: `${primaryResult.average_pitch_over_12}/12`,
  };
}

// Calculate polygon area in sqft from lng/lat coordinates using Shoelace formula
export function polygonAreaSqft(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const midLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const metersPerDegLat = 111132.954;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRad(midLat));

  // Convert to meters
  const pts = coords.map(c => [c[0] * metersPerDegLng, c[1] * metersPerDegLat]);
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  area = Math.abs(area) / 2;
  return area * 10.7639; // m² to sqft
}

export function polygonPerimeterFt(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let totalMeters = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const dLat = toRad(coords[j][1] - coords[i][1]);
    const dLng = toRad(coords[j][0] - coords[i][0]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coords[i][1])) * Math.cos(toRad(coords[j][1])) * Math.sin(dLng / 2) ** 2;
    totalMeters += 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return totalMeters * 3.28084; // meters to feet
}
