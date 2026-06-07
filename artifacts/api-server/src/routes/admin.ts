import { Router, type IRouter } from "express";
import { db, topupsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ApproveTopupParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

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
      status: topupsTable.status,
      createdAt: topupsTable.createdAt,
    })
    .from(topupsTable)
    .innerJoin(usersTable, eq(topupsTable.userId, usersTable.id))
    .orderBy(desc(topupsTable.createdAt));

  res.json(results);
});

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

  // Add credits to user
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

export default router;
