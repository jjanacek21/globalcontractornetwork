import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FileUpload {
  data: string;        // Base64 encoded file content
  filename: string;    // Original filename
  contentType: string; // MIME type
}

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
  
  // Base64 encoded files (optional)
  insuranceDocument?: FileUpload | null;
  workersCompDocument?: FileUpload | null;
  licenseDocuments?: FileUpload[];
  jobPhotoFiles?: Array<FileUpload & { caption?: string; projectType?: string }>;
}

async function uploadBase64File(
  supabaseAdmin: any,
  bucket: string,
  path: string,
  file: FileUpload
): Promise<string | null> {
  try {
    // Decode base64 to binary
    const binaryString = atob(file.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, bytes, {
        contentType: file.contentType,
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error for ${path}:`, error);
      return null;
    }
    
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  } catch (err) {
    console.error(`Failed to upload ${path}:`, err);
    return null;
  }
}

async function sendAdminNotificationEmail(body: RegisterCompanyRequest) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping admin email");
    return;
  }
  
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GCN Notifications <onboarding@resend.dev>",
        to: ["jared@globalcontractor.network"],
        subject: `🏢 New Company Registration: ${body.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">🏢 New Company Registration</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
              <p><strong>Company:</strong> ${body.companyName}</p>
              <p><strong>Admin:</strong> ${body.firstName} ${body.lastName}</p>
              <p><strong>Email:</strong> ${body.email}</p>
              <p><strong>Phone:</strong> ${body.accountPhone}</p>
              <p><strong>Category:</strong> ${body.primaryCategory}</p>
              <p><strong>Location:</strong> ${body.city}, ${body.state} ${body.zip}</p>
              <p><strong>Years in Business:</strong> ${body.yearsInBusiness || 'Not specified'}</p>
              <p><strong>Revenue Range:</strong> ${body.yearlyRevenue || 'Not specified'}</p>
              <p><strong>Services:</strong> ${body.servicesOffered?.join(', ') || 'None specified'}</p>
              <p><strong>Has Crew:</strong> ${body.hasCrew ? 'Yes' : 'No'}</p>
              <p><strong>References Provided:</strong> ${body.references?.length || 0}</p>
            </div>
            <div style="text-align: center; padding: 20px;">
              <a href="https://globalcontractor.network/admin/dashboard" 
                 style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Review Application
              </a>
            </div>
          </div>
        `,
      }),
    });
    console.log("Admin notification email sent");
  } catch (emailError) {
    console.error("Admin notification email failed:", emailError);
  }
}

async function sendWelcomeEmail(body: RegisterCompanyRequest) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping welcome email");
    return;
  }
  
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Global Contractor Network <onboarding@resend.dev>",
        to: [body.email],
        subject: `Your Company Registration is Under Review - ${body.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GCN!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your registration is being reviewed</p>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #18181b;">Hi ${body.firstName},</p>
              <p style="color: #52525b; line-height: 1.6;">
                Thank you for registering <strong>${body.companyName}</strong> with the Global Contractor Network!
              </p>
              <p style="color: #52525b; line-height: 1.6;">
                Our team is reviewing your application and verifying your credentials. This typically takes 1-2 business days.
              </p>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                  <strong>What happens next?</strong><br>
                  You'll receive an email once your account is approved, and you'll have full access to all contractor network features.
                </p>
              </div>
              
              <h3 style="color: #18181b;">Your registration details:</h3>
              <ul style="color: #52525b; padding-left: 20px;">
                <li><strong>Company:</strong> ${body.companyName}</li>
                <li><strong>Category:</strong> ${body.primaryCategory}</li>
                <li><strong>Location:</strong> ${body.city}, ${body.state}</li>
              </ul>
              
              <p style="color: #52525b;">
                Questions? Contact us at <a href="mailto:jared@globalcontractor.network" style="color: #3b82f6;">jared@globalcontractor.network</a>
              </p>
            </div>
            <div style="text-align: center; padding: 24px; color: #71717a; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Global Contractor Network</p>
            </div>
          </div>
        `,
      }),
    });
    console.log("Welcome email sent to:", body.email);
  } catch (emailError) {
    console.error("Welcome email failed:", emailError);
  }
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
      
      const companyId = companyData.id;
      console.log("Created company:", companyId);

      // 5. Upload base64 files if provided
      let insuranceDocUrl: string | null = null;
      let workersCompDocUrl: string | null = null;
      const uploadedPhotos: { url: string; caption: string; projectType: string }[] = [];

      if (body.insuranceDocument) {
        insuranceDocUrl = await uploadBase64File(
          supabaseAdmin,
          'company-documents',
          `${companyId}/insurance/${body.insuranceDocument.filename}`,
          body.insuranceDocument
        );
      }

      if (body.workersCompDocument) {
        workersCompDocUrl = await uploadBase64File(
          supabaseAdmin,
          'company-documents',
          `${companyId}/workers-comp/${body.workersCompDocument.filename}`,
          body.workersCompDocument
        );
      }

      // Upload license documents
      if (body.licenseDocuments && body.licenseDocuments.length > 0) {
        for (const licenseDoc of body.licenseDocuments) {
          const licDoc = licenseDoc as FileUpload & { licenseNumber?: string };
          await uploadBase64File(
            supabaseAdmin,
            'company-documents',
            `${companyId}/licenses/${licDoc.licenseNumber || 'license'}-${licDoc.filename}`,
            licDoc
          );
        }
      }

      if (body.jobPhotoFiles && body.jobPhotoFiles.length > 0) {
        for (let i = 0; i < body.jobPhotoFiles.length; i++) {
          const photo = body.jobPhotoFiles[i];
          const url = await uploadBase64File(
            supabaseAdmin,
            'company-photos',
            `${companyId}/portfolio/${Date.now()}-${i}-${photo.filename}`,
            photo
          );
          if (url) {
            uploadedPhotos.push({ 
              url, 
              caption: photo.caption || '', 
              projectType: photo.projectType || body.primaryCategory 
            });
          }
        }
      }

      // Update company with file URLs if any uploads succeeded
      if (insuranceDocUrl || workersCompDocUrl || uploadedPhotos.length > 0) {
        const updateData: any = {};
        if (insuranceDocUrl) updateData.insurance_document_url = insuranceDocUrl;
        if (workersCompDocUrl) updateData.workers_comp_document_url = workersCompDocUrl;
        if (uploadedPhotos.length > 0) {
          // Merge with existing job photos
          const existingPhotos = body.jobPhotos || [];
          updateData.job_photos = [...existingPhotos, ...uploadedPhotos];
        }
        
        await supabaseAdmin
          .from('permit_companies')
          .update(updateData)
          .eq('id', companyId);
      }

      // 6. Create company_members record (as company_admin)
      const { error: memberError } = await supabaseAdmin
        .from("company_members")
        .insert({
          company_id: companyId,
          user_id: userId,
          role: "company_admin",
          is_active: true
        });

      if (memberError) {
        console.error("Member error:", memberError);
        throw new Error(`Failed to create company member: ${memberError.message}`);
      }
      console.log("Created company member");

      // 7. Create company_admins record
      const { error: adminError } = await supabaseAdmin
        .from("company_admins")
        .insert({
          company_id: companyId,
          user_id: userId,
          is_super_admin: false // Company admin, not network super admin
        });

      if (adminError) {
        console.error("Company admin error:", adminError);
        // Don't throw - this is not critical
      } else {
        console.log("Created company admin");
      }

      // 8. Create contractor profile (so they appear in pending signups)
      const { error: contractorError } = await supabaseAdmin
        .from("contractor_profiles")
        .insert({
          user_id: userId,
          company_name: body.companyName,
          company_id: companyId,
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

      // 9. Create admin notification
      const { error: notificationError } = await supabaseAdmin
        .from("admin_notifications")
        .insert({
          type: "company_registration",
          title: `New Company Registration: ${body.companyName}`,
          message: `${body.firstName} ${body.lastName} has registered ${body.companyName}. Category: ${body.primaryCategory}`,
          severity: "info",
          metadata: {
            companyId: companyId,
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

      // 10. Send email notifications (non-blocking)
      Promise.all([
        sendAdminNotificationEmail(body),
        sendWelcomeEmail(body)
      ]).catch(err => console.error("Email sending failed:", err));

      console.log("Company registration complete");

      return new Response(
        JSON.stringify({
          success: true,
          userId: userId,
          companyId: companyId,
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
