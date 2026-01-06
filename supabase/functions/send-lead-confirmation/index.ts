import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinancingInfo {
  lenderName: string;
  rate: number;
  termYears: number;
  monthlyPayment: number;
}

interface MeasurementInfo {
  baseSqft: number;
  trueSqft: number;
  roofSquares: number;
  complexity: string;
}

interface LeadConfirmationRequest {
  email: string;
  name: string;
  source: string;
  // Common fields
  phone?: string;
  address?: string;
  // Coating Kings specific
  propertyType?: string;
  roofType?: string;
  coatingType?: string;
  estimatedSqft?: number;
  urgency?: string;
  estimateLow?: number;
  estimateHigh?: number;
  notes?: string;
  // Window Quote specific
  windowSelections?: Array<{ type: string; size: string; quantity: number }>;
  totalWindows?: number;
  performanceLevel?: string;
  interiorColor?: string;
  exteriorColor?: string;
  glassType?: string;
  gridStyle?: string;
  spinDiscount?: number;
  // Emergency specific
  service?: string;
  message?: string;
  // Roofing Consultation specific
  recommendedPackage?: string;
  estimatedPrice?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  timeline?: string;
  budget?: string;
  sqft?: number;
  // PDF attachment
  pdfBase64?: string;
  pdfFilename?: string;
  // Financing data
  financing?: FinancingInfo;
  // Measurement data
  measurements?: MeasurementInfo;
  // Marketing specific
  companyName?: string;
  serviceInterest?: string;
  budgetRange?: string;
}

const formatUrgency = (urgency: string): string => {
  const map: Record<string, string> = {
    'immediate': 'Immediate (Within 2 weeks)',
    'soon': 'Soon (1-2 months)',
    'planning': 'Planning (3+ months)',
  };
  return map[urgency] || urgency;
};

const formatPropertyType = (type: string): string => {
  const map: Record<string, string> = {
    'residential': 'Residential',
    'commercial': 'Commercial',
    'industrial': 'Industrial',
    'hoa': 'HOA / Community',
  };
  return map[type] || type;
};

const formatWindowType = (type: string): string => {
  const map: Record<string, string> = {
    'single-hung': 'Single Hung',
    'horizontal-roller': 'Horizontal Roller',
    '3-lite-roller': '3-Lite Roller',
    'picture-window': 'Picture Window',
    'sliding-glass-door': 'Sliding Glass Door',
    'french-door': 'French Door',
  };
  return map[type] || type;
};

const formatPerformanceLevel = (level: string): string => {
  const map: Record<string, string> = {
    'standard': 'Standard (Florida Code)',
    'hvhz': 'HVHZ (High Velocity Hurricane Zone)',
    'large-missile': 'Large Missile (Maximum Protection)',
  };
  return map[level] || level;
};

const formatGlassType = (glass: string): string => {
  const map: Record<string, string> = {
    'standard': 'Standard',
    'low-e': 'Low-E Coating',
    'tinted': 'Tinted',
  };
  return map[glass] || glass;
};

const formatService = (service: string): string => {
  const map: Record<string, string> = {
    'mold': 'Mold Remediation',
    'testing': 'Air Quality / Mold Testing',
    'water': 'Water Damage Mitigation',
    'storm': 'Storm Damage Cleanup',
    'roof': 'Roof Tarping / Leak Repair',
    'other': 'Other / Not Sure',
  };
  return map[service] || service;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getSubjectLine = (source: string, hasPdf: boolean): string => {
  const subjects: Record<string, string> = {
    'Coating Kings': '✅ Your Roof Coating Quote Request Received',
    'Green Home Solutions - Windows': '✅ Your Window Quote Request Received',
    'Emergency Mitigation': '🚨 Emergency Request Received - We\'re On It!',
    'Northern Landscaping': '✅ Your Landscaping Quote Request Received',
    'Roofing Consultations': hasPdf ? '📋 Your Roofing Estimate PDF is Ready!' : '📅 Your Roofing Consultation is Scheduled!',
    'Digital Marketing': '✅ Your Marketing Consultation Request Received',
  };
  return subjects[source] || '✅ Your Request Has Been Received';
};

const buildCoatingKingsRecap = (data: LeadConfirmationRequest): string => {
  let recap = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🏠 Property Type:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${formatPropertyType(data.propertyType || 'Not specified')}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🔧 Roof Type:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.roofType || 'Not specified'}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🎨 Coating Type:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.coatingType || 'Not specified'}
        </td>
      </tr>`;
  
  if (data.estimatedSqft) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📐 Estimated Size:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.estimatedSqft.toLocaleString()} sq ft
        </td>
      </tr>`;
  }
  
  if (data.urgency) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>⏰ Timeline:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${formatUrgency(data.urgency)}
        </td>
      </tr>`;
  }
  
  if (data.estimateLow && data.estimateHigh) {
    recap += `
      <tr>
        <td style="padding: 8px 0;">
          <strong>💰 Estimated Range:</strong>
        </td>
        <td style="padding: 8px 0;">
          $${data.estimateLow.toLocaleString()} - $${data.estimateHigh.toLocaleString()}
        </td>
      </tr>`;
  }
  
  recap += '</table>';
  return recap;
};

const buildWindowQuoteRecap = (data: LeadConfirmationRequest): string => {
  let recap = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  
  if (data.windowSelections && data.windowSelections.length > 0) {
    recap += `
      <tr>
        <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🪟 Windows Selected:</strong>
        </td>
      </tr>`;
    
    data.windowSelections.forEach(w => {
      recap += `
        <tr>
          <td style="padding: 4px 0 4px 20px; border-bottom: 1px solid #e5e7eb;">
            • ${w.quantity}x ${formatWindowType(w.type)}
          </td>
          <td style="padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
            (${w.size}")
          </td>
        </tr>`;
    });
  }
  
  if (data.performanceLevel) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>⭐ Performance:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${formatPerformanceLevel(data.performanceLevel)}
        </td>
      </tr>`;
  }
  
  if (data.interiorColor || data.exteriorColor) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🎨 Colors:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.interiorColor || 'White'} Interior / ${data.exteriorColor || 'White'} Exterior
        </td>
      </tr>`;
  }
  
  if (data.glassType) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🔲 Glass:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${formatGlassType(data.glassType)}
        </td>
      </tr>`;
  }
  
  if (data.gridStyle) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📐 Grid Style:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.gridStyle}
        </td>
      </tr>`;
  }
  
  if (data.estimateLow && data.estimateHigh) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>💰 Estimated Range:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          $${data.estimateLow.toLocaleString()} - $${data.estimateHigh.toLocaleString()}
        </td>
      </tr>`;
  }
  
  if (data.spinDiscount) {
    recap += `
      <tr>
        <td style="padding: 8px 0;">
          <strong>🎁 Your Spin Discount:</strong>
        </td>
        <td style="padding: 8px 0; color: #059669; font-weight: bold;">
          ${data.spinDiscount}% OFF!
        </td>
      </tr>`;
  }
  
  recap += '</table>';
  return recap;
};

const buildEmergencyRecap = (data: LeadConfirmationRequest): string => {
  return `
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚨 EMERGENCY REQUEST RECEIVED</h3>
      <p style="margin: 0; font-size: 18px;"><strong>Service:</strong> ${formatService(data.service || 'Emergency')}</p>
      <p style="margin: 10px 0 0 0; color: #dc2626;"><strong>Priority: IMMEDIATE</strong></p>
      <p style="margin: 15px 0 0 0; font-size: 14px;">
        ⚡ Due to the urgent nature of your request,<br>
        expect a call within 15 minutes.
      </p>
    </div>`;
};

const buildLandscapingRecap = (data: LeadConfirmationRequest): string => {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🏠 Property Type:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${formatPropertyType(data.propertyType || 'Not specified')}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <strong>🌳 Service Requested:</strong>
        </td>
        <td style="padding: 8px 0;">
          ${data.service || 'Not specified'}
        </td>
      </tr>
    </table>`;
};

const buildRoofingConsultationRecap = (data: LeadConfirmationRequest): string => {
  let recap = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  
  if (data.roofType) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🏠 Roof Type:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.roofType}
        </td>
      </tr>`;
  }
  
  if (data.recommendedPackage) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📦 Package:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.recommendedPackage}
        </td>
      </tr>`;
  }

  // Add measurement details if available
  if (data.measurements) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📐 Roof Size:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.measurements.roofSquares.toFixed(1)} squares (${data.measurements.trueSqft.toLocaleString()} sq ft)
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🏗️ Complexity:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.measurements.complexity}
        </td>
      </tr>`;
  } else if (data.sqft) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📐 Size:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ~${data.sqft.toLocaleString()} sq ft
        </td>
      </tr>`;
  }
  
  // Show estimate range if available, otherwise single price
  if (data.estimateLow && data.estimateHigh) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>💰 Estimated:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 18px; font-weight: bold; color: #059669;">
          ${formatCurrency(data.estimateLow)} - ${formatCurrency(data.estimateHigh)}
        </td>
      </tr>`;
  } else if (data.estimatedPrice) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>💰 Estimated:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          $${data.estimatedPrice.toLocaleString()}
        </td>
      </tr>`;
  }

  // Add financing info if available
  if (data.financing) {
    recap += `
      <tr>
        <td colspan="2" style="padding: 12px 0 8px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="background: #eff6ff; border-radius: 6px; padding: 12px;">
            <strong style="color: #2563eb;">💳 Financing Selected</strong><br>
            <span style="font-size: 20px; font-weight: bold; color: #2563eb;">${formatCurrency(data.financing.monthlyPayment)}/month</span><br>
            <span style="font-size: 12px; color: #6b7280;">${data.financing.lenderName} • ${data.financing.rate}% APR • ${data.financing.termYears} years</span>
          </div>
        </td>
      </tr>`;
  }
  
  if (data.appointmentDate && data.appointmentTime) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📅 Appointment:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.appointmentDate} at ${data.appointmentTime}
        </td>
      </tr>`;
  }
  
  if (data.appointmentType) {
    recap += `
      <tr>
        <td style="padding: 8px 0;">
          <strong>📹 Type:</strong>
        </td>
        <td style="padding: 8px 0;">
          ${data.appointmentType === 'zoom' ? 'Zoom Consultation' : 'In-Person Visit'}
        </td>
      </tr>`;
  }
  
  recap += '</table>';
  return recap;
};

const buildMarketingRecap = (data: LeadConfirmationRequest): string => {
  let recap = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
  
  if (data.companyName) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>🏢 Company:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.companyName}
        </td>
      </tr>`;
  }
  
  if (data.serviceInterest) {
    recap += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>📊 Service Interest:</strong>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.serviceInterest}
        </td>
      </tr>`;
  }
  
  if (data.budgetRange) {
    recap += `
      <tr>
        <td style="padding: 8px 0;">
          <strong>💵 Budget Range:</strong>
        </td>
        <td style="padding: 8px 0;">
          ${data.budgetRange}
        </td>
      </tr>`;
  }
  
  recap += '</table>';
  return recap;
};

const buildRecapSection = (data: LeadConfirmationRequest): string => {
  switch (data.source) {
    case 'Coating Kings':
      return buildCoatingKingsRecap(data);
    case 'Green Home Solutions - Windows':
      return buildWindowQuoteRecap(data);
    case 'Emergency Mitigation':
      return buildEmergencyRecap(data);
    case 'Northern Landscaping':
      return buildLandscapingRecap(data);
    case 'Roofing Consultations':
      return buildRoofingConsultationRecap(data);
    case 'Digital Marketing':
      return buildMarketingRecap(data);
    default:
      return '';
  }
};

const buildEmailHtml = (data: LeadConfirmationRequest): string => {
  const recapSection = buildRecapSection(data);
  const isEmergency = data.source === 'Emergency Mitigation';
  const hasPdf = !!data.pdfBase64;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Global Contractor Network</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-top: 0;">Hi ${data.name},</p>
    
    ${hasPdf ? `
    <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">📋 Your Detailed Estimate is Attached!</h3>
      <p style="margin: 0; font-size: 14px; color: #065f46;">
        We've attached your itemized roofing estimate as a PDF.<br>
        You can also download it from the button below.
      </p>
    </div>
    ` : `
    <p>Thank you for contacting <strong>Global Contractor Network</strong>. Your information has been received and is now being reviewed.</p>
    `}
    
    ${recapSection ? `
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
        📋 YOUR ${hasPdf ? 'ESTIMATE' : 'REQUEST'} SUMMARY
      </h3>
      ${recapSection}
    </div>
    ` : ''}
    
    <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 15px 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #047857;">What happens next:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #065f46;">
        <li>A specialist will be assigned to your request</li>
        <li>You'll receive a call or text within ${isEmergency ? '15 minutes' : '15–30 minutes'} (or next business morning if after hours)</li>
        ${hasPdf ? '<li>Review your attached estimate PDF before your consultation</li>' : ''}
      </ul>
    </div>
    
    <p>If you need immediate assistance, feel free to call or text us anytime:</p>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="tel:2149982879" style="display: inline-block; background: #059669; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold;">
        📞 214-998-2879
      </a>
    </div>
    
    <p>Thank you for choosing <strong>Global Contractor Network</strong>. We look forward to assisting you.</p>
    
    <p style="margin-bottom: 0;">Best regards,</p>
    <p style="margin-top: 5px; font-weight: bold;">
      Global Contractor Network<br>
      <span style="font-weight: normal;">214-998-2879</span><br>
      <a href="https://globalcontractor.network" style="color: #059669;">GlobalContractor.Network</a>
    </p>
  </div>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">© ${new Date().getFullYear()} Global Contractor Network. All rights reserved.</p>
    <p style="margin: 5px 0 0 0;">This email was sent because you submitted a request on our website.</p>
  </div>
  
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LeadConfirmationRequest = await req.json();
    
    console.log("Sending lead confirmation email to:", data.email);
    console.log("Source:", data.source);
    console.log("Has PDF attachment:", !!data.pdfBase64);

    if (!data.email || !data.name) {
      throw new Error("Email and name are required");
    }

    const hasPdf = !!data.pdfBase64;
    const subject = getSubjectLine(data.source, hasPdf);
    const html = buildEmailHtml(data);

    // Build email options with optional attachment
    const emailOptions: any = {
      from: "Global Contractor Network <noreply@globalcontractor.network>",
      to: [data.email],
      subject: subject,
      html: html,
    };

    // Add PDF attachment if provided
    if (data.pdfBase64 && data.pdfFilename) {
      emailOptions.attachments = [
        {
          filename: data.pdfFilename,
          content: data.pdfBase64,
        }
      ];
      console.log("Adding PDF attachment:", data.pdfFilename);
    }

    const emailResponse = await resend.emails.send(emailOptions);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-lead-confirmation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
