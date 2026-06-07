import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN_EMAIL = "admin@aipockettrader.com";
const ADMIN_PASSWORD = "Admin@2024!";
const ADMIN_USERNAME = "admin";

export async function seedAdmin(): Promise<void> {
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL));
    if (existing) {
      // Ensure is_admin is true in case it was flipped
      if (!existing.isAdmin) {
        await db.update(usersTable).set({ isAdmin: true }).where(eq(usersTable.email, ADMIN_EMAIL));
        logger.info("Admin account promoted to admin role");
      }
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.insert(usersTable).values({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      passwordHash,
      credits: 99999,
      botActive: false,
      autoConfirm: false,
      isAdmin: true,
      banned: false,
    });

    logger.info({ email: ADMIN_EMAIL }, "Admin account seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed admin account");
  }
}
