import { Router, type IRouter } from "express";
import { db, topupsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateTopupBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const PACKAGES: Record<string, { credits: number; usdAmount: number; tonAmount: number }> = {
  "100": { credits: 100, usdAmount: 10, tonAmount: 2 },
  "500": { credits: 500, usdAmount: 45, tonAmount: 9 },
  "1000": { credits: 1000, usdAmount: 80, tonAmount: 16 },
};

router.get("/topups", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const topups = await db
    .select()
    .from(topupsTable)
    .where(eq(topupsTable.userId, req.userId!))
    .orderBy(desc(topupsTable.createdAt));

  res.json(topups);
});

router.post("/topups", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTopupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const pkg = PACKAGES[parsed.data.package];
  if (!pkg) {
    res.status(400).json({ error: "Invalid package" });
    return;
  }

  const [topup] = await db.insert(topupsTable).values({
    userId: req.userId!,
    package: parsed.data.package,
    credits: pkg.credits,
    usdAmount: pkg.usdAmount,
    tonAmount: pkg.tonAmount,
    txHash: parsed.data.txHash,
    status: "pending",
  }).returning();

  res.status(201).json(topup);
});

export default router;
