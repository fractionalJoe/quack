import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { ponds } from "./ponds.ts";
import { ducks } from "./ducks.ts";
import { sql } from "drizzle-orm";

export const flocks = pgTable(
  "flocks",
  {
    id: uuid("flock_id")
      .primaryKey()
      .default(sql`uuidv7()`),
    pondId: uuid("pond_id")
      .notNull()
      .references(() => ponds.id),
    name: text("name").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => ducks.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.pondId, t.name)],
);
