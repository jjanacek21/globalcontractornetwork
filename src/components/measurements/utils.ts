import type { RoofPin, PinCalculation, RoofComponents, MaterialTakeoff, RoofFacet, RoofEdge, EdgeType } from "./types";
import { PITCH_MULTIPLIERS, getPinColor } from "./types";

// Calculate pin using the pin's own pitch and waste settings
// For Flat pins, use flat_section_area_sqft (only segments <= 5°)
// For pitched pins, use pitched_section_area_sqft (only segments > 5°)
// Falls back to total_flat_area_sqft if section areas aren't available
export function calcPin(pin: RoofPin): PinCalculation | null {
  if (!pin.result) return null;
  const isFlat = pin.pitch === "Flat";
  // Check if the API returned section-specific fields (non-legacy response)
  const hasSectionData =
    pin.result.flat_section_area_sqft !== undefined &&
    pin.result.flat_section_area_sqft !== null &&
    pin.result.pitched_section_area_sqft !== undefined &&
    pin.result.pitched_section_area_sqft !== null;
  let flatSqft: number;
  if (hasSectionData) {
    // Use section-specific area — even if 0 — to avoid double-counting
    flatSqft = isFlat
      ? pin.result.flat_section_area_sqft!
      : pin.result.pitched_section_area_sqft!;
  } else {
    // Legacy fallback for old responses missing section fields
    flatSqft = pin.result.total_flat_area_sqft;
  }
  const multiplier = PITCH_MULTIPLIERS[pin.pitch] ?? 1.0;
  const waste = pin.wastePercent;
  const pitchedSqft = flatSqft * multiplier;
  const withWaste = pitchedSqft * (1 + waste / 100);
  const squares = withWaste / 100;
  return { flatSqft, multiplier, waste, pitchedSqft, withWaste, squares };
}

export function getPitchMultiplier(pitch: string): number {
  return PITCH_MULTIPLIERS[pitch] ?? 1.054;
}

export function calculateMaterialTakeoff(components: RoofComponents): MaterialTakeoff {
  const { totalSquares, ridgeFt, hipFt, eaveFt, rakeFt, dripEdgeFt, stepFlashingFt, pipeBootsCount } = components;

  const shingleBundles = Math.ceil(totalSquares * 3);
  const feltRolls = Math.ceil(totalSquares / 4);
  const iceWaterLinearFt = (components.valleyFt || 0) + (eaveFt || 0);
  const iceWaterShieldRolls = Math.ceil(iceWaterLinearFt / 66.7);
  const ridgeCapBundles = Math.ceil(((ridgeFt || 0) + (hipFt || 0)) / 35);
  const totalDripEdge = Math.ceil((dripEdgeFt || 0) + (eaveFt || 0) + (rakeFt || 0));
  const starterStripFt = Math.ceil((eaveFt || 0) + (rakeFt || 0));
  const stepFlashingPcs = Math.ceil((stepFlashingFt || 0) * 2.4);
  const pipeBoots = pipeBootsCount || 0;
  const ventCount = Math.ceil(components.totalAreaSqft / 150);
  const nailBoxes = Math.ceil(totalSquares * 1.5);
  const caulkTubes = Math.ceil(((stepFlashingFt || 0) + (components.headwallFt || 0) + (components.flashingFt || 0)) / 20);

  return { shingleBundles, feltRolls, iceWaterShieldRolls, ridgeCapBundles, dripEdgeFt: totalDripEdge, starterStripFt, stepFlashingPcs, pipeBoots, ventCount, nailBoxes, caulkTubes };
}

// Estimate components from Solar API data + generated facets/edges
export function estimateComponentsFromSolar(
  pins: RoofPin[], totalSqft: number, totalSquares: number,
  generatedEdges?: RoofEdge[]
): Partial<RoofComponents> {
  const measuredPins = pins.filter(p => p.result);
  if (measuredPins.length === 0) return {};
  const primaryResult = measuredPins[0].result!;
  const segmentCount = primaryResult.roof_segments_count;

  // Calculate edge lengths from actual generated edges if available
  if (generatedEdges && generatedEdges.length > 0) {
    const edgeTotals: Record<string, number> = {};
    generatedEdges.forEach(e => {
      edgeTotals[e.edgeType] = (edgeTotals[e.edgeType] || 0) + e.lengthFt;
    });
    const perimeterFt = (edgeTotals.eave || 0) + (edgeTotals.rake || 0);
    
    return {
      totalAreaSqft: Math.round(totalSqft),
      totalSquares: +totalSquares.toFixed(2),
      ridgeFt: Math.round(edgeTotals.ridge || 0),
      hipFt: Math.round(edgeTotals.hip || 0),
      valleyFt: Math.round(edgeTotals.valley || 0),
      eaveFt: Math.round(edgeTotals.eave || 0),
      rakeFt: Math.round(edgeTotals.rake || 0),
      dripEdgeFt: Math.round(perimeterFt),
      perimeterFt: Math.round(perimeterFt + (edgeTotals.ridge || 0) + (edgeTotals.hip || 0) + (edgeTotals.valley || 0)),
      facetsCount: segmentCount,
      complexity: primaryResult.complexity,
      wastePercent: primaryResult.waste_percent,
      pitchMultiplier: primaryResult.pitch_multiplier,
      predominantPitch: `${primaryResult.average_pitch_over_12}/12`,
    };
  }

  // Fallback: estimate from area (legacy)
  const sideLength = Math.sqrt(totalSqft);
  const perimeterFt = sideLength * 4 * 0.85;
  const ridgeFt = Math.round(sideLength * 0.45);
  const hipFt = segmentCount > 4 ? Math.round(perimeterFt * 0.25) : 0;
  const valleyFt = segmentCount > 3 ? Math.round(perimeterFt * 0.15) : 0;
  const eaveFt = Math.round(perimeterFt * 0.5);
  const rakeFt = Math.round(perimeterFt * 0.25);
  return {
    totalAreaSqft: Math.round(totalSqft), totalSquares: +totalSquares.toFixed(2),
    ridgeFt, hipFt, valleyFt, eaveFt, rakeFt, dripEdgeFt: eaveFt + rakeFt,
    perimeterFt: Math.round(perimeterFt), facetsCount: segmentCount,
    complexity: primaryResult.complexity, wastePercent: primaryResult.waste_percent,
    pitchMultiplier: primaryResult.pitch_multiplier,
    predominantPitch: `${primaryResult.average_pitch_over_12}/12`,
  };
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function polygonAreaSqft(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const midLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const metersPerDegLat = 111132.954;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRad(midLat));
  const pts = coords.map(c => [c[0] * metersPerDegLng, c[1] * metersPerDegLat]);
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return (Math.abs(area) / 2) * 10.7639;
}

export function polygonPerimeterFt(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let totalFt = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    totalFt += distanceFt(coords[i], coords[j]);
  }
  return totalFt;
}

export function distanceFt(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  const meters = 6371000 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
  return meters * 3.28084;
}

export function formatFeetInches(ft: number): string {
  const feet = Math.floor(ft);
  const inches = Math.round((ft - feet) * 12);
  if (inches === 12) return `${feet + 1}' 0"`;
  return `${feet}' ${inches}"`;
}

// Snap-to-vertex: find nearest vertex within threshold
export function findSnapVertex(
  point: [number, number],
  facets: RoofFacet[],
  thresholdFt: number = 3
): [number, number] | null {
  let closest: [number, number] | null = null;
  let closestDist = Infinity;
  for (const facet of facets) {
    for (const v of facet.vertices) {
      const d = distanceFt(point, v);
      if (d < thresholdFt && d < closestDist) {
        closestDist = d;
        closest = v;
      }
    }
  }
  return closest;
}

// ─── Create synthetic facet from a measured pin ───────────────────────

export function createPinFacet(pin: RoofPin, index: number): RoofFacet {
  const isFlat = pin.pitch === "Flat";
  const hasSectionData =
    pin.result?.flat_section_area_sqft !== undefined &&
    pin.result?.flat_section_area_sqft !== null &&
    pin.result?.pitched_section_area_sqft !== undefined &&
    pin.result?.pitched_section_area_sqft !== null;
  const area = hasSectionData
    ? (isFlat ? pin.result!.flat_section_area_sqft! : pin.result!.pitched_section_area_sqft!)
    : (pin.result?.total_flat_area_sqft ?? 0);
  const sideLen = Math.sqrt(area) * 0.3048; // approx meters
  const offset = (sideLen / 2) / 111132.954; // degrees offset
  const lng = pin.lng;
  const lat = pin.lat;
  const vertices: [number, number][] = [
    [lng - offset, lat - offset],
    [lng + offset, lat - offset],
    [lng + offset, lat + offset],
    [lng - offset, lat + offset],
  ];
  const pitch = pin.pitch;
  return {
    id: `pin-facet-${index}`,
    name: `Pin ${index + 1} (${pitch})`,
    type: pitch === "Flat" ? "flat" : "pitched",
    pitch,
    vertices,
    areaSqft: Math.round(area),
    perimeterFt: Math.round(polygonPerimeterFt(vertices)),
    color: hexToRgba(getPinColor(pitch), 0.35),
    wastePercent: pin.wastePercent,
  };
}

// ─── AI Simulation: Generate facets/edges from Solar API data ──────────

export function generateSimulatedFacets(
  center: { lat: number; lng: number },
  segments: { area_sqft: number; pitch_degrees: number; azimuth_degrees: number }[],
  totalAreaSqft: number
): { facets: RoofFacet[]; edges: RoofEdge[] } {
  const facets: RoofFacet[] = [];
  const edges: RoofEdge[] = [];

  if (segments.length === 0) return { facets, edges };

  const totalSegArea = segments.reduce((s, seg) => s + seg.area_sqft, 0) || totalAreaSqft;
  const scaleFactor = totalAreaSqft / (totalSegArea || 1);

  // Use building footprint approximation
  const buildingWidth = Math.sqrt(totalAreaSqft) * 0.012 / 111132.954;
  const baseLng = center.lng;
  const baseLat = center.lat;

  segments.forEach((seg, idx) => {
    const azRad = (seg.azimuth_degrees * Math.PI) / 180;
    const pitchOver12 = Math.round(Math.tan((seg.pitch_degrees * Math.PI) / 180) * 12);
    const pitch = pitchOver12 <= 0 ? "Flat" : `${Math.min(pitchOver12, 24)}/12`;

    const offset = buildingWidth * 0.4;
    const anglePrev = azRad - Math.PI / segments.length;
    const angleNext = azRad + Math.PI / segments.length;

    const vertices: [number, number][] = [
      [baseLng, baseLat],
      [baseLng + Math.sin(anglePrev) * offset, baseLat + Math.cos(anglePrev) * offset],
      [baseLng + Math.sin(azRad) * offset * 1.2, baseLat + Math.cos(azRad) * offset * 1.2],
      [baseLng + Math.sin(angleNext) * offset, baseLat + Math.cos(angleNext) * offset],
    ];

    const area = seg.area_sqft * scaleFactor;
    const perim = polygonPerimeterFt(vertices);

    facets.push({
      id: `facet-${idx}`,
      name: `Facet ${idx + 1}`,
      type: seg.pitch_degrees < 5 ? "flat" : "pitched",
      pitch,
      vertices,
      areaSqft: Math.round(area),
      perimeterFt: Math.round(perim),
      color: hexToRgba(getPinColor(pitch), 0.35),
    });

    // Generate edges between adjacent facets
    if (idx > 0) {
      const prevFacet = facets[idx - 1];
      const edgeType: EdgeType = seg.pitch_degrees < 5 ? "eave" : idx % 3 === 0 ? "ridge" : idx % 3 === 1 ? "hip" : "valley";
      const startV = prevFacet.vertices[prevFacet.vertices.length - 1];
      const endV = vertices[1];
      edges.push({
        id: `edge-${idx}`,
        edgeType,
        startVertex: startV,
        endVertex: endV,
        lengthFt: Math.round(distanceFt(startV, endV)),
      });
    }
  });

  // Add eave edges around perimeter using actual vertex positions
  if (facets.length > 0) {
    for (let i = 0; i < Math.min(facets.length, 4); i++) {
      const f = facets[i];
      const v1 = f.vertices[1];
      const v2 = f.vertices[f.vertices.length - 1];
      const len = distanceFt(v1, v2);
      edges.push({
        id: `eave-${i}`,
        edgeType: "eave",
        startVertex: v1,
        endVertex: v2,
        lengthFt: Math.round(len),
      });
    }

    // Add rake edges from outermost vertices to ridge
    if (facets.length >= 2) {
      const firstFacet = facets[0];
      const lastFacet = facets[facets.length - 1];
      // Rake on first facet
      edges.push({
        id: "rake-left",
        edgeType: "rake",
        startVertex: firstFacet.vertices[0],
        endVertex: firstFacet.vertices[1],
        lengthFt: Math.round(distanceFt(firstFacet.vertices[0], firstFacet.vertices[1])),
      });
      // Rake on last facet
      edges.push({
        id: "rake-right",
        edgeType: "rake",
        startVertex: lastFacet.vertices[0],
        endVertex: lastFacet.vertices[lastFacet.vertices.length - 1],
        lengthFt: Math.round(distanceFt(lastFacet.vertices[0], lastFacet.vertices[lastFacet.vertices.length - 1])),
      });
    }

    // Add ridge line
    if (facets.length >= 2) {
      const ridgeStart = facets[0].vertices[0];
      const ridgeEnd = facets[Math.floor(facets.length / 2)].vertices[0];
      edges.push({
        id: "ridge-main",
        edgeType: "ridge",
        startVertex: ridgeStart,
        endVertex: ridgeEnd,
        lengthFt: Math.round(distanceFt(ridgeStart, ridgeEnd)),
      });
    }
  }

  return { facets, edges };
}
