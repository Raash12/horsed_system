import { supabase } from "@/config/supabaseClient";

/**
 * Creates staff via backend Admin API.
 * This avoids email rate-limit and bypasses RLS safely (server uses service role).
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

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
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
    }),
  });

  if (resp.status === 502) {
    throw new Error(
      "Admin API not reachable (502). Start it with `npm run dev:server` and ensure it listens on port 8787.",
    );
  }

  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(payload?.error || "Failed to create staff user.");
  }

  return payload;
}

export async function listDoctors({ branchId } = {}) {
  return listStaff({ role: "doctor", branchId });
}

export async function listStaff({ role, branchId } = {}) {
  if (role && !["doctor", "reception"].includes(role)) {
    throw new Error("Role must be doctor or reception.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not authenticated.");

  const q = new URLSearchParams();
  if (role) q.set("role", role);
  if (branchId) q.set("branchId", branchId);

  const query = q.toString();
  const url = query ? `/api/admin/list-staff?${query}` : `/api/admin/list-staff`;
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

