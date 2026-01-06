import jsPDF from 'jspdf';

interface FinancingPlan {
  lenderName: string;
  rate: number;
  termYears: number;
  monthlyPayment: number;
  totalCost: number;
}

interface EstimatePdfData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  baseSqft: number;
  pitchMultiplier: number;
  trueSqft: number;
  wastePct: number;
  totalWithWaste: number;
  roofSquares: number;
  roofComplexity: string;
  packageName: string;
  packageFeatures: string[];
  pricePerSquare: string;
  estimateLow: number;
  estimateHigh: number;
  financing?: FinancingPlan | null;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateRoofEstimatePdf = (data: EstimatePdfData): { blob: Blob; base64: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(5, 150, 105); // Emerald-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ROOFING ESTIMATE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Global Contractor Network', pageWidth / 2, 30, { align: 'center' });
  
  y = 50;
  
  // Date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y, { align: 'right' });
  
  y += 10;
  
  // Customer Info Section
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED FOR:', margin, y);
  y += 8;
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.customerName, margin, y);
  y += 6;
  doc.text(data.propertyAddress, margin, y);
  y += 6;
  doc.text(`${data.customerEmail} | ${data.customerPhone}`, margin, y);
  
  y += 15;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Property Measurements Section
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY MEASUREMENTS', margin, y);
  y += 10;
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const measurementData = [
    ['Base Roof Area:', `${data.baseSqft.toLocaleString()} sq ft`],
    ['Pitch Multiplier:', `× ${data.pitchMultiplier.toFixed(2)}`],
    ['True Roof Area:', `${data.trueSqft.toLocaleString()} sq ft`],
    ['Complexity Factor:', `${data.roofComplexity} (+${(data.wastePct * 100).toFixed(0)}% waste)`],
    ['Total with Waste:', `${data.totalWithWaste.toLocaleString()} sq ft`],
    ['ROOF SQUARES:', `${data.roofSquares.toFixed(1)} squares`],
  ];
  
  measurementData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 80, y);
    y += 7;
  });
  
  y += 8;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Package Section
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`SELECTED PACKAGE: ${data.packageName}`, margin, y);
  y += 10;
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  data.packageFeatures.forEach(feature => {
    doc.text(`✓ ${feature}`, margin + 5, y);
    y += 6;
  });
  
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Price per Square: ${data.pricePerSquare}`, margin + 5, y);
  
  y += 15;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Estimate Summary - Highlight Box
  doc.setFillColor(240, 253, 244); // Light green background
  doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 3, 3, 'F');
  
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE SUMMARY', margin + 10, y + 12);
  
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.text(`LOW ESTIMATE: ${formatCurrency(data.estimateLow)}`, margin + 10, y + 23);
  doc.text(`HIGH ESTIMATE: ${formatCurrency(data.estimateHigh)}`, margin + 100, y + 23);
  
  y += 45;
  
  // Financing Section (if selected)
  if (data.financing) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCING OPTION SELECTED', margin + 10, y + 12);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lender: ${data.financing.lenderName}`, margin + 10, y + 22);
    doc.text(`Rate: ${data.financing.rate}% APR | Term: ${data.financing.termYears} years`, margin + 10, y + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`Est. Monthly Payment: ${formatCurrency(data.financing.monthlyPayment)}/month`, margin + 100, y + 22);
    
    y += 50;
  }
  
  // Appointment Info (if scheduled)
  if (data.appointmentDate && data.appointmentTime) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHEDULED APPOINTMENT', margin, y);
    y += 10;
    
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date: ${data.appointmentDate}`, margin + 5, y);
    doc.text(`Time: ${data.appointmentTime}`, margin + 80, y);
    doc.text(`Type: ${data.appointmentType === 'zoom' ? 'Zoom Consultation' : 'In-Person Visit'}`, margin + 130, y);
    
    y += 15;
  }
  
  // Footer Section
  y = Math.max(y, 230);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NOTES & DISCLAIMERS', margin, y);
  y += 6;
  doc.text('• This estimate is valid for 30 days from the date above', margin, y);
  y += 5;
  doc.text('• Final price subject to on-site inspection and verification', margin, y);
  y += 5;
  doc.text('• Permit fees and additional materials not included unless specified', margin, y);
  y += 5;
  doc.text('• Financing subject to credit approval', margin, y);
  
  y += 15;
  
  // Contact Footer
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Questions? Call (214) 998-2879', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('www.globalcontractor.network', pageWidth / 2, y, { align: 'center' });
  
  // Generate output
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];
  
  return { blob, base64 };
};

export const downloadPdf = (blob: Blob, filename: string = 'roof-estimate.pdf') => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
