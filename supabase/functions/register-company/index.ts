import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterCompanyRequest {
  // Account info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountPhone: string;
  
  // Company info
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  companyEmail: string;
  website: string;
  primaryCategory: string;
  servicesOffered: string[];
  yearsInBusiness: string;
  yearlyRevenue: string;
  description: string;
  
  // Credentials
  licenses: Array<{
    number: string;
    state: string;
    expiration: string | null;
    document_url: string | null;
  }>;
  insurance: {
    provider: string;
    policyNumber: string;
    expiration: string;
    documentUrl: string | null;
  };
  workersComp: {
    provider: string;
    expiration: string;
    documentUrl: string | null;
  };
  certifications: string;
  hasCrew: boolean;
  
  // References & Portfolio
  references: Array<{
    name: string;
    email: string;
    phone: string;
    projectDescription: string;
  }>;
  jobPhotos: Array<{
    url: string;
    caption: string;
    projectType: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body: RegisterCompanyRequest = await req.json();
    console.log("Registering company:", body.companyName, "for user:", body.email);

    // 1. Create user account with admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }
    if (!authData.user) {
      throw new Error("Failed to create user account: No user returned");
    }

    const userId = authData.user.id;
    console.log("Created user:", userId);

    try {
      // 2. Create/update profile record
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email: body.email,
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.accountPhone
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      console.log("Created profile");

      // 3. Get first license for legacy fields
      const firstLicense = body.licenses && body.licenses.length > 0 ? body.licenses[0] : null;

      // 4. Create company record (service role bypasses RLS)
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from("companies")
        .insert({
          name: body.companyName,
          address: body.address,
          city: body.city,
          state: body.state,
          zip_code: body.zip,
          phone: body.phone,
          email: body.companyEmail,
          website: body.website,
          primary_category: body.primaryCategory,
          services_offered: body.servicesOffered,
          years_in_business: body.yearsInBusiness ? parseInt(body.yearsInBusiness) : null,
          yearly_revenue_range: body.yearlyRevenue,
          description: body.description,
          // Legacy single license fields
          license_number: firstLicense?.number || null,
          license_state: firstLicense?.state || null,
          license_expiration: firstLicense?.expiration || null,
          // Multiple licenses
          licenses: body.licenses || [],
          // Insurance
          insurance_provider: body.insurance?.provider || null,
          insurance_policy_number: body.insurance?.policyNumber || null,
          insurance_expiration: body.insurance?.expiration || null,
          insurance_document_url: body.insurance?.documentUrl || null,
          // Workers Comp
          workers_comp_provider: body.workersComp?.provider || null,
          workers_comp_expiration: body.workersComp?.expiration || null,
          workers_comp_document_url: body.workersComp?.documentUrl || null,
          has_crew: body.hasCrew,
          // Other fields
          certifications: body.certifications ? body.certifications.split(',').map(c => c.trim()) : [],
          client_references: body.references || [],
          job_photos: body.jobPhotos || [],
          verification_status: "pending",
          is_active: false,
          created_by: userId
        })
        .select()
        .single();

      if (companyError) {
        console.error("Company error:", companyError);
        throw new Error(`Failed to create company: ${companyError.message}`);
      }
      console.log("Created company:", companyData.id);

      // 5. Create company_members record (as company_admin)
      const { error: memberError } = await supabaseAdmin
        .from("company_members")
        .insert({
          company_id: companyData.id,
          user_id: userId,
          role: "company_admin",
          is_active: true
        });

      if (memberError) {
        console.error("Member error:", memberError);
        throw new Error(`Failed to create company member: ${memberError.message}`);
      }
      console.log("Created company member");

      // 6. Create company_admins record
      const { error: adminError } = await supabaseAdmin
        .from("company_admins")
        .insert({
          company_id: companyData.id,
          user_id: userId,
          is_super_admin: false // Company admin, not network super admin
        });

      if (adminError) {
        console.error("Company admin error:", adminError);
        // Don't throw - this is not critical
      } else {
        console.log("Created company admin");
      }

      // 7. Create contractor profile (so they appear in pending signups)
      const { error: contractorError } = await supabaseAdmin
        .from("contractor_profiles")
        .insert({
          user_id: userId,
          company_name: body.companyName,
          company_id: companyData.id,
          category: body.primaryCategory,
          description: body.description,
          phone: body.phone,
          email: body.companyEmail,
          website: body.website,
          license_number: firstLicense?.number || null,
          license_state: firstLicense?.state || null,
          verification_status: "pending",
          subscription_status: "pending",
          is_verified: false,
          first_name: body.firstName,
          last_name: body.lastName,
          contractor_type: "company_admin",
          services_offered: body.servicesOffered
        });

      if (contractorError) {
        console.error("Contractor profile error:", contractorError);
        // Don't throw - this is not critical for basic access
      } else {
        console.log("Created contractor profile");
      }

      // 8. Create admin notification for new company registration
      const { error: notificationError } = await supabaseAdmin
        .from("admin_notifications")
        .insert({
          type: "company_registration",
          title: `New Company Registration: ${body.companyName}`,
          message: `${body.firstName} ${body.lastName} has registered ${body.companyName}. Category: ${body.primaryCategory}`,
          severity: "info",
          metadata: {
            companyId: companyData.id,
            companyName: body.companyName,
            email: body.email,
            phone: body.phone,
            category: body.primaryCategory,
            verificationScore: companyData.verification_score
          }
        });

      if (notificationError) {
        console.error("Notification error:", notificationError);
      }

      console.log("Company registration complete");

      return new Response(
        JSON.stringify({
          success: true,
          userId: userId,
          companyId: companyData.id,
          message: "Company registered successfully"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );

    } catch (dbError: any) {
      // If any database operation fails, delete the created user
      console.error("Database operation failed, cleaning up user:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw dbError;
    }

  } catch (error: any) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Registration failed"
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
