import jsPDF from 'jspdf';
import { 
  PackageConfig, 
  formatPriceRange, 
  formatPerSquarePrice,
  PRICING_DISCLAIMER,
  ESTIMATE_VALIDITY_DAYS
} from './packagePricing';

// ============================================
// INTERFACES
// ============================================

interface FinancingPlan {
  lenderName: string;
  rate: number;
  termYears: number;
  monthlyPayment: number;
  totalCost: number;
}

interface ComparisonPackage {
  package: PackageConfig;
  estimateLow: number;
  estimateHigh: number;
  isRecommended?: boolean;
}

// NEW: Detailed line item with pricing
export interface DetailedLineItem {
  description: string;
  quantity: string;
  lowPrice: number | null;  // null = "Included"
  highPrice: number | null;
  notes?: string;
}

// NEW: Optional add-on
export interface OptionalAddOn {
  name: string;
  priceRange: string;
  description?: string;
}

// NEW: FAQ
export interface FAQ {
  question: string;
  answer: string;
}

export interface ProfessionalEstimatePdfData {
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  
  // Property Details
  roofSquares: number;
  pitch?: string;
  complexity?: string;
  
  // Selected Package
  selectedPackage: PackageConfig;
  estimateLow: number;
  estimateHigh: number;
  
  // Comparison Options (Good/Better/Best)
  comparisonPackages?: ComparisonPackage[];
  
  // Optional Data
  financing?: FinancingPlan | null;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  
  // Signature (if already signed)
  signatureData?: string | null;
  signedAt?: string | null;
  
  // Notes
  notes?: string;
  
  // NEW: Extended data for enhanced PDF
  detailedLineItems?: DetailedLineItem[];
  optionalAddOns?: OptionalAddOn[];
  exclusions?: string[];
  faqs?: FAQ[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPitchValue = (pitch: string): string => {
  const pitchMap: Record<string, string> = {
    'flat': 'Flat (0-2/12)',
    'low': 'Low Slope (3-4/12)',
    'standard': 'Standard (5-6/12)',
    'steep': 'Steep (7-8/12)',
    'verysteep': 'Very Steep (9-12/12)',
  };
  return pitchMap[pitch?.toLowerCase()] || pitch || 'Standard';
};

const formatComplexityValue = (complexity: string): string => {
  const complexityMap: Record<string, string> = {
    'simple': 'Simple (Area Off)',
    'gable': 'Gable - 2 Sided (Area On)',
    'hip': 'Hip - 4 Sided (Area On)',
    'complex': 'Complex - 10+ Facets (Area On)',
    'verycomplex': 'Very Complex - 20+ Facets (Area On)',
  };
  return complexityMap[complexity?.toLowerCase()] || complexity || 'Standard';
};

// Generate detailed line items from package config
const generateDetailedLineItems = (pkg: PackageConfig, roofSquares: number): DetailedLineItem[] => {
  const items: DetailedLineItem[] = [];
  
  // Main roofing system
  if (pkg.category === 'metal') {
    items.push({
      description: pkg.id === 'platinum' || pkg.id === 'ultimate' 
        ? '24-Gauge Standing Seam Metal Roofing (Kynar-Coated)'
        : '5V Crimp Metal Roof System',
      quantity: `${roofSquares.toFixed(1)} sq`,
      lowPrice: Math.round(roofSquares * pkg.priceLow * 0.45),
      highPrice: Math.round(roofSquares * pkg.priceHigh * 0.45),
    });
  } else if (pkg.category === 'tile') {
    items.push({
      description: 'Premium Tile Roofing System (Concrete or Clay)',
      quantity: `${roofSquares.toFixed(1)} sq`,
      lowPrice: Math.round(roofSquares * pkg.priceLow * 0.50),
      highPrice: Math.round(roofSquares * pkg.priceHigh * 0.50),
    });
  } else {
    items.push({
      description: 'Architectural Shingles with Enhanced Durability',
      quantity: `${roofSquares.toFixed(1)} sq`,
      lowPrice: Math.round(roofSquares * pkg.priceLow * 0.40),
      highPrice: Math.round(roofSquares * pkg.priceHigh * 0.40),
    });
  }
  
  // Underlayment
  items.push({
    description: pkg.tier === 'premium' || pkg.tier === 'luxury'
      ? 'High-Temperature Peel-and-Stick Underlayment'
      : 'Synthetic Underlayment System',
    quantity: `${roofSquares.toFixed(1)} sq`,
    lowPrice: Math.round(roofSquares * 80),
    highPrice: Math.round(roofSquares * 120),
  });
  
  // Ice & Water Shield
  items.push({
    description: 'Ice & Water Shield at Eaves, Valleys & Penetrations',
    quantity: 'As needed',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Valley Metal Installation
  items.push({
    description: 'Valley Metal Installation',
    quantity: 'Per valley',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Ridge Vent System
  items.push({
    description: 'Ridge Vent System for Attic Ventilation',
    quantity: 'Full length',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Drip Edge Installation
  items.push({
    description: 'Drip Edge Installation',
    quantity: 'Perimeter',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Chimney Flashing
  items.push({
    description: 'Chimney Flashing (Step & Counter)',
    quantity: 'Per chimney',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Skylight Sealing
  items.push({
    description: 'Skylight Sealing & Flashing',
    quantity: 'Per skylight',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Pipe Boot Replacements
  items.push({
    description: 'Pipe Boot Replacements',
    quantity: 'All boots',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Solar Attic Fan (premium packages)
  if (pkg.tier === 'premium' || pkg.tier === 'luxury') {
    items.push({
      description: 'Solar Attic Fan Ventilation System',
      quantity: '1-2 units',
      lowPrice: 800,
      highPrice: 1200,
    });
  }
  
  // Full Tear-Off & Disposal
  items.push({
    description: 'Full Tear-Off & Disposal of Existing Roof',
    quantity: `${roofSquares.toFixed(1)} sq`,
    lowPrice: Math.round(roofSquares * 150),
    highPrice: Math.round(roofSquares * 200),
  });
  
  // Environmental Disposal Fees
  items.push({
    description: 'Environmental Disposal Fees',
    quantity: 'Per load',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Permit Handling
  items.push({
    description: 'Permit Handling & Processing',
    quantity: 'All fees',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Code Inspections
  items.push({
    description: 'Code Inspections (All Required)',
    quantity: 'As required',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Wind-Rated Installation
  items.push({
    description: `Wind-Rated Installation (Up to ${pkg.tier === 'luxury' ? '180' : '150'} MPH)`,
    quantity: 'Labor',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Fire Barrier Underlayment
  items.push({
    description: 'Fire Barrier Underlayment (Where Required)',
    quantity: 'If required',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Final Cleanup
  items.push({
    description: 'Final Cleanup & Site Restoration',
    quantity: 'Complete',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Magnetic Nail Sweep
  items.push({
    description: 'Magnetic Nail Sweep (Entire Property)',
    quantity: 'Complete',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Attic Insulation Inspection
  items.push({
    description: 'Attic Insulation Inspection',
    quantity: 'Inspection',
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  // Gutter Integration
  if (pkg.tier === 'premium' || pkg.tier === 'luxury') {
    items.push({
      description: 'Gutter Integration (If Applicable)',
      quantity: 'As needed',
      lowPrice: null,
      highPrice: null,
      notes: 'Quote separately',
    });
  }
  
  // Manufacturer Warranty Package
  items.push({
    description: 'Manufacturer & Workmanship Warranty Package',
    quantity: pkg.warranty.split(',')[0],
    lowPrice: null,
    highPrice: null,
    notes: 'Included',
  });
  
  return items;
};

// Default optional add-ons
const getDefaultOptionalAddOns = (): OptionalAddOn[] => [
  { name: 'Solar Panel Integration', priceRange: '$5,000 - $7,000', description: 'Prepare roof for solar installation' },
  { name: 'Extended Warranty (+10 years)', priceRange: '+$1,500', description: 'Additional coverage period' },
  { name: 'Custom Roof Color Selection', priceRange: '+$2,000', description: 'Premium color options' },
  { name: 'Rainwater Harvesting System', priceRange: '$3,000 - $4,500', description: 'Collect and store rainwater' },
  { name: 'Attic Insulation Upgrade (R-38)', priceRange: '$1,500 - $2,500', description: 'Improve energy efficiency' },
  { name: 'Gutter Guard Installation', priceRange: '$800 - $1,200', description: 'Prevent debris buildup' },
  { name: 'Skylight Installation', priceRange: '$1,200 - $2,500/each', description: 'Add natural light' },
];

// Default exclusions
const getDefaultExclusions = (): string[] => [
  'Major structural repairs beyond included allowances',
  'Electrical work or modifications',
  'HVAC system modifications',
  'Interior ceiling repairs',
  'Tree trimming or removal',
  'Landscaping restoration',
  'Mold remediation (if discovered)',
  'Asbestos abatement (if present)',
];

// Default FAQs
const getDefaultFaqs = (): FAQ[] => [
  { question: 'What if the roof size changes after inspection?', answer: 'The final price will be adjusted proportionally based on actual measurements.' },
  { question: 'How long is this estimate valid?', answer: `This estimate is valid for ${ESTIMATE_VALIDITY_DAYS} days from the date issued.` },
  { question: 'What happens if we find additional damage?', answer: 'We will document and discuss any discoveries with you before proceeding.' },
  { question: 'Do you offer financing options?', answer: 'Yes, we offer multiple financing options with competitive rates.' },
  { question: 'What about my warranty if I sell my home?', answer: 'Our warranties are transferable to the new homeowner.' },
  { question: 'How do I schedule my inspection?', answer: 'Call us at (214) 998-2879 or reply to your confirmation email.' },
];

// ============================================
// PAGE RENDERING FUNCTIONS
// ============================================

const addPageHeader = (doc: jsPDF, title: string, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header gradient effect (simulated with two rectangles)
  doc.setFillColor(20, 55, 40); // Darker green at top
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFillColor(30, 70, 50); // Forest green
  doc.rect(0, 18, pageWidth, 17, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GLOBAL CONTRACTOR NETWORK', 20, 16);
  
  // Page title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 20, 28);
  
  // Page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, 28, { align: 'right' });
  
  // Gold accent line
  doc.setFillColor(218, 165, 32);
  doc.rect(0, 35, pageWidth, 3, 'F');
};

const addPageFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Questions? Call (214) 998-2879 | www.globalcontractor.network', pageWidth / 2, pageHeight - 10, { align: 'center' });
};

// Check if we need a page break
const checkPageBreak = (doc: jsPDF, currentY: number, requiredHeight: number, pageNum: number, totalPages: number, title: string): { y: number; pageNum: number } => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + requiredHeight > pageHeight - 25) {
    doc.addPage();
    addPageHeader(doc, title + ' (CONTINUED)', pageNum + 1, totalPages);
    return { y: 50, pageNum: pageNum + 1 };
  }
  return { y: currentY, pageNum };
};

// Draw a table with proper formatting
const drawTable = (
  doc: jsPDF, 
  headers: string[], 
  rows: string[][], 
  startX: number, 
  startY: number, 
  colWidths: number[],
  pageNum: number,
  totalPages: number,
  title: string
): { y: number; pageNum: number } => {
  const rowHeight = 10;
  const headerHeight = 12;
  let y = startY;
  let currentPageNum = pageNum;
  
  // Draw header row
  doc.setFillColor(30, 70, 50);
  doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 3, y + 8);
    x += colWidths[i];
  });
  
  y += headerHeight;
  
  // Draw data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  rows.forEach((row, rowIndex) => {
    // Check for page break
    const pageCheck = checkPageBreak(doc, y, rowHeight + 2, currentPageNum, totalPages, title);
    if (pageCheck.pageNum !== currentPageNum) {
      y = pageCheck.y;
      currentPageNum = pageCheck.pageNum;
      
      // Redraw header on new page
      doc.setFillColor(30, 70, 50);
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let headerX = startX;
      headers.forEach((header, i) => {
        doc.text(header, headerX + 3, y + 8);
        headerX += colWidths[i];
      });
      y += headerHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }
    
    // Alternating row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    }
    
    doc.setTextColor(50, 50, 50);
    x = startX;
    row.forEach((cell, i) => {
      // Right-align currency columns (last two)
      if (i >= 2 && cell.startsWith('$')) {
        doc.text(cell, x + colWidths[i] - 3, y + 7, { align: 'right' });
      } else {
        const truncatedCell = cell.length > 45 ? cell.substring(0, 42) + '...' : cell;
        doc.text(truncatedCell, x + 3, y + 7);
      }
      x += colWidths[i];
    });
    
    y += rowHeight;
  });
  
  return { y, pageNum: currentPageNum };
};

// ============================================
// MAIN PDF GENERATION FUNCTION
// ============================================

export const generateProfessionalEstimatePdf = (data: ProfessionalEstimatePdfData): { blob: Blob; base64: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Calculate total pages: Summary + Comparison (if exists) + Breakdown + Options & Terms + Signature
  const hasComparison = data.comparisonPackages && data.comparisonPackages.length >= 3;
  const totalPages = hasComparison ? 5 : 4;
  
  // Get or generate extended data
  const detailedLineItems = data.detailedLineItems || generateDetailedLineItems(data.selectedPackage, data.roofSquares);
  const optionalAddOns = data.optionalAddOns || getDefaultOptionalAddOns();
  const exclusions = data.exclusions || getDefaultExclusions();
  const faqs = data.faqs || getDefaultFaqs();
  
  let currentPage = 1;
  
  // ============================================
  // PAGE 1: ESTIMATE SUMMARY
  // ============================================
  addPageHeader(doc, 'ROOFING ESTIMATE SUMMARY', currentPage, totalPages);
  let y = 50;
  
  // Date and validity
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Valid for ${ESTIMATE_VALIDITY_DAYS} days`, pageWidth - margin, y + 6, { align: 'right' });
  
  // Customer Info Box
  const boxWidth = (pageWidth - margin * 2 - 10) / 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, boxWidth, 48, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED FOR:', margin + 8, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.customerName, margin + 8, y + 24);
  doc.setFontSize(9);
  const addressLines = doc.splitTextToSize(data.propertyAddress, boxWidth - 16);
  addressLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 8, y + 32 + (i * 6));
  });
  doc.text(data.customerEmail, margin + 8, y + 44);
  
  // Property Details Box
  const propX = margin + boxWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(propX, y, boxWidth, 48, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY DETAILS:', propX + 8, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${data.roofSquares.toFixed(1)} Roof Squares`, propX + 8, y + 24);
  doc.setFontSize(9);
  if (data.pitch) doc.text(`Pitch: ${formatPitchValue(data.pitch)}`, propX + 8, y + 32);
  if (data.complexity) doc.text(`Complexity: ${formatComplexityValue(data.complexity)}`, propX + 8, y + 40);
  
  y += 60;
  
  // Recommended Package Hero Section
  doc.setFillColor(30, 70, 50);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 70, 5, 5, 'F');
  
  // Gold badge with "R"
  doc.setFillColor(218, 165, 32);
  doc.circle(margin + 25, y + 25, 14, 'F');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('R', margin + 20, y + 30);
  
  doc.setTextColor(218, 165, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED PACKAGE', margin + 48, y + 16);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(data.selectedPackage.name.toUpperCase(), margin + 48, y + 32);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatPerSquarePrice(data.selectedPackage)} per square`, margin + 48, y + 45);
  
  // Price Range (right side)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPriceRange(data.estimateLow, data.estimateHigh), pageWidth - margin - 10, y + 35, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Estimated Price Range', pageWidth - margin - 10, y + 48, { align: 'right' });
  
  // Calculation breakdown
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(
    `Based on: ${data.roofSquares.toFixed(1)} squares × $${data.selectedPackage.priceLow.toLocaleString()}-$${data.selectedPackage.priceHigh.toLocaleString()}/sq`,
    margin + 48, y + 60
  );
  
  y += 82;
  
  // Scheduled Appointment (if exists)
  if (data.appointmentDate && data.appointmentTime) {
    doc.setFillColor(224, 247, 250); // Light blue
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHEDULED APPOINTMENT', margin + 10, y + 12);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.appointmentDate} at ${data.appointmentTime}`, margin + 10, y + 22);
    doc.text(`Type: ${data.appointmentType === 'zoom' ? 'Zoom Consultation' : 'In-Person Visit'}`, margin + 120, y + 22);
    
    y += 36;
  }
  
  // Financing (if selected)
  if (data.financing) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 3, 3, 'F');
    
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCING OPTION SELECTED', margin + 10, y + 12);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.financing.lenderName} - ${data.financing.rate}% APR for ${data.financing.termYears} years`, margin + 10, y + 22);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(`Est. Monthly Payment: ${formatCurrency(data.financing.monthlyPayment)}/mo`, pageWidth - margin - 10, y + 22, { align: 'right' });
    
    y += 40;
  }
  
  // Package Highlights
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PACKAGE HIGHLIGHTS', margin, y);
  y += 10;
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Display highlights in two columns
  const highlights = data.selectedPackage.highlights;
  const midpoint = Math.ceil(highlights.length / 2);
  const leftHighlights = highlights.slice(0, midpoint);
  const rightHighlights = highlights.slice(midpoint);
  
  leftHighlights.forEach((highlight, i) => {
    doc.setTextColor(30, 70, 50);
    doc.text('✓', margin + 5, y + (i * 8));
    doc.setTextColor(50, 50, 50);
    doc.text(highlight, margin + 12, y + (i * 8));
  });
  
  rightHighlights.forEach((highlight, i) => {
    doc.setTextColor(30, 70, 50);
    doc.text('✓', margin + 95, y + (i * 8));
    doc.setTextColor(50, 50, 50);
    doc.text(highlight, margin + 102, y + (i * 8));
  });
  
  addPageFooter(doc);
  
  // ============================================
  // PAGE 2: GOOD/BETTER/BEST COMPARISON (if available)
  // ============================================
  if (hasComparison) {
    currentPage++;
    doc.addPage();
    addPageHeader(doc, 'COMPARE YOUR OPTIONS', currentPage, totalPages);
    y = 50;
    
    const colWidth = (pageWidth - margin * 2 - 20) / 3;
    const packages = data.comparisonPackages!.slice(0, 3);
    const tierLabels = ['GOOD', 'BETTER', 'BEST'];
    const tierColors = [
      { bg: [205, 127, 50], text: [255, 255, 255] },     // Bronze
      { bg: [192, 192, 192], text: [50, 50, 50] },       // Silver
      { bg: [218, 165, 32], text: [50, 50, 50] }         // Gold
    ];
    
    packages.forEach((pkg, i) => {
      const x = margin + (i * (colWidth + 10));
      const isRecommended = pkg.isRecommended || pkg.package.id === data.selectedPackage.id;
      
      // Card background with optional highlight
      if (isRecommended) {
        doc.setFillColor(30, 70, 50);
        doc.roundedRect(x - 2, y - 2, colWidth + 4, 160, 5, 5, 'F');
      }
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colWidth, 155, 4, 4, 'F');
      
      // Tier badge header
      doc.setFillColor(tierColors[i].bg[0], tierColors[i].bg[1], tierColors[i].bg[2]);
      doc.roundedRect(x, y, colWidth, 25, 4, 4, 'F');
      doc.rect(x, y + 20, colWidth, 5, 'F');
      
      doc.setTextColor(tierColors[i].text[0], tierColors[i].text[1], tierColors[i].text[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(tierLabels[i], x + colWidth / 2, y + 10, { align: 'center' });
      doc.setFontSize(8);
      doc.text(pkg.package.displayName, x + colWidth / 2, y + 18, { align: 'center' });
      
      // Recommended badge
      if (isRecommended) {
        doc.setFillColor(218, 165, 32);
        doc.circle(x + colWidth - 10, y - 5, 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('R', x + colWidth - 13.5, y - 2);
      }
      
      // Price per square
      doc.setTextColor(30, 70, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(formatPerSquarePrice(pkg.package), x + colWidth / 2, y + 42, { align: 'center' });
      
      // Total estimate
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Estimated Total:', x + colWidth / 2, y + 54, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatPriceRange(pkg.estimateLow, pkg.estimateHigh), x + colWidth / 2, y + 64, { align: 'center' });
      
      // Key features (first 5)
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      const keyFeatures = pkg.package.lineItems.slice(0, 5);
      keyFeatures.forEach((item, j) => {
        const shortDesc = item.description.length > 30 
          ? item.description.substring(0, 27) + '...'
          : item.description;
        doc.text(`✓ ${shortDesc}`, x + 5, y + 80 + (j * 10));
      });
      
      // Warranty
      doc.setFontSize(7);
      doc.setTextColor(30, 70, 50);
      doc.setFont('helvetica', 'bold');
      doc.text(pkg.package.warranty.split(',')[0], x + colWidth / 2, y + 145, { align: 'center' });
    });
    
    y += 170;
    
    // Legend
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('R = Recommended for your home based on property assessment', margin, y);
    
    addPageFooter(doc);
  }
  
  // ============================================
  // PAGE 3: DETAILED BREAKDOWN
  // ============================================
  currentPage++;
  doc.addPage();
  addPageHeader(doc, `${data.selectedPackage.name.toUpperCase()} - DETAILED BREAKDOWN`, currentPage, totalPages);
  y = 50;
  
  // Pricing Methodology Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICING METHODOLOGY', margin + 10, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Your estimate is calculated as:', margin + 10, y + 22);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  const calculationText = `${data.roofSquares.toFixed(1)} Roof Squares × $${data.selectedPackage.priceLow.toLocaleString()}-$${data.selectedPackage.priceHigh.toLocaleString()} per square = ${formatPriceRange(data.estimateLow, data.estimateHigh)}`;
  doc.text(calculationText, margin + 10, y + 32);
  
  y += 48;
  
  // What's Included Table
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("WHAT'S INCLUDED", margin, y);
  y += 8;
  
  // Prepare table data
  const tableHeaders = ['Item Description', 'Qty/Notes', 'Low Est.', 'High Est.'];
  const tableRows: string[][] = detailedLineItems.map(item => [
    item.description,
    item.quantity,
    item.lowPrice !== null ? formatCurrency(item.lowPrice) : (item.notes || 'Included'),
    item.highPrice !== null ? formatCurrency(item.highPrice) : '',
  ]);
  
  const colWidths = [90, 35, 25, 25];
  const tableResult = drawTable(doc, tableHeaders, tableRows, margin, y, colWidths, currentPage, totalPages, 'DETAILED BREAKDOWN');
  y = tableResult.y + 10;
  currentPage = tableResult.pageNum;
  
  // Check if we need a new page for allowances
  const pageCheck1 = checkPageBreak(doc, y, 60, currentPage, totalPages, 'DETAILED BREAKDOWN');
  y = pageCheck1.y;
  currentPage = pageCheck1.pageNum;
  
  // Included Allowances
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INCLUDED ALLOWANCES', margin, y);
  y += 8;
  
  const allowanceHeight = data.selectedPackage.allowances.length * 12 + 12;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, pageWidth - margin * 2, allowanceHeight, 3, 3, 'F');
  
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.selectedPackage.allowances.forEach((allowance, i) => {
    doc.text(`• ${allowance.description}: ${allowance.limit}`, margin + 10, y + 10 + (i * 12));
  });
  
  y += allowanceHeight + 10;
  
  // Check for page break before warranty section
  const pageCheck2 = checkPageBreak(doc, y, 40, currentPage, totalPages, 'DETAILED BREAKDOWN');
  y = pageCheck2.y;
  currentPage = pageCheck2.pageNum;
  
  // Warranty & Installation Time (side by side)
  const halfWidth = (pageWidth - margin * 2 - 10) / 2;
  
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, halfWidth, 32, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('WARRANTY', margin + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8);
  const warrantyLines = doc.splitTextToSize(data.selectedPackage.warranty, halfWidth - 20);
  warrantyLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 10, y + 22 + (i * 6));
  });
  
  const installX = margin + halfWidth + 10;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(installX, y, halfWidth, 32, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTALLATION TIME', installX + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8);
  doc.text(data.selectedPackage.installDays, installX + 10, y + 22);
  
  addPageFooter(doc);
  
  // ============================================
  // PAGE 4: ADDITIONAL OPTIONS & TERMS
  // ============================================
  currentPage++;
  doc.addPage();
  addPageHeader(doc, 'ADDITIONAL OPTIONS & TERMS', currentPage, totalPages);
  y = 50;
  
  // Optional Add-Ons Section
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OPTIONAL ADD-ONS', margin, y);
  y += 8;
  
  // Add-ons table
  const addOnHeaders = ['Add-On', 'Price Range', 'Description'];
  const addOnRows: string[][] = optionalAddOns.map(addon => [
    addon.name,
    addon.priceRange,
    addon.description || '',
  ]);
  const addOnColWidths = [65, 45, 65];
  const addOnResult = drawTable(doc, addOnHeaders, addOnRows, margin, y, addOnColWidths, currentPage, totalPages, 'ADDITIONAL OPTIONS');
  y = addOnResult.y + 15;
  currentPage = addOnResult.pageNum;
  
  // Exclusions Section
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXCLUSIONS', margin, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('(Items NOT included in this estimate)', margin + 55, y);
  y += 8;
  
  const exclusionHeight = Math.ceil(exclusions.length / 2) * 10 + 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, exclusionHeight, 3, 3, 'F');
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const midExclusions = Math.ceil(exclusions.length / 2);
  exclusions.slice(0, midExclusions).forEach((exclusion, i) => {
    doc.text(`• ${exclusion}`, margin + 8, y + 10 + (i * 10));
  });
  exclusions.slice(midExclusions).forEach((exclusion, i) => {
    doc.text(`• ${exclusion}`, margin + 95, y + 10 + (i * 10));
  });
  
  y += exclusionHeight + 12;
  
  // Terms & Conditions
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS', margin, y);
  y += 10;
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const terms = [
    'Payment: 30% deposit upon agreement, 40% at project midpoint, 30% upon completion.',
    'Change Orders: Any changes require written approval and may affect pricing and timeline.',
    'Cancellation: Deposit refundable within 3 business days of signing.',
    'Insurance: Contractor maintains full liability and workers compensation coverage.',
    'Warranty: Coverage begins upon project completion and passing final inspection.',
  ];
  
  terms.forEach((term, i) => {
    doc.text(`${i + 1}. ${term}`, margin, y + (i * 10));
  });
  
  y += terms.length * 10 + 10;
  
  // FAQs
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FREQUENTLY ASKED QUESTIONS', margin, y);
  y += 10;
  
  doc.setFontSize(8);
  faqs.slice(0, 4).forEach((faq, i) => {
    doc.setTextColor(30, 70, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`Q: ${faq.question}`, margin, y);
    y += 6;
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    const answerLines = doc.splitTextToSize(`A: ${faq.answer}`, pageWidth - margin * 2);
    answerLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  });
  
  addPageFooter(doc);
  
  // ============================================
  // PAGE 5: ESTIMATE APPROVAL & AUTHORIZATION
  // ============================================
  currentPage++;
  doc.addPage();
  addPageHeader(doc, 'ESTIMATE APPROVAL & AUTHORIZATION', currentPage, totalPages);
  y = 55;
  
  // Agreement text
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const agreementText = `By signing below, I acknowledge that I have reviewed this estimate and authorize Global Contractor Network to proceed with scheduling my roofing consultation. I understand that this is an estimate and the final price will be confirmed after an on-site inspection.`;
  const agreementLines = doc.splitTextToSize(agreementText, pageWidth - margin * 2);
  agreementLines.forEach((line: string, i: number) => {
    doc.text(line, margin, y + (i * 7));
  });
  
  y += agreementLines.length * 7 + 15;
  
  // Summary box before signature
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE SUMMARY:', margin + 10, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Package: ${data.selectedPackage.name}`, margin + 10, y + 22);
  doc.text(`Estimated Range: ${formatPriceRange(data.estimateLow, data.estimateHigh)}`, margin + 10, y + 30);
  doc.text(`Property: ${data.propertyAddress}`, margin + 100, y + 22);
  
  y += 45;
  
  // Signature Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 55, 3, 3, 'S');
  
  if (data.signatureData) {
    try {
      doc.addImage(data.signatureData, 'PNG', margin + 10, y + 5, 100, 40);
    } catch (e) {
      console.error('Failed to add signature image:', e);
    }
  } else {
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('SIGNATURE', pageWidth / 2, y + 30, { align: 'center' });
  }
  
  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(margin + 10, y + 45, pageWidth - margin - 10, y + 45);
  
  y += 65;
  
  // Printed name and date
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Printed Name:', margin, y);
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 32, y, margin + 100, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customerName, margin + 34, y - 2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', margin + 110, y);
  doc.line(margin + 122, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'bold');
  const signDate = data.signedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(signDate, margin + 124, y - 2);
  
  y += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Property Address:', margin, y);
  doc.line(margin + 40, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.propertyAddress, margin + 42, y - 2);
  
  y += 25;
  
  // Consent checkboxes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  doc.rect(margin, y, 4, 4);
  doc.text('I agree to receive updates via email and SMS regarding my estimate and appointment.', margin + 8, y + 3);
  
  y += 12;
  
  doc.rect(margin, y, 4, 4);
  doc.text('I understand this is an estimate, not a binding contract. Final pricing confirmed after inspection.', margin + 8, y + 3);
  
  y += 25;
  
  // Contact info footer
  doc.setFillColor(30, 70, 50);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("Questions? We're here to help!", pageWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Call (214) 998-2879 | Email: info@globalcontractor.network', pageWidth / 2, y + 21, { align: 'center' });
  
  addPageFooter(doc);
  
  // Generate output
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];
  
  return { blob, base64 };
};

export const downloadProfessionalPdf = (blob: Blob, customerName: string) => {
  const filename = `roofing-estimate-${customerName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
