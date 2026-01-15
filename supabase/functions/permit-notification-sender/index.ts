import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface NotificationPayload {
  to: string;
  toName?: string;
  subject: string;
  messageType: 'docs_needed' | 'packet_ready' | 'awaiting_payment' | 'under_review' | 'corrections_needed' | 'approved' | 'issued';
  permitDetails: {
    id: string;
    propertyAddress: string;
    permitType: string;
    jurisdiction: string;
    status?: string;
    missingItems?: string[];
    corrections?: string;
    fee?: number;
    paymentLink?: string;
    permitNumber?: string;
  };
}

const getEmailTemplate = (payload: NotificationPayload): { subject: string; html: string } => {
  const { messageType, permitDetails } = payload;
  const baseUrl = 'https://globalcontractornetwork.lovable.app';
  
  const templates: Record<string, { subject: string; html: string }> = {
    docs_needed: {
      subject: `📋 Documents Needed - Permit for ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Permit Queens</h1>
            <p style="color: white; margin: 5px 0;">Your Permit Expediting Partner</p>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1e293b;">Documents Needed</h2>
            <p>Hi${payload.toName ? ` ${payload.toName}` : ''},</p>
            <p>We're working on your permit for <strong>${permitDetails.propertyAddress}</strong> and need some additional documents to proceed.</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <strong>Missing Items:</strong>
              <ul style="margin: 10px 0;">
                ${(permitDetails.missingItems || []).map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              Upload Documents
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    awaiting_payment: {
      subject: `💳 Packet Ready - Pay to Submit Permit for ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Permit Queens</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1e293b;">🎉 Your Permit Packet is Ready!</h2>
            <p>Great news! Your permit packet for <strong>${permitDetails.propertyAddress}</strong> has been assembled and reviewed.</p>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px;">Expediting Fee</p>
              <p style="margin: 5px 0; font-size: 32px; font-weight: bold; color: #059669;">$${permitDetails.fee?.toFixed(2) || '0.00'}</p>
            </div>
            
            <p>Once payment is received, we'll submit your permit to ${permitDetails.jurisdiction}.</p>
            
            <a href="${permitDetails.paymentLink || `${baseUrl}/permit-queens/payment/${permitDetails.id}`}" 
               style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-size: 16px;">
              Pay Now & Submit
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    under_review: {
      subject: `📤 Permit Submitted - ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Permit Queens</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1e293b;">Permit Submitted!</h2>
            <p>Your permit application has been submitted to <strong>${permitDetails.jurisdiction}</strong>.</p>
            
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Property:</strong> ${permitDetails.propertyAddress}</p>
              <p style="margin: 5px 0;"><strong>Permit Type:</strong> ${permitDetails.permitType}</p>
              <p style="margin: 0;"><strong>Status:</strong> Under Review</p>
            </div>
            
            <p>We'll notify you as soon as there's an update from the building department.</p>
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              Track Status
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    corrections_needed: {
      subject: `⚠️ Corrections Required - Permit for ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Permit Queens</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #dc2626;">Corrections Required</h2>
            <p>The building department has requested corrections for your permit at <strong>${permitDetails.propertyAddress}</strong>.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <strong>Required Corrections:</strong>
              <p style="margin: 10px 0; white-space: pre-wrap;">${permitDetails.corrections || 'Please check the portal for details.'}</p>
            </div>
            
            <p>Please address these items as soon as possible. Our team is here to help!</p>
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              View Details & Respond
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    approved: {
      subject: `✅ Permit Approved! - ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Permit Approved!</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #059669;">Great News!</h2>
            <p>Your permit for <strong>${permitDetails.propertyAddress}</strong> has been approved!</p>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Permit Number:</strong> ${permitDetails.permitNumber || 'Pending'}</p>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${permitDetails.propertyAddress}</p>
              <p style="margin: 0;"><strong>Type:</strong> ${permitDetails.permitType}</p>
            </div>
            
            ${permitDetails.fee ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Permit Fee Due:</strong> $${permitDetails.fee.toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 12px;">Pay this fee to the building department to receive your permit.</p>
            </div>
            ` : ''}
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              View Permit Details
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    issued: {
      subject: `🏆 Permit Issued! - ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏆 Permit Issued!</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #059669;">Congratulations!</h2>
            <p>Your permit for <strong>${permitDetails.propertyAddress}</strong> has been issued and is ready!</p>
            
            <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px;">Permit Number</p>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #059669;">${permitDetails.permitNumber || 'See Portal'}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Post the permit at the job site</li>
              <li>Schedule required inspections</li>
              <li>Keep a copy for your records</li>
            </ul>
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              Download Permit
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Thank you for using Permit Queens!</p>
            <p>A Global Contractor Network Service</p>
          </div>
        </div>
      `
    },
    packet_ready: {
      subject: `📦 Packet Assembled - ${permitDetails.propertyAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Permit Queens</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #1e293b;">Packet Assembled!</h2>
            <p>Your permit packet for <strong>${permitDetails.propertyAddress}</strong> has been assembled by our AI system.</p>
            <p>An expediter will review it shortly and prepare it for submission.</p>
            
            <a href="${baseUrl}/permit-queens/request/${permitDetails.id}" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              View Packet
            </a>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Permit Queens - A Global Contractor Network Service</p>
          </div>
        </div>
      `
    }
  };

  return templates[messageType] || templates.packet_ready;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (!payload.to) {
      throw new Error('Recipient email is required');
    }

    const template = getEmailTemplate(payload);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Permit Queens <permits@globalcontractornetwork.lovable.app>',
        to: [payload.to],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API Error:', errorText);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const result = await emailResponse.json();

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Notification sender error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
