import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SERVICE_LABELS: Record<string, string> = {
  'store_discounts': 'Store Rewards & Discounts',
  'directory_listing': 'Directory Listing',
  'field_map': 'Field Map',
  'presentations': 'Presentations',
  'learning_platform': 'Learning Platform',
  'crm_access': 'CRM Portal',
  'supplement_kings': 'Supplement Kings',
  'permit_queens': 'Permit Queens',
};

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Global Contractor Network <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("check-stale-login-requests function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 48 hours ago
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // Calculate 24 hours ago for reminder throttling
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Find pending requests that are older than 48 hours
    // AND either not escalated yet OR last reminder was more than 24 hours ago
    const { data: staleRequests, error: fetchError } = await supabase
      .from("login_requests")
      .select("*")
      .eq("status", "pending")
      .lt("requested_at", fortyEightHoursAgo.toISOString())
      .or(`is_escalated.eq.false,last_reminder_sent_at.lt.${twentyFourHoursAgo.toISOString()},last_reminder_sent_at.is.null`);

    if (fetchError) {
      console.error("Error fetching stale requests:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${staleRequests?.length || 0} stale login requests`);

    if (!staleRequests || staleRequests.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let processedCount = 0;

    for (const request of staleRequests) {
      try {
        const serviceLabel = SERVICE_LABELS[request.service_type] || request.service_type;
        const requestAge = Math.floor((Date.now() - new Date(request.requested_at).getTime()) / (1000 * 60 * 60 * 24));

        // Update the request as escalated
        const { error: updateError } = await supabase
          .from("login_requests")
          .update({
            is_escalated: true,
            escalated_at: request.is_escalated ? request.escalated_at : new Date().toISOString(),
            escalation_count: (request.escalation_count || 0) + 1,
            last_reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", request.id);

        if (updateError) {
          console.error(`Error updating request ${request.id}:`, updateError);
          continue;
        }

        // Send escalation email to admin
        const emailResult = await sendEmail(
          ["jared@globalcontractor.network"],
          `⚠️ URGENT: Login Request Pending ${requestAge}+ Days`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #dc2626; margin: 0;">⚠️ URGENT: Request Requires Immediate Attention</h2>
              </div>
              
              <p>The following login request has been waiting for review for <strong>${requestAge} days</strong>:</p>
              
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>User:</strong> ${request.first_name || ''} ${request.last_name || ''}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${request.email}</p>
                <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${request.company_name || 'N/A'}</p>
                <p style="margin: 0 0 10px 0;"><strong>Service Requested:</strong> ${serviceLabel}</p>
                <p style="margin: 0 0 10px 0;"><strong>Submitted:</strong> ${new Date(request.requested_at).toLocaleDateString()} (${requestAge} days ago)</p>
                <p style="margin: 0;"><strong>Escalation Count:</strong> ${(request.escalation_count || 0) + 1}</p>
              </div>
              
              <p style="color: #dc2626; font-weight: bold;">This request requires immediate attention.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://globalcontractor.network/admin/dashboard" 
                   style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Review Now
                </a>
              </div>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                — GCN Automated System
              </p>
            </div>
          `
        );

        console.log(`Escalation email sent for request ${request.id}:`, emailResult);
        processedCount++;

      } catch (requestError) {
        console.error(`Error processing request ${request.id}:`, requestError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-stale-login-requests:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
