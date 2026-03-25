import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 8787);

function loadDotEnvFileIfPresent(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore env file parse errors; we will surface config errors via API responses
  }
}

// Try to load `.env.server` automatically (dev convenience)
loadDotEnvFileIfPresent(path.resolve(process.cwd(), ".env.server"));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m?.[1] || null;
}

async function requireSuperAdmin(req) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return {
      ok: false,
      status: 500,
      error:
        "Admin API is not configured. Create `.env.server` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart `npm run dev:server`.",
    };
  }

  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Missing Authorization Bearer token." };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError) return { ok: false, status: 401, error: userError.message || "Invalid token." };

  const userId = userData?.user?.id;
  if (!userId) return { ok: false, status: 401, error: "Invalid token (no user)." };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) {
    return { ok: false, status: 403, error: profileError.message || "Profile not found." };
  }

  if (profile?.role !== "super_admin") {
    return { ok: false, status: 403, error: "Access denied." };
  }

  return { ok: true, userId };
}

app.get("/api/health", (_req, res) => {
  const configured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
  res.json({ ok: true, configured });
});

app.post("/api/admin/create-staff", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({
        error:
          "Admin API is not configured. Create `.env.server` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart `npm run dev:server`.",
      });
    }

    const gate = await requireSuperAdmin(req);
    if (!gate.ok) return res.status(gate.status).json({ error: gate.error });

    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const role = String(req.body?.role ?? "");
    const branchId = String(req.body?.branchId ?? "");

    if (!email) return res.status(400).json({ error: "Email is required." });
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (!["doctor", "reception"].includes(role)) {
      return res.status(400).json({ error: "Role must be doctor or reception." });
    }
    if (!branchId) return res.status(400).json({ error: "Branch is required." });

    // Create auth user without sending confirmation email (dev-friendly)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return res.status(400).json({ error: createErr.message });

    const newUserId = created?.user?.id;
    if (!newUserId) return res.status(500).json({ error: "No user id returned." });

    // Upsert profile (service role bypasses RLS)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          role,
          branch_id: branchId,
        },
        { onConflict: "id" },
      )
      .select("id, role, branch_id")
      .single();

    if (profileErr) return res.status(400).json({ error: profileErr.message });

    return res.json({
      userId: newUserId,
      profile,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error." });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Admin API listening on http://localhost:${PORT}`);
});

