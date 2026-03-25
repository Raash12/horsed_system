import { supabase } from "@/config/supabaseClient";
import { createEphemeralSupabaseClient } from "@/config/supabaseEphemeralClient";

/**
 * Creates an auth user (email+password) without changing current UI session,
 * then creates/updates a matching row in `profiles` with role + branch_id.
 *
 * Requires RLS to allow super_admin to upsert into `profiles`.
 */
export async function createStaffUser({ email, password, role, branchId }) {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  const cleanPassword = password ?? "";

  if (!cleanEmail) throw new Error("Email is required.");
  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const allowedRoles = ["doctor", "reception"];
  if (!allowedRoles.includes(role)) {
    throw new Error("Role must be doctor or reception.");
  }

  if (!branchId) {
    throw new Error("Branch is required.");
  }

  const ephemeral = createEphemeralSupabaseClient();
  const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (signUpError) throw signUpError;

  const userId = signUpData?.user?.id;
  if (!userId) {
    throw new Error(
      "User was created but no user id returned. Check Supabase Auth settings (email confirmations).",
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role,
        branch_id: branchId,
      },
      { onConflict: "id" },
    )
    .select("id, role, branch_id")
    .single();

  if (profileError) throw profileError;

  return {
    userId,
    profile: profileData,
  };
}

