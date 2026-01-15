import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  userType: "homeowner" | "contractor";
  companyName?: string;
}

const buildHomeownerEmail = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">Welcome to GCN!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Global Contractor Network</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #18181b; margin-bottom: 24px;">Hi ${name},</p>
          
          <p style="color: #52525b; line-height: 1.6; margin-bottom: 24px;">
            Welcome to the Global Contractor Network! Your homeowner account is now active and you have instant access to all of our services.
          </p>
          
          <h3 style="color: #18181b; font-size: 16px; margin-bottom: 16px;">What you can do now:</h3>
          
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px;">✓</span>
              <span style="color: #52525b;"><strong>Get Instant Quotes</strong> - Roofing, windows, coatings, and more</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px;">✓</span>
              <span style="color: #52525b;"><strong>Find Verified Contractors</strong> - Browse our directory of licensed pros</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px;">✓</span>
              <span style="color: #52525b;"><strong>Track Your Projects</strong> - See status updates in your dashboard</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px;">✓</span>
              <span style="color: #52525b;"><strong>24/7 Emergency Service</strong> - Water damage, storm response, mold</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://globalcontractor.network/homeowner/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Go to My Dashboard
            </a>
          </div>
          
          <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin-top: 24px;">
            <p style="color: #52525b; margin: 0; font-size: 14px;">
              <strong>Need help?</strong> Reply to this email or call us at (214) 998-2879. We're here to help!
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 24px; color: #71717a; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Global Contractor Network</p>
          <p style="margin: 0;">Boca Raton, FL 33432</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const buildContractorEmail = (name: string, companyName?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; font-size: 28px; margin: 0 0 8px 0;">Application Under Review</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Global Contractor Network</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #18181b; margin-bottom: 24px;">Hi ${name}${companyName ? ` from ${companyName}` : ''},</p>
          
          <p style="color: #52525b; line-height: 1.6; margin-bottom: 24px;">
            Thank you for registering with Global Contractor Network! Your account is currently under review.
          </p>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>What happens next?</strong><br>
              A member of our support team will reach out to you within <strong>1-24 hours</strong> to finalize your company setup and answer any questions you may have.
            </p>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #166534; margin: 0 0 12px 0; font-weight: 600;">📞 Keep an eye on your inbox and phone!</p>
            <p style="color: #15803d; margin: 0; font-size: 14px;">
              We'll be in touch shortly to verify your credentials and get your company profile fully set up.
            </p>
          </div>
          
          <h3 style="color: #18181b; font-size: 16px; margin-bottom: 16px;">Once approved, you'll have access to:</h3>
          
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>CRM Portal</strong> - Manage leads and customers</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>Directory Listing</strong> - Get found by homeowners</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>Permit Expediting</strong> - Fast-track your permits</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>Supplements & Estimating</strong> - Maximize insurance claims</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>Digital Marketing</strong> - Grow your brand</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <span style="color: #059669; font-weight: bold; margin-right: 12px;">→</span>
              <span style="color: #52525b;"><strong>Training Academy</strong> - Certifications and courses</span>
            </div>
          </div>
          
          <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin-top: 24px;">
            <p style="color: #52525b; margin: 0; font-size: 14px;">
              <strong>Questions?</strong> Reply to this email or call us at (214) 998-2879. We're excited to have you join the network!
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 24px; color: #71717a; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Global Contractor Network</p>
          <p style="margin: 0;">Boca Raton, FL 33432</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userType, companyName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} (${userType})`);

    if (!email || !name || !userType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, name, or userType" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = userType === "homeowner" 
      ? "Welcome to Global Contractor Network!" 
      : "Application Received - Global Contractor Network";

    const html = userType === "homeowner" 
      ? buildHomeownerEmail(name)
      : buildContractorEmail(name, companyName);

    // Note: Until domain is verified, emails can only go to jared@globalcontractor.network
    const ADMIN_EMAIL = "jared@globalcontractor.network";
    const isTestMode = email !== ADMIN_EMAIL;
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: isTestMode ? `[FOR: ${email}] ${subject}` : subject,
        html: isTestMode 
          ? `<div style="background: #fef3c7; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <strong>⚠️ Test Mode:</strong> This email was meant for <strong>${email}</strong>. 
              Verify your domain at resend.com/domains to send to external recipients.
            </div>${html}`
          : html,
      }),
    });

    const result = await emailResponse.json();

    console.log("Welcome email sent:", result, isTestMode ? `(intended for: ${email})` : "");

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
