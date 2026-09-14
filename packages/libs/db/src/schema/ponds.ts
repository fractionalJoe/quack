import { sql } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const ponds = pgTable("ponds", {
  id: uuid("pond_id")
    .primaryKey()
    .default(sql`uuidv7()`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
