import { supabase } from "@/config/supabaseClient";

export async function getProfileByUserId(userId) {
  // `profiles.id` should be equal to `auth.users.id`.
  const { data, error } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

