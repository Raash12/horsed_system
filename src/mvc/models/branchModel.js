import { supabase } from "@/config/supabaseClient";

export async function listBranches() {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createBranch({ name }) {
  const trimmedName = (name ?? "").trim();
  if (!trimmedName) throw new Error("Branch name is required.");

  const { data, error } = await supabase
    .from("branches")
    .insert({ name: trimmedName })
    .select("id, name, created_at")
    .single();

  if (error) throw error;
  return data;
}

