import { Router, type IRouter } from "express";
import { db, tradesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ExecuteTradeBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/trades", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const trades = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.userId, req.userId!))
    .orderBy(desc(tradesTable.createdAt));

  res.json(trades);
});

router.post("/trades", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = ExecuteTradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.credits <= 0) {
    res.status(400).json({ error: "Insufficient credits. Please top up to continue trading." });
    return;
  }

  // Deduct 1 credit
  await db.update(usersTable)
    .set({ credits: user.credits - 1 })
    .where(eq(usersTable.id, req.userId!));

  // Simulate result: ~55% win rate
  const result: "win" | "loss" = Math.random() < 0.55 ? "win" : "loss";

  const [trade] = await db.insert(tradesTable).values({
    userId: req.userId!,
    asset: parsed.data.asset,
    timeframe: parsed.data.timeframe,
    amount: parsed.data.amount,
    direction: parsed.data.direction,
    result,
  }).returning();

  res.status(201).json(trade);
});

router.get("/trades/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const trades = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.userId, req.userId!));

  const totalTrades = trades.length;
  const wins = trades.filter(t => t.result === "win").length;
  const losses = trades.filter(t => t.result === "loss").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;
  const creditsSpent = totalTrades;

  res.json({ totalTrades, wins, losses, winRate, creditsSpent });
});

export default router;
