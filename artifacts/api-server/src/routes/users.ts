import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBotStatusBody } from "@workspace/api-zod";
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
    createdAt: user.createdAt,
  };
}

router.get("/users/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.patch("/users/me/bot", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateBotStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, boolean> = {};
  if (parsed.data.botActive !== undefined) updateData["botActive"] = parsed.data.botActive;
  if (parsed.data.autoConfirm !== undefined) updateData["autoConfirm"] = parsed.data.autoConfirm;

  const [user] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

export default router;
