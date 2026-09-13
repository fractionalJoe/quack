import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const ponds = pgTable("ponds", {
  id: uuid("pond_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
