import { Router, type IRouter } from "express";
import { db, topupsTable, usersTable, tradesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { ApproveTopupParams, AdminUpdateUserParams, AdminAdjustCreditsParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function toAdminUser(user: typeof usersTable.$inferSelect, totalTrades: number) {
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
    totalTrades,
    createdAt: user.createdAt,
  };
}

// List all users with trade counts
router.get("/admin/users", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const tradeCounts = await db
    .select({ userId: tradesTable.userId, count: count() })
    .from(tradesTable)
    .groupBy(tradesTable.userId);

  const tradeMap = new Map(tradeCounts.map(t => [t.userId, Number(t.count)]));

  res.json(users.map(u => toAdminUser(u, tradeMap.get(u.id) ?? 0)));
});

// Update user (ban/unban, promote admin)
router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { banned, isAdmin } = req.body as { banned?: boolean; isAdmin?: boolean };
  const updateData: Record<string, boolean> = {};
  if (banned !== undefined) updateData["banned"] = banned;
  if (isAdmin !== undefined) updateData["isAdmin"] = isAdmin;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [tradeCount] = await db
    .select({ count: count() })
    .from(tradesTable)
    .where(eq(tradesTable.userId, updated.id));

  res.json(toAdminUser(updated, Number(tradeCount?.count ?? 0)));
});

// Manually adjust user credits
router.patch("/admin/users/:id/credits", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminAdjustCreditsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { credits } = req.body as { credits?: number };
  if (credits === undefined || typeof credits !== "number") {
    res.status(400).json({ error: "credits is required" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ credits: Math.max(0, credits) })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [tradeCount] = await db
    .select({ count: count() })
    .from(tradesTable)
    .where(eq(tradesTable.userId, updated.id));

  res.json(toAdminUser(updated, Number(tradeCount?.count ?? 0)));
});

// List all topups (all statuses)
router.get("/admin/topups", requireAuth, requireAdmin, async (_req: AuthRequest, res): Promise<void> => {
  const results = await db
    .select({
      id: topupsTable.id,
      userId: topupsTable.userId,
      username: usersTable.username,
      email: usersTable.email,
      package: topupsTable.package,
      credits: topupsTable.credits,
      usdAmount: topupsTable.usdAmount,
      tonAmount: topupsTable.tonAmount,
      txHash: topupsTable.txHash,
      currency: topupsTable.currency,
      status: topupsTable.status,
      createdAt: topupsTable.createdAt,
    })
    .from(topupsTable)
    .innerJoin(usersTable, eq(topupsTable.userId, usersTable.id))
    .orderBy(desc(topupsTable.createdAt));

  res.json(results);
});

// Approve topup
router.post("/admin/topups/:id/approve", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveTopupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [topup] = await db.select().from(topupsTable).where(eq(topupsTable.id, params.data.id));
  if (!topup) {
    res.status(404).json({ error: "Top-up request not found" });
    return;
  }

  if (topup.status !== "pending") {
    res.status(400).json({ error: "Only pending top-up requests can be approved" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, topup.userId));
  if (user) {
    await db.update(usersTable)
      .set({ credits: user.credits + topup.credits })
      .where(eq(usersTable.id, topup.userId));
  }

  const [updated] = await db.update(topupsTable)
    .set({ status: "approved" })
    .where(eq(topupsTable.id, params.data.id))
    .returning();

  res.json(updated);
});

// Reject topup
router.post("/admin/topups/:id/reject", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveTopupParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [topup] = await db.select().from(topupsTable).where(eq(topupsTable.id, params.data.id));
  if (!topup) {
    res.status(404).json({ error: "Top-up request not found" });
    return;
  }

  const [updated] = await db.update(topupsTable)
    .set({ status: "rejected" })
    .where(eq(topupsTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
