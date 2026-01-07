import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PackageRecommendation {
  tier: string;
  name: string;
  estimateLow: number;
  estimateHigh: number;
  reason: string;
  features: string[];
}

interface QuizResultsRequest {
  email: string;
  name: string;
  address: string;
  cityState?: string;
  roofSquares: number;
  recommendations: PackageRecommendation[];
  pdfBase64?: string;
  pdfFilename?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTierEmoji = (tier: string): string => {
  switch (tier) {
    case "good": return "🔨";
    case "better": return "⭐";
    case "best": return "👑";
    default: return "📦";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: QuizResultsRequest = await req.json();
    console.log("Sending quiz results email to:", data.email);

    const { email, name, address, cityState, roofSquares, recommendations, pdfBase64, pdfFilename } = data;

    // Find the recommended (better) tier
    const recommendedPackage = recommendations.find(r => r.tier === "better") || recommendations[0];

    // Build package recommendations HTML
    const packagesHtml = recommendations.map((rec, index) => {
      const isRecommended = rec.tier === "better";
      return `
        <div style="background: ${isRecommended ? '#f0fdf4' : '#f8fafc'}; border: ${isRecommended ? '2px solid #22c55e' : '1px solid #e2e8f0'}; border-radius: 12px; padding: 20px; margin-bottom: 16px; ${isRecommended ? 'position: relative;' : ''}">
          ${isRecommended ? '<div style="position: absolute; top: -10px; left: 20px; background: #22c55e; color: white; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 4px;">★ RECOMMENDED</div>' : ''}
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px;">${getTierEmoji(rec.tier)}</span>
            <span style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: ${rec.tier === 'good' ? '#f59e0b' : rec.tier === 'better' ? '#3b82f6' : '#8b5cf6'};">${rec.tier}</span>
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #1f2937;">${rec.name}</h3>
          <p style="font-size: 28px; font-weight: bold; color: #059669; margin: 0 0 12px 0;">
            ${formatCurrency(rec.estimateLow)} - ${formatCurrency(rec.estimateHigh)}
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">${rec.reason}</p>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${rec.features.slice(0, 4).map(f => `<li style="margin-bottom: 4px; font-size: 14px;">${f}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">Your Roofing Recommendations</h1>
            <p style="margin: 0; opacity: 0.9;">Personalized for your property</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; margin-bottom: 24px;">Hi ${name || 'there'},</p>
            
            <p>Thank you for using our Roofing Material Finder! Based on your <strong>${roofSquares.toFixed(1)} square</strong> roof at:</p>
            
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-weight: 600;">${address}</p>
              ${cityState ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${cityState}</p>` : ''}
            </div>

            <p style="margin-bottom: 24px;">Here are your personalized package recommendations:</p>

            ${packagesHtml}

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">📅 Ready to Move Forward?</h3>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">Schedule a consultation to get a detailed inspection and finalized quote.</p>
              <div style="text-align: center;">
                <a href="https://globalcontractor.network/roofing" 
                   style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 8px;">
                  Schedule Consultation
                </a>
              </div>
            </div>

            ${pdfBase64 ? `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>📎 PDF Estimate Attached</strong><br>
                Your detailed estimate is attached to this email for your records.
              </p>
            </div>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>Questions?</strong> Call us at <a href="tel:2149982879" style="color: #059669;">(214) 998-2879</a></p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              * Prices are estimates based on satellite measurements. Final pricing subject to on-site inspection.
            </p>
          </div>

          <div style="background: #1f2937; color: #9ca3af; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px;">Global Contractor Network</p>
            <p style="margin: 0; font-size: 12px;">Building Better Together</p>
          </div>
        </body>
      </html>
    `;

    // Prepare attachments if PDF is provided
    const attachments = pdfBase64 ? [{
      filename: pdfFilename || 'roof-estimate.pdf',
      content: pdfBase64,
    }] : undefined;

    // Send email using Resend API directly
    const emailPayload: any = {
      from: "Global Contractor Network <onboarding@resend.dev>",
      to: [email],
      subject: `Your Personalized Roofing Recommendations for ${address.split(',')[0]}`,
      html: htmlContent,
    };

    if (attachments) {
      emailPayload.attachments = attachments;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailResult)}`);
    }

    console.log("Quiz results email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending quiz results email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
