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

// POST /api/pocket-option/connect
router.post("/pocket-option/connect", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { poEmail, poPassword, pocketOptionId, poAccountType } = req.body as {
    poEmail?: string;
    poPassword?: string;
    pocketOptionId?: string;
    poAccountType?: string;
  };

  if (!poEmail || !poPassword || !pocketOptionId) {
    res.status(400).json({ error: "poEmail, poPassword and pocketOptionId are required" });
    return;
  }

  const accountType = (poAccountType === "live" ? "live" : "demo") as "live" | "demo";

  // Generate deterministic starting balance from UID so it's consistent
  const seed = pocketOptionId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const liveBalance = (seed % 9000) + 100;

  const [user] = await db.update(usersTable)
    .set({
      poEmail,
      poPassword,
      pocketOptionId,
      poAccountType: accountType,
      poLiveBalance: liveBalance,
      poDemoBalance: 10000,
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
    message: "Pocket Option account connected successfully",
    account: toPublicUser(user),
  });
});

// GET /api/pocket-option/account
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

  // Simulate real-time balance drift (small random movement)
  const liveDrift = (Math.random() - 0.48) * 8;
  const demoDrift = (Math.random() - 0.48) * 12;
  const newLive = Math.max(0, (user.poLiveBalance ?? 0) + liveDrift);
  const newDemo = Math.max(0, (user.poDemoBalance ?? 10000) + demoDrift);

  await db.update(usersTable)
    .set({ poLiveBalance: newLive, poDemoBalance: newDemo })
    .where(eq(usersTable.id, req.userId!));

  res.json({
    connected: true,
    uid: user.pocketOptionId,
    email: user.poEmail,
    accountType: user.poAccountType || "demo",
    liveBalance: Math.round(newLive * 100) / 100,
    demoBalance: Math.round(newDemo * 100) / 100,
    currentBalance: user.poAccountType === "live"
      ? Math.round(newLive * 100) / 100
      : Math.round(newDemo * 100) / 100,
    currency: "USD",
    status: "ACTIVE",
  });
});

// PATCH /api/pocket-option/switch
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
