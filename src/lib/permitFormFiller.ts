import { PDFDocument, StandardFonts, rgb, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib';

export interface PermitFormData {
  // Property Info
  property_address: string;
  property_unit?: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  pcn?: string; // Property Control Number / Tax Folio
  legal_description?: string;
  
  // Owner Info
  owner_name: string;
  owner_address?: string;
  owner_city?: string;
  owner_state?: string;
  owner_zip?: string;
  owner_phone?: string;
  owner_fax?: string;
  owner_email?: string;
  
  // Tenant Info (optional)
  tenant_name?: string;
  
  // Contractor Info
  contractor_name: string;
  contractor_company: string;
  contractor_license: string;
  contractor_address?: string;
  contractor_suite?: string;
  contractor_city?: string;
  contractor_state?: string;
  contractor_zip?: string;
  contractor_phone?: string;
  contractor_fax?: string;
  contractor_email?: string;
  
  // Project Info
  permit_type: string; // 'roofing', 'structural', 'electrical', etc.
  work_description: string;
  work_type?: string; // 'new', 'addition', 'alteration', 'repair', 'demo'
  valuation?: number;
  square_footage?: number;
  material_type?: string;
  
  // NOC specific
  improvement_description?: string;
  expiration_date?: string;
  lender_name?: string;
  lender_address?: string;
  bond_amount?: string;
  surety_name?: string;
}

export interface FieldMapping {
  [dataField: string]: string; // Maps our data field names to PDF form field names
}

// Default field mapping for Palm Beach County permit application
export const PALM_BEACH_PERMIT_MAPPING: FieldMapping = {
  owner_name: 'PROPERTY OWNER',
  tenant_name: 'TENANT',
  owner_address: 'ADDRESS',
  owner_unit: 'UNIT',
  owner_city: 'CITY',
  owner_state: 'STATE',
  owner_zip: 'ZIP',
  owner_phone: 'PHONE',
  owner_fax: 'FAX',
  owner_email: 'EMAIL',
  pcn: 'PCN',
  legal_description: 'LEGAL DESCRIPTION',
  property_address: 'PROJECT ADDRESS',
  property_city: 'CITY_2',
  work_description: 'FURTHER WORK DESCRIPTION',
  contractor_name: 'CONTRACTOR (CERT. HOLDER)',
  contractor_license: 'License',
  contractor_company: 'DBA (COMPANY NAME)',
  contractor_contact: 'Contact Person',
  contractor_address: 'ADDRESS_2',
  contractor_suite: 'STE',
  contractor_city: 'CITY_3',
  contractor_state: 'STATE_2',
  contractor_zip: 'ZIP_2',
  contractor_phone: 'PHONE_2',
  contractor_fax: 'FAX_2',
  contractor_email: 'EMAIL_2',
};

// Default field mapping for NOC form
export const NOC_FIELD_MAPPING: FieldMapping = {
  pcn: 'TAX FOLIO NO',
  legal_description: 'LEGAL DESCRIPTION',
  improvement_description: 'GENERAL DESCRIPTION OF IMPROVEMENT',
  owner_name: 'Owner Name',
  owner_address: 'Owner Address',
  contractor_name: 'Contractor Name',
  contractor_address: 'Contractor Address',
  contractor_phone: 'Contractor Phone',
  lender_name: 'Lender Name',
  lender_address: 'Lender Address',
  bond_amount: 'Bond Amount',
  surety_name: 'Surety Name',
  expiration_date: 'Expiration Date',
};

/**
 * Fill a PDF form with permit data
 */
export async function fillPermitForm(
  templateBytes: ArrayBuffer,
  formData: Partial<PermitFormData>,
  fieldMapping: FieldMapping
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  console.log('Available PDF fields:', fields.map(f => f.getName()));
  
  // Fill each mapped field
  for (const [dataField, pdfFieldName] of Object.entries(fieldMapping)) {
    const value = formData[dataField as keyof PermitFormData];
    if (value === undefined || value === null) continue;
    
    try {
      const field = form.getField(pdfFieldName);
      
      if (field instanceof PDFTextField) {
        field.setText(String(value));
      } else if (field instanceof PDFCheckBox) {
        const boolValue = value === 'true' || value === '1' || String(value) === 'true';
        if (boolValue) {
          field.check();
        }
      }
    } catch (e) {
      console.warn(`Field ${pdfFieldName} not found or error filling:`, e);
    }
  }
  
  return pdfDoc.save();
}

/**
 * Set a checkbox based on permit type (for trade selection)
 */
export async function setPermitTypeCheckbox(
  pdfDoc: PDFDocument,
  permitType: string
): Promise<void> {
  const form = pdfDoc.getForm();
  
  const tradeCheckboxMapping: Record<string, string> = {
    'roofing': 'ROOFING',
    'structural': 'STRUCTURAL',
    'electrical': 'ELECTRICAL',
    'mechanical': 'MECHANICAL',
    'plumbing': 'PLUMBING',
    'fire': 'FIRE',
    'gas': 'GAS',
  };
  
  const checkboxName = tradeCheckboxMapping[permitType.toLowerCase()];
  if (checkboxName) {
    try {
      const checkbox = form.getCheckBox(checkboxName);
      checkbox.check();
    } catch (e) {
      console.warn(`Trade checkbox ${checkboxName} not found`);
    }
  }
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return mergedPdf.save();
}

/**
 * Add page numbers to a PDF
 */
export async function addPageNumbers(
  pdfBytes: Uint8Array,
  startPage: number = 1
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const pageNum = startPage + index;
    const text = `Page ${pageNum} of ${totalPages + startPage - 1}`;
    
    page.drawText(text, {
      x: width - 100,
      y: 20,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  });
  
  return pdfDoc.save();
}

/**
 * Generate a cover sheet PDF
 */
export async function generateCoverSheet(
  formData: Partial<PermitFormData>,
  documentList: Array<{ name: string; pages: number }>,
  aiNotes?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let y = height - 50;
  
  // Title
  page.drawText('PERMIT APPLICATION PACKET', {
    x: 50,
    y,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  
  // Property Address
  page.drawText('Property Address:', {
    x: 50,
    y,
    size: 11,
    font: helveticaBold,
  });
  y -= 15;
  page.drawText(formData.property_address || 'N/A', {
    x: 50,
    y,
    size: 11,
    font: helvetica,
  });
  y -= 25;
  
  // Owner Info
  page.drawText('Property Owner:', {
    x: 50,
    y,
    size: 11,
    font: helveticaBold,
  });
  y -= 15;
  page.drawText(formData.owner_name || 'N/A', {
    x: 50,
    y,
    size: 11,
    font: helvetica,
  });
  y -= 25;
  
  // Contractor Info
  page.drawText('Licensed Contractor:', {
    x: 50,
    y,
    size: 11,
    font: helveticaBold,
  });
  y -= 15;
  page.drawText(`${formData.contractor_company || ''} - License #${formData.contractor_license || 'N/A'}`, {
    x: 50,
    y,
    size: 11,
    font: helvetica,
  });
  y -= 25;
  
  // Scope of Work
  page.drawText('Scope of Work:', {
    x: 50,
    y,
    size: 11,
    font: helveticaBold,
  });
  y -= 15;
  
  // Word wrap for work description
  const maxWidth = width - 100;
  const words = (formData.work_description || 'N/A').split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + word + ' ';
    const textWidth = helvetica.widthOfTextAtSize(testLine, 11);
    if (textWidth > maxWidth && line !== '') {
      page.drawText(line.trim(), {
        x: 50,
        y,
        size: 11,
        font: helvetica,
      });
      y -= 14;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    page.drawText(line.trim(), {
      x: 50,
      y,
      size: 11,
      font: helvetica,
    });
    y -= 14;
  }
  y -= 20;
  
  // Valuation
  if (formData.valuation) {
    page.drawText(`Estimated Value: $${formData.valuation.toLocaleString()}`, {
      x: 50,
      y,
      size: 11,
      font: helveticaBold,
    });
    y -= 25;
  }
  
  // Document Index
  y -= 10;
  page.drawText('DOCUMENT INDEX', {
    x: 50,
    y,
    size: 14,
    font: helveticaBold,
  });
  y -= 5;
  
  // Draw line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 20;
  
  let pageNum = 1;
  for (const doc of documentList) {
    const endPage = pageNum + doc.pages - 1;
    page.drawText(`${doc.name}`, {
      x: 50,
      y,
      size: 10,
      font: helvetica,
    });
    page.drawText(`Pages ${pageNum}-${endPage}`, {
      x: width - 150,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 18;
    pageNum = endPage + 1;
  }
  
  // AI Notes
  if (aiNotes) {
    y -= 20;
    page.drawText('Notes:', {
      x: 50,
      y,
      size: 11,
      font: helveticaBold,
    });
    y -= 15;
    page.drawText(aiNotes.substring(0, 200), {
      x: 50,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  
  // Footer
  page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 30,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return pdfDoc.save();
}

/**
 * Get the number of pages in a PDF
 */
export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}

/**
 * Extract form field names from a PDF (for mapping)
 */
export async function extractFormFields(pdfBytes: ArrayBuffer): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  return form.getFields().map(field => field.getName());
}
