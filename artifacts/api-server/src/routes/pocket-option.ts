import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function toPublicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    credits: user.credits,
    botActive: user.botActive,
    autoConfirm: user.autoConfirm,
    isAdmin: user.isAdmin,
    banned: user.banned,
    pocketOptionId: user.pocketOptionId ?? null,
    poEmail: user.poEmail ?? null,
    poAccountType: user.poAccountType ?? "demo",
    poLiveBalance: user.poLiveBalance ?? 0,
    poDemoBalance: user.poDemoBalance ?? 10000,
    poConnected: user.poConnected ?? false,
    createdAt: user.createdAt,
  };
}

/** Parse Set-Cookie headers into a cookie jar string */
function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const part = header.split(";")[0];
    if (!part) continue;
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) jar[name] = value;
  }
  return jar;
}

function cookieJarToString(jar: Record<string, string>): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/** Extract CSRF token from Pocket Option login page HTML */
function extractCsrfToken(html: string): string | null {
  // Try <input type="hidden" name="_token" value="...">
  const m1 = html.match(/<input[^>]+name=["']_token["'][^>]+value=["']([^"']+)["']/i);
  if (m1) return m1[1] ?? null;
  // Try <meta name="csrf-token" content="...">
  const m2 = html.match(/<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i);
  if (m2) return m2[1] ?? null;
  // Reversed attribute order
  const m3 = html.match(/<input[^>]+value=["']([^"']+)["'][^>]+name=["']_token["']/i);
  if (m3) return m3[1] ?? null;
  return null;
}

/** Extract balance values from various possible PO API response shapes */
function extractBalances(data: any): { live: number; demo: number } | null {
  // Try common balance field names
  const live =
    data?.real_balance ??
    data?.balance?.real ??
    data?.live_balance ??
    data?.real ??
    null;
  const demo =
    data?.demo_balance ??
    data?.balance?.demo ??
    data?.demo ??
    null;

  if (live !== null || demo !== null) {
    return {
      live: parseFloat(live ?? 0) || 0,
      demo: parseFloat(demo ?? 10000) || 10000,
    };
  }
  return null;
}

const PO_BASE = "https://pocketoption.com";
const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Full Pocket Option credential login flow:
 * 1. GET login page → extract CSRF token + initial cookies
 * 2. POST credentials → capture session cookies
 * 3. Verify session by hitting the balance endpoint
 */
async function loginWithCredentials(
  poEmail: string,
  poPassword: string
): Promise<{
  success: boolean;
  ssid?: string;
  cookieHeader?: string;
  liveBalance?: number;
  demoBalance?: number;
  error?: string;
}> {
  try {
    // ── Step 1: GET login page for CSRF token ──
    const loginPageRes = await fetch(`${PO_BASE}/en/login/`, {
      method: "GET",
      headers: COMMON_HEADERS,
      redirect: "follow",
    });

    const loginPageHtml = await loginPageRes.text();
    const csrfToken = extractCsrfToken(loginPageHtml);

    // Collect initial cookies
    const rawCookies = loginPageRes.headers.getSetCookie?.() ?? [];
    let cookieJar = parseCookies(rawCookies);

    // ── Step 2: POST credentials ──
    const formBody = new URLSearchParams({
      email: poEmail,
      password: poPassword,
      remember: "1",
      ...(csrfToken ? { _token: csrfToken } : {}),
    });

    const loginRes = await fetch(`${PO_BASE}/en/login/`, {
      method: "POST",
      headers: {
        ...COMMON_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: `${PO_BASE}/en/login/`,
        Cookie: cookieJarToString(cookieJar),
      },
      body: formBody.toString(),
      redirect: "manual", // capture redirect + cookies manually
    });

    // Merge new cookies from login response
    const loginCookies = loginRes.headers.getSetCookie?.() ?? [];
    cookieJar = { ...cookieJar, ...parseCookies(loginCookies) };

    // If PO returned 302 to dashboard, follow it to get more cookies
    const location = loginRes.headers.get("location");
    if (location && (loginRes.status === 301 || loginRes.status === 302 || loginRes.status === 303)) {
      const redirectUrl = location.startsWith("http") ? location : `${PO_BASE}${location}`;
      const redirectRes = await fetch(redirectUrl, {
        method: "GET",
        headers: {
          ...COMMON_HEADERS,
          Cookie: cookieJarToString(cookieJar),
          Referer: `${PO_BASE}/en/login/`,
        },
        redirect: "follow",
      });
      const redirectCookies = redirectRes.headers.getSetCookie?.() ?? [];
      cookieJar = { ...cookieJar, ...parseCookies(redirectCookies) };
    }

    // ── Step 3: Check if we have a valid session ──
    // Look for the session cookie — PO uses _po_uname or similar
    const ssid =
      cookieJar["_po_uname"] ??
      cookieJar["po_uname"] ??
      cookieJar["session"] ??
      cookieJar["PHPSESSID"] ??
      null;

    const cookieHeader = cookieJarToString(cookieJar);

    // Verify session by hitting the balance/cabinet endpoint
    const balanceRes = await fetch(`${PO_BASE}/en/cabinet/`, {
      method: "GET",
      headers: {
        ...COMMON_HEADERS,
        Cookie: cookieHeader,
        Referer: `${PO_BASE}/en/login/`,
      },
      redirect: "follow",
    });

    const balanceUrl = balanceRes.url;
    // If we got redirected back to login, credentials were wrong
    if (balanceUrl.includes("/login") || balanceUrl.includes("/logout")) {
      return { success: false, error: "Incorrect Pocket Option email or password. Please check and try again." };
    }

    // Try to get balance from JSON API
    let liveBalance = 0;
    let demoBalance = 10000;

    try {
      const balApiRes = await fetch(`${PO_BASE}/en/cabinet/balance-state/`, {
        method: "GET",
        headers: {
          ...COMMON_HEADERS,
          Cookie: cookieHeader,
          Accept: "application/json",
          Referer: `${PO_BASE}/en/cabinet/`,
        },
      });

      if (balApiRes.ok) {
        const text = await balApiRes.text();
        try {
          const json = JSON.parse(text);
          const balances = extractBalances(json);
          if (balances) {
            liveBalance = balances.live;
            demoBalance = balances.demo;
          }
        } catch {
          // JSON parse failed, use defaults
        }
      }
    } catch {
      // Balance fetch failed, proceed with defaults
    }

    return {
      success: true,
      ssid: ssid ?? cookieHeader,
      cookieHeader,
      liveBalance,
      demoBalance,
    };
  } catch (err: any) {
    console.error("[PO] Login error:", err?.message);
    return { success: false, error: "Could not reach Pocket Option. Please check your internet connection." };
  }
}

/**
 * Use stored session cookie to refresh balances from PO
 */
async function refreshBalance(cookieHeader: string): Promise<{ live: number; demo: number } | null> {
  try {
    const res = await fetch(`${PO_BASE}/en/cabinet/balance-state/`, {
      method: "GET",
      headers: {
        ...COMMON_HEADERS,
        Cookie: cookieHeader,
        Accept: "application/json",
        Referer: `${PO_BASE}/en/cabinet/`,
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const json = JSON.parse(text);
    return extractBalances(json);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

/**
 * POST /api/pocket-option/connect-credentials
 * Connect using Pocket Option email + password (primary flow)
 */
router.post("/pocket-option/connect-credentials", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { poEmail, poPassword, poAccountType } = req.body as {
    poEmail?: string;
    poPassword?: string;
    poAccountType?: string;
  };

  if (!poEmail || !poPassword) {
    res.status(400).json({ error: "Pocket Option email and password are required." });
    return;
  }

  const accountType = (poAccountType === "live" ? "live" : "demo") as "live" | "demo";

  const result = await loginWithCredentials(poEmail, poPassword);

  if (!result.success) {
    res.status(401).json({ error: result.error });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({
      poEmail,
      poPassword,
      // Store full cookie header as SSID for future API calls
      pocketOptionId: result.ssid ?? result.cookieHeader ?? poEmail,
      poAccountType: accountType,
      poLiveBalance: result.liveBalance ?? 0,
      poDemoBalance: result.demoBalance ?? 10000,
      poConnected: true,
    })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    success: true,
    message: `Pocket Option ${accountType} account connected`,
    liveBalance: result.liveBalance,
    demoBalance: result.demoBalance,
    account: toPublicUser(user),
  });
});

/**
 * POST /api/pocket-option/connect
 * Connect using SSID directly (manual/advanced fallback)
 */
router.post("/pocket-option/connect", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { pocketOptionId, poAccountType } = req.body as {
    pocketOptionId?: string;
    poAccountType?: string;
  };

  if (!pocketOptionId) {
    res.status(400).json({ error: "Session SSID is required." });
    return;
  }

  if (pocketOptionId.length < 8) {
    res.status(400).json({ error: "SSID appears too short. Copy the full session token." });
    return;
  }

  const accountType = (poAccountType === "live" ? "live" : "demo") as "live" | "demo";

  // Try to use SSID as cookie to fetch real balance
  let liveBalance = 0;
  let demoBalance = 10000;

  try {
    const cookieHeader = pocketOptionId.includes("=")
      ? pocketOptionId // looks like full cookie string
      : `_po_uname=${pocketOptionId}`;

    const bal = await refreshBalance(cookieHeader);
    if (bal) {
      liveBalance = bal.live;
      demoBalance = bal.demo;
    }
  } catch {
    // proceed with defaults
  }

  const [user] = await db.update(usersTable)
    .set({
      pocketOptionId,
      poAccountType: accountType,
      poLiveBalance: liveBalance,
      poDemoBalance: demoBalance,
      poConnected: true,
    })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    success: true,
    message: "Pocket Option account connected via SSID",
    account: toPublicUser(user),
  });
});

/**
 * GET /api/pocket-option/account
 * Refresh balances from PO
 */
router.get("/pocket-option/account", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!user.poConnected) {
    res.status(400).json({ error: "Pocket Option account not connected" });
    return;
  }

  let liveBalance = user.poLiveBalance ?? 0;
  let demoBalance = user.poDemoBalance ?? 10000;

  // Try to refresh from PO using stored session
  if (user.pocketOptionId) {
    try {
      const cookieHeader = user.pocketOptionId.includes("=")
        ? user.pocketOptionId
        : `_po_uname=${user.pocketOptionId}`;
      const bal = await refreshBalance(cookieHeader);
      if (bal) {
        liveBalance = bal.live;
        demoBalance = bal.demo;
        await db.update(usersTable)
          .set({ poLiveBalance: liveBalance, poDemoBalance: demoBalance })
          .where(eq(usersTable.id, req.userId!));
      }
    } catch {
      // use stored values
    }
  }

  res.json({
    connected: true,
    uid: user.pocketOptionId,
    email: user.poEmail,
    accountType: user.poAccountType || "demo",
    liveBalance: Math.round(liveBalance * 100) / 100,
    demoBalance: Math.round(demoBalance * 100) / 100,
    currentBalance: user.poAccountType === "live"
      ? Math.round(liveBalance * 100) / 100
      : Math.round(demoBalance * 100) / 100,
    currency: "USD",
    status: "ACTIVE",
  });
});

/**
 * PATCH /api/pocket-option/switch
 * Switch between live/demo account
 */
router.patch("/pocket-option/switch", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { poAccountType } = req.body as { poAccountType?: string };
  if (poAccountType !== "live" && poAccountType !== "demo") {
    res.status(400).json({ error: "poAccountType must be 'live' or 'demo'" });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ poAccountType })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    success: true,
    accountType: user.poAccountType,
    currentBalance: user.poAccountType === "live" ? user.poLiveBalance : user.poDemoBalance,
  });
});

/**
 * DELETE /api/pocket-option/disconnect
 */
router.delete("/pocket-option/disconnect", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.update(usersTable)
    .set({ poEmail: null, poPassword: null, pocketOptionId: null, poConnected: false })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, message: "Pocket Option account disconnected" });
});

export default router;
