import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface NOCData {
  // Property Info
  propertyAddress: string;
  legalDescription?: string;
  taxFolio?: string;
  city?: string;
  county: string;
  
  // Owner Info
  ownerName: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerZip?: string;
  ownerInterest?: string; // 'fee simple', 'lessee', etc.
  
  // Contractor Info
  contractorName: string;
  contractorCompany: string;
  contractorAddress?: string;
  contractorCity?: string;
  contractorState?: string;
  contractorZip?: string;
  contractorPhone?: string;
  contractorLicense?: string;
  
  // Project Info
  improvementDescription: string;
  
  // Optional Sections
  lenderName?: string;
  lenderAddress?: string;
  lenderPhone?: string;
  bondAmount?: number;
  suretyName?: string;
  suretyAddress?: string;
  suretyPhone?: string;
  
  // Dates
  expirationDate?: string; // Defaults to 1 year from recording
  designatedPerson?: string;
  designatedPersonAddress?: string;
  designatedPersonPhone?: string;
}

/**
 * Generate a Notice of Commencement PDF
 * Pre-fills all available data, leaving signature lines blank
 */
export async function generateNOC(data: NOCData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  const { width, height } = page.getSize();
  let y = height - 40;
  
  const leftMargin = 50;
  const rightMargin = width - 50;
  const lineHeight = 14;
  const sectionGap = 20;
  
  // Helper function for drawing text
  const drawText = (text: string, x: number, yPos: number, options: {
    size?: number;
    font?: typeof helvetica;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  } = {}) => {
    const { size = 10, font = helvetica, color = rgb(0, 0, 0), maxWidth } = options;
    page.drawText(text, { x, y: yPos, size, font, color });
  };
  
  const drawLine = (startX: number, startY: number, length: number) => {
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: startX + length, y: startY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  };
  
  // Prepared By Section
  drawText('Prepared By:', leftMargin, y, { size: 9, font: helveticaBold });
  y -= lineHeight;
  drawText(data.contractorCompany, leftMargin, y, { size: 9 });
  y -= lineHeight;
  if (data.contractorAddress) {
    drawText(data.contractorAddress, leftMargin, y, { size: 9 });
    y -= lineHeight;
  }
  if (data.contractorCity && data.contractorState && data.contractorZip) {
    drawText(`${data.contractorCity}, ${data.contractorState} ${data.contractorZip}`, leftMargin, y, { size: 9 });
    y -= lineHeight;
  }
  if (data.contractorPhone) {
    drawText(data.contractorPhone, leftMargin, y, { size: 9 });
    y -= lineHeight;
  }
  if (data.contractorLicense) {
    drawText(`Florida ${data.contractorLicense}`, leftMargin, y, { size: 9 });
  }
  
  y -= sectionGap * 1.5;
  
  // Title
  const title = 'NOTICE OF COMMENCEMENT';
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 16);
  drawText(title, (width - titleWidth) / 2, y, { size: 16, font: helveticaBold });
  
  y -= sectionGap * 1.5;
  
  // Intro paragraph
  const intro = 'The undersigned hereby gives notice that improvement will be made to certain real property, and in accordance with Chapter 713, Florida Statutes, the following information is provided in this Notice of Commencement.';
  drawText(intro, leftMargin, y, { size: 9 });
  
  y -= sectionGap * 1.5;
  
  // Section 1: Property Description
  drawText('1. DESCRIPTION OF PROPERTY (Legal description of the property & street address)', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText('TAX FOLIO NO:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.taxFolio || '________________________', leftMargin + 100, y, { size: 9 });
  y -= lineHeight;
  
  drawText('LEGAL DESCRIPTION:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  y -= lineHeight;
  drawText(data.legalDescription || '____________________________________________', leftMargin + 20, y, { size: 9 });
  y -= lineHeight;
  
  drawText('PROPERTY ADDRESS:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.propertyAddress, leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 2: General Description of Improvement
  drawText('2. GENERAL DESCRIPTION OF IMPROVEMENT:', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  drawText(data.improvementDescription, leftMargin + 20, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 3: Owner Information
  drawText('3. OWNER INFORMATION:', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText('a. Name and address:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  y -= lineHeight;
  drawText(data.ownerName, leftMargin + 30, y, { size: 9 });
  if (data.ownerAddress) {
    y -= lineHeight;
    drawText(data.ownerAddress, leftMargin + 30, y, { size: 9 });
  }
  if (data.ownerCity && data.ownerState && data.ownerZip) {
    y -= lineHeight;
    drawText(`${data.ownerCity}, ${data.ownerState} ${data.ownerZip}`, leftMargin + 30, y, { size: 9 });
  }
  y -= lineHeight * 1.5;
  
  drawText('b. Interest in property:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.ownerInterest || 'Fee Simple Owner', leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 4: Contractor Information
  drawText('4. CONTRACTOR INFORMATION:', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText("Contractor's Name:", leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.contractorCompany, leftMargin + 130, y, { size: 9 });
  y -= lineHeight;
  
  drawText("Contractor's Address:", leftMargin + 20, y, { size: 9, font: helveticaBold });
  const contractorFullAddress = [
    data.contractorAddress,
    data.contractorCity && data.contractorState && data.contractorZip 
      ? `${data.contractorCity}, ${data.contractorState} ${data.contractorZip}`
      : ''
  ].filter(Boolean).join(', ');
  drawText(contractorFullAddress, leftMargin + 130, y, { size: 9 });
  y -= lineHeight;
  
  drawText('Phone number:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.contractorPhone || '________________________', leftMargin + 130, y, { size: 9 });
  y -= lineHeight;
  
  drawText('License #:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.contractorLicense || '________________________', leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 5: Surety (if applicable)
  drawText('5. SURETY (if applicable):', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText('a. Amount of bond:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.bondAmount ? `$${data.bondAmount.toLocaleString()}` : 'N/A', leftMargin + 130, y, { size: 9 });
  y -= lineHeight;
  
  drawText('b. Name and address:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.suretyName || 'N/A', leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 6: Lender (if applicable)
  drawText('6. LENDER INFORMATION (if applicable):', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText("Lender's Name:", leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.lenderName || 'N/A', leftMargin + 130, y, { size: 9 });
  y -= lineHeight;
  
  drawText("Lender's Address:", leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.lenderAddress || '', leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 7: Designated Person
  drawText('7. DESIGNATED PERSON FOR SERVICE:', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  drawText('Name and address:', leftMargin + 20, y, { size: 9, font: helveticaBold });
  drawText(data.designatedPerson || data.ownerName, leftMargin + 130, y, { size: 9 });
  
  y -= sectionGap;
  
  // Section 9: Expiration Date
  drawText('9. EXPIRATION DATE:', leftMargin, y, { size: 10, font: helveticaBold });
  y -= lineHeight * 1.5;
  
  const defaultExpiration = new Date();
  defaultExpiration.setFullYear(defaultExpiration.getFullYear() + 1);
  const expirationText = data.expirationDate || defaultExpiration.toLocaleDateString();
  drawText(`This Notice of Commencement expires: ${expirationText}`, leftMargin + 20, y, { size: 9 });
  
  y -= sectionGap * 1.5;
  
  // Warning
  drawText('WARNING TO OWNER:', leftMargin, y, { size: 9, font: helveticaBold, color: rgb(0.8, 0, 0) });
  y -= lineHeight;
  const warning = 'ANY PAYMENTS MADE BY THE OWNER AFTER THE EXPIRATION OF THE NOTICE OF COMMENCEMENT ARE CONSIDERED IMPROPER PAYMENTS UNDER CHAPTER 713, PART I, SECTION 713.13, FLORIDA STATUTES, AND CAN RESULT IN YOUR PAYING TWICE FOR IMPROVEMENTS TO YOUR PROPERTY.';
  drawText(warning, leftMargin, y, { size: 7, font: helveticaOblique });
  
  y -= sectionGap * 2;
  
  // Signature section
  drawLine(leftMargin, y, 250);
  y -= lineHeight;
  drawText('(Signature of Owner or Lessee)', leftMargin, y, { size: 8 });
  
  y -= lineHeight * 2;
  
  drawLine(leftMargin, y, 250);
  y -= lineHeight;
  drawText('(Print Name and Title)', leftMargin, y, { size: 8 });
  
  y -= sectionGap * 1.5;
  
  // Notary Section
  drawText('State of Florida', leftMargin, y, { size: 9 });
  y -= lineHeight;
  drawText(`County of ${data.county}`, leftMargin, y, { size: 9 });
  
  y -= lineHeight * 1.5;
  
  drawText('The foregoing instrument was acknowledged before me by means of ☐ physical presence ☐ or online notarization,', leftMargin, y, { size: 8 });
  y -= lineHeight;
  drawText('this ______________ by ________________________, who is personally known to me or who has produced', leftMargin, y, { size: 8 });
  y -= lineHeight;
  drawText('________________________ as identification.', leftMargin, y, { size: 8 });
  
  y -= sectionGap * 1.5;
  
  // Notary signature
  drawLine(leftMargin, y, 200);
  y -= lineHeight;
  drawText('Signature of Notary Public', leftMargin, y, { size: 8 });
  
  y -= lineHeight * 2;
  drawLine(leftMargin, y, 200);
  y -= lineHeight;
  drawText('Name Typed/Printed/Stamped', leftMargin, y, { size: 8 });
  
  y -= lineHeight * 2;
  drawLine(leftMargin, y, 200);
  y -= lineHeight;
  drawText('Serial Number & Expiration Date', leftMargin, y, { size: 8 });
  
  // SEAL placeholder
  page.drawRectangle({
    x: rightMargin - 120,
    y: y + 30,
    width: 80,
    height: 80,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  page.drawText('(SEAL)', {
    x: rightMargin - 95,
    y: y + 65,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc.save();
}

/**
 * Helper to format date for NOC
 */
export function formatNOCDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
