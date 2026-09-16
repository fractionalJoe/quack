import { NodePgDatabase, type NodePgTransaction } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.ts";
import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import { initDb } from "./db.ts";

export type Transaction = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type Identity =
  | {
      googleSubject?: string;
      duckId: string;
    }
  | {
      googleSubject: string;
      duckId?: string;
    };

export class QuackClient {
  constructor(
    private readonly id: Identity,
    private readonly pondId?: string,
    private readonly db: NodePgDatabase<typeof schema> = initDb(),
  ) {}

  public execute<T>(query: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      if (this.pondId) {
        await tx.execute(sql`select set_config('app.pond_id', ${this.pondId}, true)`);
      }
      if (this.id.duckId) {
        await tx.execute(sql`select set_config('app.duck_id', ${this.id.duckId}, true)`);
      }
      if (this.id.googleSubject) {
        await tx.execute(
          sql`select set_config('app.google_subject', ${this.id.googleSubject}, true)`,
        );
      }
      return query(tx);
    });
  }
}
