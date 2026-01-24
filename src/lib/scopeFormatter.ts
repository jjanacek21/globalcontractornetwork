/**
 * Formats raw JSON scope descriptions into human-readable text
 */

interface WindowDoorData {
  windowCount?: number;
  doorCount?: number;
  slidingDoorCount?: number;
  frameMaterial?: string;
  impactRequired?: boolean;
  selectedWindowProduct?: {
    manufacturer: string;
    product_name: string;
    noa_number?: string;
  };
  selectedDoorProduct?: {
    manufacturer: string;
    product_name: string;
    noa_number?: string;
  };
  selectedSlidingDoorProduct?: {
    manufacturer: string;
    product_name: string;
    noa_number?: string;
  };
}

interface RoofingData {
  roofType?: string;
  roofColor?: string;
  squareFootage?: number;
  existingMaterial?: string;
  newMaterial?: string;
  selectedProducts?: Array<{
    category: string;
    product: {
      manufacturer: string;
      product_name: string;
      noa_number?: string;
    };
  }>;
}

interface TradeData {
  windows_doors?: WindowDoorData;
  roofing?: RoofingData;
  hvac?: Record<string, unknown>;
  electrical?: Record<string, unknown>;
  plumbing?: Record<string, unknown>;
}

export function formatScopeOfWork(scopeDescription: string | null | undefined, permitType?: string): string {
  if (!scopeDescription) {
    return 'No scope description provided.';
  }

  // Try to parse as JSON
  try {
    const data = JSON.parse(scopeDescription) as TradeData;
    const lines: string[] = [];

    // Windows & Doors
    if (data.windows_doors) {
      const wd = data.windows_doors;
      
      if (wd.windowCount && wd.windowCount > 0) {
        lines.push(`• Install ${wd.windowCount} impact window${wd.windowCount > 1 ? 's' : ''}`);
        if (wd.selectedWindowProduct) {
          lines.push(`   Product: ${wd.selectedWindowProduct.manufacturer} ${wd.selectedWindowProduct.product_name}`);
          if (wd.selectedWindowProduct.noa_number) {
            lines.push(`   NOA: ${wd.selectedWindowProduct.noa_number}`);
          }
        }
      }
      
      if (wd.doorCount && wd.doorCount > 0) {
        lines.push(`• Install ${wd.doorCount} impact entry door${wd.doorCount > 1 ? 's' : ''}`);
        if (wd.selectedDoorProduct) {
          lines.push(`   Product: ${wd.selectedDoorProduct.manufacturer} ${wd.selectedDoorProduct.product_name}`);
          if (wd.selectedDoorProduct.noa_number) {
            lines.push(`   NOA: ${wd.selectedDoorProduct.noa_number}`);
          }
        }
      }
      
      if (wd.slidingDoorCount && wd.slidingDoorCount > 0) {
        lines.push(`• Install ${wd.slidingDoorCount} sliding glass door${wd.slidingDoorCount > 1 ? 's' : ''}`);
        if (wd.selectedSlidingDoorProduct) {
          lines.push(`   Product: ${wd.selectedSlidingDoorProduct.manufacturer} ${wd.selectedSlidingDoorProduct.product_name}`);
          if (wd.selectedSlidingDoorProduct.noa_number) {
            lines.push(`   NOA: ${wd.selectedSlidingDoorProduct.noa_number}`);
          }
        }
      }
      
      if (wd.frameMaterial) {
        lines.push(`• Frame Material: ${formatFrameMaterial(wd.frameMaterial)}`);
      }
      
      if (wd.impactRequired) {
        lines.push(`• Impact-rated products required (HVHZ zone)`);
      }
    }

    // Roofing
    if (data.roofing) {
      const rf = data.roofing;
      
      if (rf.roofType) {
        lines.push(`• Roof Type: ${formatRoofType(rf.roofType)}`);
      }
      
      if (rf.squareFootage) {
        lines.push(`• Roof Area: ${rf.squareFootage.toLocaleString()} sq ft`);
      }
      
      if (rf.existingMaterial) {
        lines.push(`• Existing Material: ${rf.existingMaterial}`);
      }
      
      if (rf.newMaterial) {
        lines.push(`• New Material: ${rf.newMaterial}`);
      }
      
      if (rf.roofColor) {
        lines.push(`• Color: ${rf.roofColor}`);
      }
      
      if (rf.selectedProducts && rf.selectedProducts.length > 0) {
        lines.push(`\nSelected Products:`);
        rf.selectedProducts.forEach(item => {
          lines.push(`• ${formatCategory(item.category)}: ${item.product.manufacturer} ${item.product.product_name}`);
          if (item.product.noa_number) {
            lines.push(`   NOA: ${item.product.noa_number}`);
          }
        });
      }
    }

    // HVAC
    if (data.hvac && Object.keys(data.hvac).length > 0) {
      lines.push(`• HVAC work specified`);
    }

    // Electrical
    if (data.electrical && Object.keys(data.electrical).length > 0) {
      lines.push(`• Electrical work specified`);
    }

    // Plumbing
    if (data.plumbing && Object.keys(data.plumbing).length > 0) {
      lines.push(`• Plumbing work specified`);
    }

    // Return formatted text if we generated lines, otherwise return original
    if (lines.length > 0) {
      return lines.join('\n');
    }

    // If JSON but no recognized structure, just return it formatted
    return scopeDescription;
  } catch {
    // Not JSON, return as-is (could be plain text description)
    return scopeDescription;
  }
}

function formatFrameMaterial(material: string): string {
  const materials: Record<string, string> = {
    'vinyl': 'Vinyl',
    'aluminum': 'Aluminum',
    'wood': 'Wood',
    'fiberglass': 'Fiberglass',
  };
  return materials[material.toLowerCase()] || material;
}

function formatRoofType(type: string): string {
  const types: Record<string, string> = {
    'shingle': 'Asphalt Shingle',
    'tile': 'Concrete/Clay Tile',
    'metal': 'Metal Roofing',
    'flat': 'Flat/Low-Slope',
    'tpo': 'TPO Membrane',
    'modified_bitumen': 'Modified Bitumen',
  };
  return types[type.toLowerCase()] || type;
}

function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    'roof_covering': 'Roof Covering',
    'underlayment': 'Underlayment',
    'fasteners': 'Fasteners',
    'flat_roofing': 'Flat Roofing',
    'deck_fasteners': 'Deck Fasteners',
    'cap_tabs': 'Cap/Tabs',
    'roofing_fasteners': 'Roofing Fasteners',
  };
  return categories[category.toLowerCase()] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
