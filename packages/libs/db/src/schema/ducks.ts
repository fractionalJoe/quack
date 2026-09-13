import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { ponds } from "./ponds.ts";

export const ducks = pgTable(
  "ducks",
  {
    id: uuid("duck_id").primaryKey(),
    pondId: uuid("pond_id")
      .notNull()
      .references(() => ponds.id),
    googleSubject: text("google_subject").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.pondId, t.googleSubject), unique().on(t.pondId, t.displayName)],
);
