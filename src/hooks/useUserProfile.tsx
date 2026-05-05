import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileInfo {
  id: string;
  email: string;
  email_normalized: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
}

interface ContractorProfile {
  id: string;
  company_name: string;
  category: string;
  service_area: string[] | null;
  phone: string | null;
  is_verified: boolean | null;
}

interface LinkedQuote {
  id: string;
  created_at: string;
  type: string;
  status: string | null;
  email: string;
  name?: string;
  property_address?: string;
}

interface LinkedProject {
  id: string;
  created_at: string;
  service_type: string;
  property_address: string;
  status: string;
}

interface LinkedReferral {
  id: string;
  created_at: string;
  referred_customer_name: string;
  referred_service_type: string;
  status: string;
  payout_amount: number | null;
}

interface UserProfileData {
  profile: ProfileInfo | null;
  contractorProfile: ContractorProfile | null;
  isContractor: boolean;
  isSuperAdmin: boolean;
  quotes: LinkedQuote[];
  projects: LinkedProject[];
  referrals: LinkedReferral[];
  contactRequests: LinkedQuote[];
  loading: boolean;
  error: string | null;
}

export function useUserProfile(): UserProfileData {
  const [data, setData] = useState<UserProfileData>({
    profile: null,
    contractorProfile: null,
    isContractor: false,
    isSuperAdmin: false,
    quotes: [],
    projects: [],
    referrals: [],
    contactRequests: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setData(prev => ({ ...prev, loading: false, error: "Not authenticated" }));
          return;
        }

        const userId = session.user.id;
        const userEmail = session.user.email || "";
        const emailNormalized = userEmail.toLowerCase().trim();

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, email_normalized, first_name, last_name, phone, role")
          .eq("id", userId)
          .single();

        // Fetch contractor profile if exists
        const { data: contractorProfile } = await supabase
          .from("contractor_profiles")
          .select("id, company_name, category, service_area, phone, is_verified")
          .eq("user_id", userId)
          .maybeSingle();

        const isContractor = !!contractorProfile;

        const { data: superAdmin } = await supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const isSuperAdmin = !!superAdmin;

        // Fetch quotes (coating_leads, window_leads, roofing_consultations)
        const quotes: LinkedQuote[] = [];

        // Coating leads
        const { data: coatingLeads } = await supabase
          .from("coating_leads")
          .select("id, created_at, status, email, name, property_address")
          .or(`user_id.eq.${userId},email_normalized.eq.${emailNormalized}`)
          .order("created_at", { ascending: false });

        if (coatingLeads) {
          quotes.push(...coatingLeads.map(l => ({
            ...l,
            type: "Roof Coating",
            created_at: l.created_at || "",
          })));
        }

        // Window leads
        const { data: windowLeads } = await supabase
          .from("window_leads")
          .select("id, created_at, status, email, name, property_address")
          .or(`user_id.eq.${userId},email_normalized.eq.${emailNormalized}`)
          .order("created_at", { ascending: false });

        if (windowLeads) {
          quotes.push(...windowLeads.map(l => ({
            ...l,
            type: "Window",
            created_at: l.created_at || "",
          })));
        }

        // Roofing consultations
        const { data: roofingConsultations } = await supabase
          .from("roofing_consultations")
          .select("id, created_at, status, customer_email, customer_name, zip_code")
          .or(`user_id.eq.${userId},email_normalized.eq.${emailNormalized}`)
          .order("created_at", { ascending: false });

        if (roofingConsultations) {
          quotes.push(...roofingConsultations.map(l => ({
            id: l.id,
            created_at: l.created_at || "",
            type: "Roofing Consultation",
            status: l.status,
            email: l.customer_email || "",
            name: l.customer_name,
            property_address: l.zip_code || undefined,
          })));
        }

        // Fetch contact requests
        const { data: contactReqs } = await supabase
          .from("contact_requests")
          .select("id, created_at, status, email, name")
          .or(`user_id.eq.${userId},email_normalized.eq.${emailNormalized}`)
          .order("created_at", { ascending: false });

        const contactRequests = (contactReqs || []).map(r => ({
          ...r,
          type: "Contact Request",
          created_at: r.created_at || "",
        }));

        // Fetch projects (for homeowners)
        const { data: projects } = await supabase
          .from("homeowner_projects")
          .select("id, created_at, service_type, property_address, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        // Fetch referrals (for contractors)
        let referrals: LinkedReferral[] = [];
        if (isContractor && contractorProfile) {
          const { data: refs } = await supabase
            .from("contractor_referrals")
            .select("id, created_at, referred_customer_name, referred_service_type, status, payout_amount")
            .eq("referring_contractor_id", contractorProfile.id)
            .order("created_at", { ascending: false });

          referrals = refs || [];
        }

        setData({
          profile,
          contractorProfile,
          isContractor,
          isSuperAdmin,
          quotes,
          projects: projects || [],
          referrals,
          contactRequests,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setData(prev => ({ ...prev, loading: false, error: "Failed to load profile" }));
      }
    }

    fetchUserProfile();
  }, []);

  return data;
}
