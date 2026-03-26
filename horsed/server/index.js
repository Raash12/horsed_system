import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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

// Try to load `.env.server` automatically (dev convenience).
// We check both:
// - the current working directory (what npm scripts usually set)
// - the project root next to `server/`
// Additionally, we also try `.env` so you can keep a single env file for dev.
loadDotEnvFileIfPresent(path.resolve(process.cwd(), ".env.server"));
loadDotEnvFileIfPresent(path.resolve(__dirname, "..", ".env.server"));
loadDotEnvFileIfPresent(path.resolve(process.cwd(), ".env"));
loadDotEnvFileIfPresent(path.resolve(__dirname, "..", ".env"));

// Support both "server" var names and "vite" var names as a convenience.
// IMPORTANT: keep service-role key out of browser builds (do NOT prefix it with `VITE_` in `.env`).
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const EXPECTED_SUPABASE_REF = SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;

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

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
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

  // Avoid confusing "Invalid API key" errors when the frontend accidentally sends
  // a malformed token (e.g. `Bearer undefined`).
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { ok: false, status: 401, error: "Malformed access token. Please re-login." };
  }
  if (EXPECTED_SUPABASE_REF && typeof payload?.ref === "string" && payload.ref !== EXPECTED_SUPABASE_REF) {
    return {
      ok: false,
      status: 401,
      error:
        "Access token belongs to a different Supabase project. Please logout/login again (refresh the app).",
    };
  }
  if (typeof payload?.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { ok: false, status: 401, error: "Access token expired. Please re-login." };
    }
  }

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

app.get("/api/admin/list-staff", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({
        error:
          "Admin API is not configured. Create `.env` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart `npm run dev:server`.",
      });
    }

    const gate = await requireSuperAdmin(req);
    if (!gate.ok) return res.status(gate.status).json({ error: gate.error });

    const roleQuery = String(req.query?.role ?? "");
    const branchId = String(req.query?.branchId ?? "");

    const normalized = roleQuery.toLowerCase();
    const roles = ["doctor", "reception"].includes(normalized)
      ? [normalized]
      : ["", "all", "staff"].includes(normalized)
        ? ["doctor", "reception"]
        : [];

    if (roles.length === 0) {
      return res.status(400).json({ error: "Query `role` must be `doctor`, `reception`, `staff`, or empty." });
    }

    let profilesQ = supabaseAdmin.from("profiles").select("id, role, branch_id");
    if (roles.length === 1) profilesQ = profilesQ.eq("role", roles[0]);
    else profilesQ = profilesQ.in("role", roles);
    if (branchId) profilesQ = profilesQ.eq("branch_id", branchId);

    const { data: profiles, error: profilesErr } = await profilesQ;
    if (profilesErr) return res.status(400).json({ error: profilesErr.message });

    const branchIds = [...new Set(profiles?.map((p) => p.branch_id).filter(Boolean) ?? [])];
    let branchMap = new Map();
    if (branchIds.length > 0) {
      const { data: branches, error: branchesErr } = await supabaseAdmin
        .from("branches")
        .select("id, name")
        .in("id", branchIds);
      if (branchesErr) return res.status(400).json({ error: branchesErr.message });
      for (const b of branches ?? []) branchMap.set(b.id, b.name);
    }

    const staff = await Promise.all(
      (profiles ?? []).map(async (p) => {
        // `profiles` table doesn't store email, so we fetch it from auth.users via admin API.
        const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(p.id);
        if (userErr) return { id: p.id, email: null, role: p.role, branch_id: p.branch_id };
        return {
          id: p.id,
          email: user?.email ?? null,
          role: p.role,
          branch_id: p.branch_id,
          branch_name: branchMap.get(p.branch_id) ?? null,
        };
      })
    );

    return res.json({ data: staff });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error." });
  }
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

