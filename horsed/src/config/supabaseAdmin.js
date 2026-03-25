import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "supabaseAdmin is not configured. Set no service role key in the browser. Implement admin actions in a server/edge function.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

