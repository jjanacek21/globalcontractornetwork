import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Company {
  id: string;
  name: string;
  email: string | null;
  insurance_expiration: string | null;
  workers_comp_expiration: string | null;
  licenses: Array<{
    number: string;
    state: string;
    expiration: string | null;
    document_url?: string;
  }> | null;
  credential_warnings: Record<string, any> | null;
  has_crew: boolean | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in14Days = new Date(today);
    in14Days.setDate(in14Days.getDate() + 14);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    // Fetch all companies with credential info
    const { data: companies, error: companiesError } = await supabase
      .from("permit_companies")
      .select("id, name, email, insurance_expiration, workers_comp_expiration, licenses, credential_warnings, has_crew")
      .eq("is_active", true);

    if (companiesError) {
      throw companiesError;
    }

    const notifications: Array<{
      type: string;
      title: string;
      message: string;
      company_id: string;
      severity: "info" | "warning" | "critical";
      metadata: Record<string, any>;
    }> = [];

    const companyUpdates: Array<{ id: string; credential_warnings: Record<string, any> }> = [];

    for (const company of companies as Company[]) {
      const warnings: Record<string, any> = {};

      // Check insurance expiration
      if (company.insurance_expiration) {
        const expDate = new Date(company.insurance_expiration);
        const daysUntilExpiry = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          warnings.insurance_expired = true;
          warnings.insurance_days_expired = Math.abs(daysUntilExpiry);
          notifications.push({
            type: "credential_expired",
            title: `Insurance Expired: ${company.name}`,
            message: `Insurance for ${company.name} expired ${Math.abs(daysUntilExpiry)} days ago.`,
            company_id: company.id,
            severity: "critical",
            metadata: { credential_type: "insurance", expiration_date: company.insurance_expiration }
          });
        } else if (daysUntilExpiry <= 7) {
          warnings.insurance_expiring_soon = true;
          warnings.insurance_days_remaining = daysUntilExpiry;
          notifications.push({
            type: "credential_expiring_soon",
            title: `Insurance Expiring Soon: ${company.name}`,
            message: `Insurance for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "critical",
            metadata: { credential_type: "insurance", expiration_date: company.insurance_expiration, days_remaining: daysUntilExpiry }
          });
        } else if (daysUntilExpiry <= 14) {
          warnings.insurance_expiring_14 = true;
          notifications.push({
            type: "credential_expiring_soon",
            title: `Insurance Expiring: ${company.name}`,
            message: `Insurance for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "warning",
            metadata: { credential_type: "insurance", expiration_date: company.insurance_expiration, days_remaining: daysUntilExpiry }
          });
        } else if (daysUntilExpiry <= 30) {
          warnings.insurance_expiring_30 = true;
          notifications.push({
            type: "credential_expiring_30",
            title: `Insurance Reminder: ${company.name}`,
            message: `Insurance for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "info",
            metadata: { credential_type: "insurance", expiration_date: company.insurance_expiration, days_remaining: daysUntilExpiry }
          });
        }
      }

      // Check workers comp expiration (only if has_crew)
      if (company.has_crew && company.workers_comp_expiration) {
        const expDate = new Date(company.workers_comp_expiration);
        const daysUntilExpiry = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          warnings.workers_comp_expired = true;
          warnings.workers_comp_days_expired = Math.abs(daysUntilExpiry);
          notifications.push({
            type: "credential_expired",
            title: `Workers Comp Expired: ${company.name}`,
            message: `Workers Compensation for ${company.name} expired ${Math.abs(daysUntilExpiry)} days ago.`,
            company_id: company.id,
            severity: "critical",
            metadata: { credential_type: "workers_comp", expiration_date: company.workers_comp_expiration }
          });
        } else if (daysUntilExpiry <= 7) {
          warnings.workers_comp_expiring_soon = true;
          warnings.workers_comp_days_remaining = daysUntilExpiry;
          notifications.push({
            type: "credential_expiring_soon",
            title: `Workers Comp Expiring Soon: ${company.name}`,
            message: `Workers Compensation for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "critical",
            metadata: { credential_type: "workers_comp", expiration_date: company.workers_comp_expiration, days_remaining: daysUntilExpiry }
          });
        } else if (daysUntilExpiry <= 14) {
          warnings.workers_comp_expiring_14 = true;
          notifications.push({
            type: "credential_expiring_soon",
            title: `Workers Comp Expiring: ${company.name}`,
            message: `Workers Compensation for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "warning",
            metadata: { credential_type: "workers_comp", expiration_date: company.workers_comp_expiration, days_remaining: daysUntilExpiry }
          });
        } else if (daysUntilExpiry <= 30) {
          warnings.workers_comp_expiring_30 = true;
          notifications.push({
            type: "credential_expiring_30",
            title: `Workers Comp Reminder: ${company.name}`,
            message: `Workers Compensation for ${company.name} expires in ${daysUntilExpiry} days.`,
            company_id: company.id,
            severity: "info",
            metadata: { credential_type: "workers_comp", expiration_date: company.workers_comp_expiration, days_remaining: daysUntilExpiry }
          });
        }
      }

      // Check license expirations
      if (company.licenses && Array.isArray(company.licenses)) {
        const expiredLicenses: string[] = [];
        const expiringLicenses: string[] = [];

        for (const license of company.licenses) {
          if (license.expiration) {
            const expDate = new Date(license.expiration);
            const daysUntilExpiry = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
              expiredLicenses.push(license.number);
              notifications.push({
                type: "credential_expired",
                title: `License Expired: ${company.name}`,
                message: `License ${license.number} (${license.state}) expired ${Math.abs(daysUntilExpiry)} days ago.`,
                company_id: company.id,
                severity: "warning",
                metadata: { credential_type: "license", license_number: license.number, license_state: license.state, expiration_date: license.expiration }
              });
            } else if (daysUntilExpiry <= 30) {
              expiringLicenses.push(license.number);
              notifications.push({
                type: daysUntilExpiry <= 7 ? "credential_expiring_soon" : "credential_expiring_30",
                title: `License Expiring: ${company.name}`,
                message: `License ${license.number} (${license.state}) expires in ${daysUntilExpiry} days.`,
                company_id: company.id,
                severity: daysUntilExpiry <= 7 ? "warning" : "info",
                metadata: { credential_type: "license", license_number: license.number, license_state: license.state, expiration_date: license.expiration, days_remaining: daysUntilExpiry }
              });
            }
          }
        }

        if (expiredLicenses.length > 0) {
          warnings.licenses_expired = expiredLicenses;
        }
        if (expiringLicenses.length > 0) {
          warnings.licenses_expiring = expiringLicenses;
        }
      }

      // Only update if there are warnings
      if (Object.keys(warnings).length > 0) {
        companyUpdates.push({ id: company.id, credential_warnings: warnings });
      } else if (company.credential_warnings && Object.keys(company.credential_warnings).length > 0) {
        // Clear warnings if none exist
        companyUpdates.push({ id: company.id, credential_warnings: {} });
      }
    }

    // Insert notifications (avoiding duplicates for today)
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    for (const notification of notifications) {
      // Check if similar notification already exists today
      const { data: existing } = await supabase
        .from("admin_notifications")
        .select("id")
        .eq("company_id", notification.company_id)
        .eq("type", notification.type)
        .gte("created_at", todayStart.toISOString())
        .maybeSingle();

      if (!existing) {
        await supabase.from("admin_notifications").insert(notification);
      }
    }

    // Update company credential warnings
    for (const update of companyUpdates) {
      await supabase
        .from("permit_companies")
        .update({ credential_warnings: update.credential_warnings })
        .eq("id", update.id);
    }

    console.log(`Processed ${companies?.length || 0} companies, created ${notifications.length} notifications, updated ${companyUpdates.length} companies`);

    return new Response(
      JSON.stringify({
        success: true,
        companiesChecked: companies?.length || 0,
        notificationsCreated: notifications.length,
        companiesUpdated: companyUpdates.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: unknown) {
    console.error("Error checking credential expirations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
