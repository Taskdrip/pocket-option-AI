import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const topupsTable = pgTable("topups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  package: text("package").notNull(), // "100" | "500" | "1000"
  credits: integer("credits").notNull(),
  usdAmount: real("usd_amount").notNull(),
  tonAmount: real("ton_amount").notNull(),
  txHash: text("tx_hash").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTopupSchema = createInsertSchema(topupsTable).omit({ id: true, createdAt: true });
export type InsertTopup = z.infer<typeof insertTopupSchema>;
export type Topup = typeof topupsTable.$inferSelect;
