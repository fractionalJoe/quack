import { NodePgDatabase, type NodePgTransaction } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.ts";
import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import { initDb } from "./db.ts";

interface IdentityKey {
  duckId?: string;
  pondId: string;
  googleSubject?: string;
}

export type Transaction = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export class QuackClient {
  private readonly duckId?: string;
  private readonly pondId: string;
  private readonly googleSubject?: string;
  private readonly db: NodePgDatabase<typeof schema>;

  constructor(id: IdentityKey) {
    this.duckId = id.duckId;
    this.pondId = id.pondId;
    this.googleSubject = id.googleSubject;
    this.db = initDb();
  }

  public execute<T>(query: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.pond_id', ${this.pondId}, true)`);
      if (this.duckId) {
        await tx.execute(sql`select set_config('app.duck_id', ${this.duckId}, true)`);
      }
      if (this.googleSubject) {
        await tx.execute(sql`select set_config('app.google_subject', ${this.googleSubject}, true)`);
      }
      return query(tx);
    });
  }
}
