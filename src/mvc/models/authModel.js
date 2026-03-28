import { supabase } from "@/config/supabaseClient";

/**
 * @param {{ captchaToken?: string }} [options] Required when Supabase Auth has CAPTCHA / bot protection enabled (e.g. Cloudflare Turnstile).
 */
export async function signInWithEmailPassword(email, password, options = {}) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const pwd = String(password ?? "");
  if (!normalizedEmail || !pwd) {
    throw new Error("Email and password are required.");
  }

  const { captchaToken } = options;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: pwd,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(handler) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    handler(event, session);
  });

  return data.subscription;
}

