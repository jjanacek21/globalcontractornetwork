import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';

export interface ComplianceStatementData {
  // Property Info
  propertyAddress: string;
  city: string;
  county: string;
  zipCode?: string;
  parcelNumber?: string;
  
  // Owner Info
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  
  // Contractor Info
  contractorName: string;
  contractorCompany: string;
  contractorLicense: string;
  contractorPhone?: string;
  contractorEmail?: string;
  
  // Project Details
  scopeOfWork: string;
  roofSize: number;
  roofSizeUnit: 'sqft' | 'squares';
  pitch: string;
  existingMaterial: string;
  newMaterial: string;
  
  // Section 1524 Compliance
  isHVHZ: boolean;
  yearBuilt?: number;
  buildingType: 'single_family' | 'multi_family' | 'commercial';
  hasExposedCeilings: boolean;
  hasPondingWater?: boolean;
  requiresOverflowScuppers?: boolean;
  deckAttachmentConfirmed: boolean;
  
  // Fastener Pattern
  fastenerPattern?: {
    zone_field: string;
    zone_perimeter: string;
    zone_edge: string;
    nail_type: string;
  };
  
  // Product Approvals
  underlaymentNOA?: string;
  underlaymentProduct?: string;
  coveringNOA?: string;
  coveringProduct?: string;
  fastenerNOA?: string;
  
  // Dates
  permitDate?: string;
  estimatedStartDate?: string;
}

/**
 * Generate a Roofing Compliance Statement PDF
 * Includes HVHZ-specific language per FBC Section 1524
 */
export async function generateComplianceStatementPdf(
  data: ComplianceStatementData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const leftMargin = 50;
  const rightMargin = width - 50;
  let y = height - 50;
  
  // Helper functions
  const drawText = (text: string, x: number, yPos: number, options: { 
    font?: typeof helvetica; 
    size?: number; 
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  } = {}) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: options.size || 10,
      font: options.font || helvetica,
      color: options.color || rgb(0, 0, 0),
      maxWidth: options.maxWidth || rightMargin - x,
    });
  };
  
  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: leftMargin, y: yPos },
      end: { x: rightMargin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  };
  
  const drawCheckbox = (x: number, yPos: number, checked: boolean) => {
    // Draw box
    page.drawRectangle({
      x,
      y: yPos - 2,
      width: 10,
      height: 10,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    // Draw X if checked (using ASCII-compatible approach)
    if (checked) {
      drawText('X', x + 2, yPos, { font: helveticaBold, size: 8 });
    }
  };
  
  // === HEADER ===
  drawText('ROOFING COMPLIANCE STATEMENT', leftMargin, y, { 
    font: helveticaBold, 
    size: 16,
    color: rgb(0.1, 0.2, 0.4)
  });
  y -= 15;
  
  if (data.isHVHZ) {
    drawText('HIGH-VELOCITY HURRICANE ZONE (HVHZ) - FBC 8th Edition', leftMargin, y, { 
      size: 10,
      color: rgb(0.6, 0.2, 0.2)
    });
    y -= 15;
  }
  
  drawText(`${data.county} County, Florida`, leftMargin, y, { size: 10 });
  y -= 25;
  
  drawLine(y);
  y -= 15;
  
  // === PROPERTY INFORMATION ===
  drawText('1. PROPERTY INFORMATION', leftMargin, y, { font: helveticaBold, size: 11 });
  y -= 18;
  
  drawText(`Property Address: ${data.propertyAddress}`, leftMargin + 10, y);
  y -= 14;
  drawText(`City: ${data.city}    County: ${data.county}    Zip: ${data.zipCode || 'N/A'}`, leftMargin + 10, y);
  y -= 14;
  if (data.parcelNumber) {
    drawText(`Parcel/Folio Number: ${data.parcelNumber}`, leftMargin + 10, y);
    y -= 14;
  }
  drawText(`Owner: ${data.ownerName}`, leftMargin + 10, y);
  y -= 18;
  
  drawLine(y);
  y -= 15;
  
  // === CONTRACTOR CERTIFICATION ===
  drawText('2. CONTRACTOR CERTIFICATION', leftMargin, y, { font: helveticaBold, size: 11 });
  y -= 18;
  
  drawText(`Contractor: ${data.contractorCompany}`, leftMargin + 10, y);
  y -= 14;
  drawText(`License Number: ${data.contractorLicense}    State: FL`, leftMargin + 10, y);
  y -= 14;
  drawText(`Qualifier/Contact: ${data.contractorName}`, leftMargin + 10, y);
  if (data.contractorPhone) {
    y -= 14;
    drawText(`Phone: ${data.contractorPhone}    Email: ${data.contractorEmail || 'N/A'}`, leftMargin + 10, y);
  }
  y -= 18;
  
  drawLine(y);
  y -= 15;
  
  // === SCOPE OF WORK ===
  drawText('3. SCOPE OF WORK', leftMargin, y, { font: helveticaBold, size: 11 });
  y -= 18;
  
  const roofSizeDisplay = data.roofSizeUnit === 'squares' 
    ? `${data.roofSize} squares (${data.roofSize * 100} sq ft)`
    : `${data.roofSize.toLocaleString()} sq ft (${(data.roofSize / 100).toFixed(1)} squares)`;
  
  drawText(`Roof Size: ${roofSizeDisplay}`, leftMargin + 10, y);
  y -= 14;
  drawText(`Pitch: ${data.pitch}    Existing Material: ${data.existingMaterial}`, leftMargin + 10, y);
  y -= 14;
  drawText(`New Material: ${data.newMaterial}`, leftMargin + 10, y);
  y -= 14;
  drawText(`Description: ${data.scopeOfWork.substring(0, 100)}${data.scopeOfWork.length > 100 ? '...' : ''}`, leftMargin + 10, y);
  y -= 18;
  
  drawLine(y);
  y -= 15;
  
  // === SECTION 1524 DISCLOSURES (HVHZ) ===
  if (data.isHVHZ) {
    drawText('4. SECTION 1524 OWNER NOTIFICATION', leftMargin, y, { font: helveticaBold, size: 11 });
    y -= 18;
    
    drawText('The following conditions apply per Florida Building Code Section 1524:', leftMargin + 10, y, { size: 9 });
    y -= 16;
    
    // Checkbox items
    const section1524Items = [
      { checked: true, text: 'Aesthetics/Workmanship Reserved - Owner acknowledges contractor not responsible for color matching' },
      { checked: data.yearBuilt !== undefined && data.yearBuilt < 1994, text: `Renailing Wood Decks Required - Structure built ${data.yearBuilt || 'before 1994'}` },
      { checked: data.buildingType === 'multi_family', text: 'Common Roofs Reserved - Multi-family building, common area restrictions apply' },
      { checked: data.hasExposedCeilings, text: 'Exposed Ceilings - No attic access, limited deck inspection possible' },
      { checked: data.hasPondingWater || false, text: 'Ponding Water Reserved - Flat roof drainage issues noted' },
      { checked: data.requiresOverflowScuppers || false, text: 'Overflow Scuppers Required - Secondary drainage installation required' },
    ];
    
    for (const item of section1524Items) {
      drawCheckbox(leftMargin + 10, y, item.checked);
      drawText(item.text, leftMargin + 30, y, { size: 9 });
      y -= 14;
    }
    y -= 8;
    
    drawLine(y);
    y -= 15;
    
    // === DECK ATTACHMENT STATEMENT ===
    drawText('5. DECK ATTACHMENT CONFIRMATION (HVHZ)', leftMargin, y, { font: helveticaBold, size: 11 });
    y -= 18;
    
    drawCheckbox(leftMargin + 10, y, data.deckAttachmentConfirmed);
    drawText('I confirm that roof deck attachment complies with FBC HVHZ requirements:', leftMargin + 30, y, { size: 9 });
    y -= 16;
    
    drawText('- 8d ring-shank nails at 6" on center in the field', leftMargin + 35, y, { size: 9 });
    y -= 12;
    drawText('- 8d ring-shank nails at 4" on center at edges/perimeter', leftMargin + 35, y, { size: 9 });
    y -= 12;
    drawText('- All fasteners driven flush with deck surface', leftMargin + 35, y, { size: 9 });
    y -= 18;
    
    drawLine(y);
    y -= 15;
    
    // === FASTENER PATTERN ===
    if (data.fastenerPattern) {
      drawText('6. FASTENER PATTERN SCHEDULE', leftMargin, y, { font: helveticaBold, size: 11 });
      y -= 18;
      
      drawText(`Zone 1 (Field): ${data.fastenerPattern.zone_field}`, leftMargin + 10, y, { size: 9 });
      y -= 12;
      drawText(`Zone 2 (Perimeter): ${data.fastenerPattern.zone_perimeter}`, leftMargin + 10, y, { size: 9 });
      y -= 12;
      drawText(`Zone 3 (Edge/Corner): ${data.fastenerPattern.zone_edge}`, leftMargin + 10, y, { size: 9 });
      y -= 12;
      drawText(`Nail Type: ${data.fastenerPattern.nail_type}`, leftMargin + 10, y, { size: 9 });
      y -= 18;
      
      drawLine(y);
      y -= 15;
    }
  }
  
  // === PRODUCT APPROVALS ===
  const sectionNum = data.isHVHZ ? (data.fastenerPattern ? 7 : 6) : 4;
  drawText(`${sectionNum}. PRODUCT APPROVALS REFERENCED`, leftMargin, y, { font: helveticaBold, size: 11 });
  y -= 18;
  
  if (data.underlaymentProduct) {
    drawText(`Underlayment: ${data.underlaymentProduct} - ${data.underlaymentNOA || 'FL Approval'}`, leftMargin + 10, y, { size: 9 });
    y -= 12;
  }
  if (data.coveringProduct) {
    drawText(`Roof Covering: ${data.coveringProduct} - ${data.coveringNOA || 'FL Approval'}`, leftMargin + 10, y, { size: 9 });
    y -= 12;
  }
  if (data.fastenerNOA) {
    drawText(`Fasteners: NOA ${data.fastenerNOA}`, leftMargin + 10, y, { size: 9 });
    y -= 12;
  }
  y -= 20;
  
  // === SIGNATURE BLOCKS ===
  drawLine(y);
  y -= 25;
  
  drawText('SIGNATURES', leftMargin, y, { font: helveticaBold, size: 11 });
  y -= 25;
  
  // Owner signature
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: leftMargin + 200, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  drawText('Property Owner Signature', leftMargin, y - 12, { size: 8 });
  drawText('Date: _____________', leftMargin + 220, y, { size: 9 });
  y -= 35;
  
  // Contractor signature
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: leftMargin + 200, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  drawText('Contractor/Qualifier Signature', leftMargin, y - 12, { size: 8 });
  drawText('Date: _____________', leftMargin + 220, y, { size: 9 });
  y -= 35;
  
  // === FOOTER ===
  page.drawText(`Generated: ${new Date().toLocaleDateString()} | Permit Queens - Florida Permit Expediting`, {
    x: leftMargin,
    y: 30,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc.save();
}

/**
 * Generate Section 1524 checkboxes based on project data
 */
export function evaluateSection1524Checkboxes(data: ComplianceStatementData): Record<string, boolean> {
  return {
    aesthetics_reserved: true, // Always checked
    renailing_wood_decks: data.yearBuilt !== undefined && data.yearBuilt < 1994,
    common_roofs_reserved: data.buildingType === 'multi_family',
    exposed_ceilings: data.hasExposedCeilings,
    ponding_water_reserved: data.pitch === 'flat' && (data.hasPondingWater || false),
    overflow_scuppers: data.pitch === 'flat' && (data.requiresOverflowScuppers || false),
    deck_attachment_confirmed: data.deckAttachmentConfirmed,
  };
}
