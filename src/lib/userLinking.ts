import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Normalize an email for consistent lookups
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Universal user linking helper
 * Used by all forms to resolve the correct user_id to attach
 * 
 * Rules:
 * 1. If user is logged in → attach user_id = sessionUserId
 * 2. If not logged in but email provided → find existing profile with same email_normalized
 * 3. If no profile found → return null (no pending user creation)
 */
export async function resolveUserForSubmission(
  supabase: SupabaseClient,
  sessionUserId: string | null,
  submittedEmail: string
): Promise<{ 
  userId: string | null; 
  emailNormalized: string; 
}> {
  const emailNormalized = normalizeEmail(submittedEmail);
  
  // If user is logged in, use their ID
  if (sessionUserId) {
    return { userId: sessionUserId, emailNormalized };
  }
  
  // Try to find existing profile by email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();
  
  if (existingProfile) {
    return { userId: existingProfile.id, emailNormalized };
  }
  
  // No existing profile found, return null for user_id
  // The auto-link trigger will link this submission when user signs up
  return { userId: null, emailNormalized };
}
