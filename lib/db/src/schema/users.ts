import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  credits: integer("credits").notNull().default(100),
  botActive: boolean("bot_active").notNull().default(false),
  autoConfirm: boolean("auto_confirm").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  banned: boolean("banned").notNull().default(false),
  pocketOptionId: text("pocket_option_id"),
  poEmail: text("po_email"),
  poPassword: text("po_password"),
  poAccountType: text("po_account_type").default("demo"),
  poLiveBalance: real("po_live_balance").default(0),
  poDemoBalance: real("po_demo_balance").default(10000),
  poConnected: boolean("po_connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
