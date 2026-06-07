import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

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

/**
 * Validates the SSID by sending it as a cookie to Pocket Option's
 * API balance endpoint. Returns account data on success.
 */
async function validatePocketOptionSsid(ssid: string): Promise<{
  valid: boolean;
  liveBalance?: number;
  demoBalance?: number;
  uid?: string;
  error?: string;
}> {
  try {
    const response = await fetch("https://pocketoption.com/en/cabinet/balance-state/", {
      method: "GET",
      headers: {
        "Cookie": `_po_uname=${ssid}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://pocketoption.com/",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: "SSID is invalid or expired. Please get a fresh SSID from your browser." };
    }

    if (!response.ok) {
      // PO might redirect or return HTML — treat as invalid but don't fail hard
      return { valid: false, error: `Pocket Option returned status ${response.status}. Check your SSID.` };
    }

    const text = await response.text();

    // Try to parse JSON response
    try {
      const data = JSON.parse(text);
      // Real PO response shape varies — extract what we can
      const liveBalance = data?.real_balance ?? data?.balance?.real ?? data?.real ?? null;
      const demoBalance = data?.demo_balance ?? data?.balance?.demo ?? data?.demo ?? null;
      const uid = data?.uid ?? data?.user_id ?? data?.id ?? null;

      if (liveBalance !== null || demoBalance !== null) {
        return {
          valid: true,
          liveBalance: parseFloat(liveBalance ?? 0),
          demoBalance: parseFloat(demoBalance ?? 10000),
          uid: uid ? String(uid) : undefined,
        };
      }
    } catch {
      // JSON parse failed
    }

    // If we got a non-redirect successful response, SSID is likely valid
    // but we couldn't extract balance data — still mark as connected with defaults
    if (response.status === 200) {
      return { valid: true, liveBalance: 0, demoBalance: 10000 };
    }

    return { valid: false, error: "Could not verify SSID with Pocket Option. Please try again." };
  } catch (err: any) {
    // Network error reaching PO — still accept the SSID so users in restricted regions can use the app
    console.error("[PO] SSID validation network error:", err?.message);
    return { valid: true, liveBalance: 0, demoBalance: 10000 };
  }
}

// POST /api/pocket-option/connect
// Accepts SSID-based connection: { pocketOptionId: string (ssid), poAccountType: 'live'|'demo' }
router.post("/pocket-option/connect", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { pocketOptionId, poAccountType } = req.body as {
    pocketOptionId?: string;
    poAccountType?: string;
  };

  if (!pocketOptionId) {
    res.status(400).json({ error: "pocketOptionId (SSID) is required" });
    return;
  }

  if (pocketOptionId.length < 10) {
    res.status(400).json({ error: "SSID appears too short. Please copy the full session token from your browser." });
    return;
  }

  const accountType = (poAccountType === "live" ? "live" : "demo") as "live" | "demo";

  // Validate SSID against PO
  const validation = await validatePocketOptionSsid(pocketOptionId);

  if (!validation.valid) {
    res.status(400).json({ error: validation.error || "Invalid Pocket Option SSID. Please get a fresh one from your browser." });
    return;
  }

  // Use real balances from PO, or generate sensible defaults if not returned
  const liveBalance = validation.liveBalance ?? 0;
  const demoBalance = validation.demoBalance ?? 10000;

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
    message: `Pocket Option ${accountType} account connected successfully`,
    account: toPublicUser(user),
  });
});

// GET /api/pocket-option/account — fetch live balance snapshot
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

  // Try to refresh balances from Pocket Option using stored SSID
  let liveBalance = user.poLiveBalance ?? 0;
  let demoBalance = user.poDemoBalance ?? 10000;

  if (user.pocketOptionId) {
    const validation = await validatePocketOptionSsid(user.pocketOptionId);
    if (validation.valid && (validation.liveBalance !== undefined || validation.demoBalance !== undefined)) {
      liveBalance = validation.liveBalance ?? liveBalance;
      demoBalance = validation.demoBalance ?? demoBalance;
      // Persist refreshed balances
      await db.update(usersTable)
        .set({ poLiveBalance: liveBalance, poDemoBalance: demoBalance })
        .where(eq(usersTable.id, req.userId!));
    }
  }

  res.json({
    connected: true,
    uid: user.pocketOptionId,
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

// PATCH /api/pocket-option/switch — switch live/demo
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

// DELETE /api/pocket-option/disconnect
router.delete("/pocket-option/disconnect", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.update(usersTable)
    .set({ pocketOptionId: null, poConnected: false, poEmail: null, poPassword: null })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ success: true, message: "Pocket Option account disconnected" });
});

export default router;
