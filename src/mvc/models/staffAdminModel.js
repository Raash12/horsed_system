import { supabase } from "@/config/supabaseClient";

/**
 * Creates staff via backend Admin API.
 */
export async function createStaffUser({
  email,
  password,
  role,
  branchId,
  full_name, // ✅ FIX: added
}) {
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

  if (!full_name) {
    throw new Error("Full name is required."); // ✅ optional validation
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not authenticated.");

  const resp = await fetch("/api/admin/create-staff", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: cleanEmail,
      password: cleanPassword,
      role,
      branchId,
      full_name, // ✅ FIX: send to backend
    }),
  });

  if (resp.status === 502) {
    throw new Error(
      "Admin API not reachable (502). Start it with `npm run dev:server`.",
    );
  }

  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(payload?.error || "Failed to create staff user.");
  }

  return payload;
}

/**
 * List staff
 */
export async function listStaff({ role, branchId } = {}) {
  if (role && !["doctor", "reception"].includes(role)) {
    throw new Error("Role must be doctor or reception.");
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not authenticated.");

  const q = new URLSearchParams();
  if (role) q.set("role", role);
  if (branchId) q.set("branchId", branchId);

  const url = `/api/admin/list-staff?${q.toString()}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(payload?.error || "Failed to load staff.");
  }

  return payload?.data ?? [];
}