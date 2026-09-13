import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ponds } from "./ponds.ts";
import { flocks } from "./flocks.ts";
import { ducks } from "./ducks.ts";
import { sql } from "drizzle-orm";

export const messages = pgTable(
  "messages",
  {
    id: uuid("message_id").primaryKey(),
    pondId: uuid("pond_id")
      .notNull()
      .references(() => ponds.id),
    flockId: uuid("flock_id")
      .references(() => flocks.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => ducks.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index().on(t.flockId, t.id), check("body_length", sql`char_length(${t.body}) <= 4000`)],
);
