import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { ponds } from "./ponds.ts";
import { flocks } from "./flocks.ts";
import { ducks } from "./ducks.ts";

export const memberships = pgTable(
  "memberships",
  {
    flockId: uuid("flock_id")
      .references(() => flocks.id, { onDelete: "cascade" })
      .notNull(),
    duckId: uuid("duck_id")
      .notNull()
      .references(() => ducks.id),
    pondId: uuid("pond_id")
      .notNull()
      .references(() => ponds.id),
    addedBy: uuid("added_by")
      .notNull()
      .references(() => ducks.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.flockId, t.duckId] }), index().on(t.duckId, t.flockId)],
);
