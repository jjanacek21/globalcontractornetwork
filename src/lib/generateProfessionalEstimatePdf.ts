import jsPDF from 'jspdf';
import { 
  PackageConfig, 
  formatPriceRange, 
  formatPerSquarePrice,
  PRICING_DISCLAIMER,
  ESTIMATE_VALIDITY_DAYS
} from './packagePricing';

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
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const addPageHeader = (doc: jsPDF, title: string, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header bar
  doc.setFillColor(30, 70, 50); // Deep forest green
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GLOBAL CONTRACTOR NETWORK', 20, 18);
  
  // Page title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 20, 28);
  
  // Page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, 28, { align: 'right' });
  
  // Gold accent line
  doc.setFillColor(218, 165, 32); // Gold
  doc.rect(0, 35, pageWidth, 3, 'F');
};

const addPageFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Questions? Call (214) 998-2879 | www.globalcontractor.network', pageWidth / 2, pageHeight - 10, { align: 'center' });
};

export const generateProfessionalEstimatePdf = (data: ProfessionalEstimatePdfData): { blob: Blob; base64: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const totalPages = data.comparisonPackages ? 4 : 3;
  
  // ============================================
  // PAGE 1: SUMMARY
  // ============================================
  addPageHeader(doc, 'ROOFING ESTIMATE SUMMARY', 1, totalPages);
  let y = 50;
  
  // Date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Valid for ${ESTIMATE_VALIDITY_DAYS} days`, pageWidth - margin, y + 5, { align: 'right' });
  
  // Customer Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, (pageWidth - margin * 2) / 2 - 5, 45, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED FOR:', margin + 8, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.customerName, margin + 8, y + 22);
  doc.setFontSize(9);
  doc.text(data.propertyAddress, margin + 8, y + 30);
  doc.text(`${data.customerEmail}`, margin + 8, y + 38);
  
  // Property Details Box
  const propX = margin + (pageWidth - margin * 2) / 2 + 5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(propX, y, (pageWidth - margin * 2) / 2 - 5, 45, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY DETAILS:', propX + 8, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${data.roofSquares.toFixed(1)} Roof Squares`, propX + 8, y + 22);
  doc.setFontSize(9);
  if (data.pitch) doc.text(`Pitch: ${data.pitch}`, propX + 8, y + 30);
  if (data.complexity) doc.text(`Complexity: ${data.complexity}`, propX + 8, y + 38);
  
  y += 60;
  
  // Recommended Package Highlight Box
  doc.setFillColor(30, 70, 50);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 65, 5, 5, 'F');
  
  // Gold star badge
  doc.setFillColor(218, 165, 32);
  doc.circle(margin + 20, y + 20, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('★', margin + 16, y + 25);
  
  doc.setTextColor(218, 165, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED PACKAGE', margin + 40, y + 15);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(data.selectedPackage.name.toUpperCase(), margin + 40, y + 30);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatPerSquarePrice(data.selectedPackage)} per square`, margin + 40, y + 42);
  
  // Price Range
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPriceRange(data.estimateLow, data.estimateHigh), pageWidth - margin - 10, y + 35, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Estimated Price Range', pageWidth - margin - 10, y + 45, { align: 'right' });
  
  // Calculation breakdown
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(
    `Based on: ${data.roofSquares.toFixed(1)} squares × $${data.selectedPackage.priceLow.toLocaleString()}-$${data.selectedPackage.priceHigh.toLocaleString()}/sq`,
    margin + 40, y + 55
  );
  
  y += 80;
  
  // Appointment Info (if scheduled)
  if (data.appointmentDate && data.appointmentTime) {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 SCHEDULED APPOINTMENT', margin + 10, y + 12);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.appointmentDate} at ${data.appointmentTime}`, margin + 10, y + 22);
    doc.text(`Type: ${data.appointmentType === 'zoom' ? 'Zoom Consultation' : 'In-Person Visit'}`, margin + 120, y + 22);
    
    y += 40;
  }
  
  // Financing (if selected)
  if (data.financing) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'F');
    
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 FINANCING OPTION SELECTED', margin + 10, y + 12);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.financing.lenderName} - ${data.financing.rate}% APR for ${data.financing.termYears} years`, margin + 10, y + 22);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(`Est. Monthly Payment: ${formatCurrency(data.financing.monthlyPayment)}/mo`, pageWidth - margin - 10, y + 22, { align: 'right' });
    
    y += 45;
  }
  
  // Package Highlights
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PACKAGE HIGHLIGHTS', margin, y);
  y += 8;
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.selectedPackage.highlights.forEach((highlight, i) => {
    doc.text(`✓ ${highlight}`, margin + 5, y + (i * 6));
  });
  
  addPageFooter(doc);
  
  // ============================================
  // PAGE 2: GOOD / BETTER / BEST COMPARISON
  // ============================================
  if (data.comparisonPackages && data.comparisonPackages.length >= 3) {
    doc.addPage();
    addPageHeader(doc, 'COMPARE YOUR OPTIONS', 2, totalPages);
    y = 50;
    
    const colWidth = (pageWidth - margin * 2 - 20) / 3;
    const packages = data.comparisonPackages.slice(0, 3);
    const tierLabels = ['GOOD', 'BETTER', 'BEST'];
    const tierColors = [
      { bg: [205, 127, 50], text: [255, 255, 255] },     // Bronze
      { bg: [192, 192, 192], text: [50, 50, 50] },       // Silver
      { bg: [218, 165, 32], text: [50, 50, 50] }         // Gold
    ];
    
    packages.forEach((pkg, i) => {
      const x = margin + (i * (colWidth + 10));
      const isRecommended = pkg.isRecommended || pkg.package.id === data.selectedPackage.id;
      
      // Card background
      if (isRecommended) {
        doc.setFillColor(30, 70, 50);
        doc.roundedRect(x - 2, y - 2, colWidth + 4, 155, 5, 5, 'F');
      }
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colWidth, 150, 4, 4, 'F');
      
      // Tier badge
      doc.setFillColor(tierColors[i].bg[0], tierColors[i].bg[1], tierColors[i].bg[2]);
      doc.roundedRect(x, y, colWidth, 25, 4, 4, 'F');
      doc.rect(x, y + 20, colWidth, 5, 'F'); // Square bottom of badge
      
      doc.setTextColor(tierColors[i].text[0], tierColors[i].text[1], tierColors[i].text[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(tierLabels[i], x + colWidth / 2, y + 10, { align: 'center' });
      doc.setFontSize(8);
      doc.text(pkg.package.displayName, x + colWidth / 2, y + 18, { align: 'center' });
      
      // Recommended star
      if (isRecommended) {
        doc.setFillColor(218, 165, 32);
        doc.circle(x + colWidth - 10, y + 10, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('★', x + colWidth - 14, y + 13);
      }
      
      // Price per square
      doc.setTextColor(30, 70, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(formatPerSquarePrice(pkg.package), x + colWidth / 2, y + 40, { align: 'center' });
      
      // Total estimate
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Estimated Total:', x + colWidth / 2, y + 52, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatPriceRange(pkg.estimateLow, pkg.estimateHigh), x + colWidth / 2, y + 60, { align: 'center' });
      
      // Key features (first 5)
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      const keyFeatures = pkg.package.lineItems.slice(0, 5);
      keyFeatures.forEach((item, j) => {
        const shortDesc = item.description.length > 30 
          ? item.description.substring(0, 27) + '...'
          : item.description;
        doc.text(`✓ ${shortDesc}`, x + 5, y + 75 + (j * 8));
      });
      
      // Warranty
      doc.setFontSize(7);
      doc.setTextColor(30, 70, 50);
      doc.setFont('helvetica', 'bold');
      doc.text(pkg.package.warranty.split(',')[0], x + colWidth / 2, y + 140, { align: 'center' });
    });
    
    y += 165;
    
    // Legend
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('★ = Recommended for your home based on property assessment', margin, y);
    
    addPageFooter(doc);
  }
  
  // ============================================
  // PAGE 3: SELECTED PACKAGE DETAILS
  // ============================================
  doc.addPage();
  addPageHeader(doc, `${data.selectedPackage.name.toUpperCase()} - DETAILED BREAKDOWN`, data.comparisonPackages ? 3 : 2, totalPages);
  y = 50;
  
  // Pricing Methodology
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICING METHODOLOGY', margin + 10, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your estimate is calculated as:', margin + 10, y + 24);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 70, 50);
  const calculationText = `${data.roofSquares.toFixed(1)} Roof Squares × $${data.selectedPackage.priceLow.toLocaleString()}-$${data.selectedPackage.priceHigh.toLocaleString()} per square = ${formatPriceRange(data.estimateLow, data.estimateHigh)}`;
  doc.text(calculationText, margin + 10, y + 34);
  
  y += 50;
  
  // What's Included Section
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("WHAT'S INCLUDED", margin, y);
  y += 8;
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.selectedPackage.lineItems.forEach((item, i) => {
    const checkColor = item.included ? [30, 70, 50] : [200, 200, 200];
    doc.setTextColor(checkColor[0], checkColor[1], checkColor[2]);
    doc.text('✓', margin + 5, y);
    doc.setTextColor(50, 50, 50);
    doc.text(item.description, margin + 15, y);
    y += 7;
  });
  
  y += 10;
  
  // Included Allowances
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INCLUDED ALLOWANCES', margin, y);
  y += 8;
  
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, pageWidth - margin * 2, data.selectedPackage.allowances.length * 12 + 10, 3, 3, 'F');
  
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.selectedPackage.allowances.forEach((allowance, i) => {
    doc.text(`• ${allowance.description}: ${allowance.limit}`, margin + 10, y + 10 + (i * 12));
  });
  
  y += data.selectedPackage.allowances.length * 12 + 20;
  
  // Warranty & Install Time
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, (pageWidth - margin * 2) / 2 - 5, 30, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('WARRANTY', margin + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(data.selectedPackage.warranty, margin + 10, y + 22);
  
  const installX = margin + (pageWidth - margin * 2) / 2 + 5;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(installX, y, (pageWidth - margin * 2) / 2 - 5, 30, 3, 3, 'F');
  
  doc.setTextColor(30, 70, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTALLATION TIME', installX + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(data.selectedPackage.installDays, installX + 10, y + 22);
  
  y += 40;
  
  // Trust Footer
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'F');
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ⓘ WHY PRICING IS SHOWN AS A RANGE:', margin + 10, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const disclaimerLines = doc.splitTextToSize(PRICING_DISCLAIMER.split('\n')[0], pageWidth - margin * 2 - 20);
  disclaimerLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 10, y + 18 + (i * 5));
  });
  
  addPageFooter(doc);
  
  // ============================================
  // PAGE 4: SIGNATURE PAGE
  // ============================================
  doc.addPage();
  addPageHeader(doc, 'ESTIMATE APPROVAL & AUTHORIZATION', data.comparisonPackages ? 4 : 3, totalPages);
  y = 55;
  
  // Agreement text
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const agreementText = `By signing below, I acknowledge that I have reviewed this estimate and authorize Global Contractor Network to proceed with scheduling my roofing consultation. I understand that this is an estimate and the final price will be confirmed after an on-site inspection.`;
  const agreementLines = doc.splitTextToSize(agreementText, pageWidth - margin * 2);
  doc.text(agreementLines, margin, y);
  
  y += 30;
  
  // Signature Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 3, 3, 'S');
  
  if (data.signatureData) {
    // Embed signature image
    try {
      doc.addImage(data.signatureData, 'PNG', margin + 10, y + 5, 100, 45);
    } catch (e) {
      console.error('Failed to add signature image:', e);
    }
  } else {
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(12);
    doc.text('SIGNATURE', pageWidth / 2, y + 35, { align: 'center' });
  }
  
  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(margin + 10, y + 50, pageWidth - margin - 10, y + 50);
  
  y += 70;
  
  // Printed name and date
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Printed Name:', margin, y);
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 30, y, margin + 100, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customerName, margin + 32, y - 2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', margin + 110, y);
  doc.line(margin + 125, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'bold');
  const signDate = data.signedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(signDate, margin + 127, y - 2);
  
  y += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Property Address:', margin, y);
  doc.line(margin + 40, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'bold');
  doc.text(data.propertyAddress, margin + 42, y - 2);
  
  y += 25;
  
  // Terms checkboxes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  doc.rect(margin, y, 4, 4);
  doc.text('I agree to receive updates via email and SMS regarding my estimate and appointment.', margin + 8, y + 3);
  
  y += 12;
  
  doc.rect(margin, y, 4, 4);
  doc.text('I understand this is an estimate, not a binding contract. Final pricing confirmed after inspection.', margin + 8, y + 3);
  
  y += 25;
  
  // Contact info
  doc.setFillColor(30, 70, 50);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Questions? We\'re here to help!', pageWidth / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Call (214) 998-2879 | Email: info@globalcontractor.network', pageWidth / 2, y + 18, { align: 'center' });
  
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
