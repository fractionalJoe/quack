import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { mock } from "node:test";

interface Rendered {
  sql: string;
  params: unknown[];
}

interface TxFake<TRow> {
  execute(query: SQL): Promise<unknown[]>;
  select(): { from(): { where(condition: SQL): Promise<TRow[]> } };
}

export class DbFake<TRow> {
  public readonly settings: Rendered[] = [];
  public readonly conditions: Rendered[] = [];
  public readonly rows: TRow[] = [];
  private readonly dialect = new PgDialect();

  public readonly db = {
    transaction: <T>(fn: (tx: TxFake<TRow>) => Promise<T>): Promise<T> => fn(this.tx),
  };

  private readonly tx: TxFake<TRow> = {
    execute: async (query) => {
      this.settings.push(this.dialect.sqlToQuery(query));
      return [];
    },
    select: () => ({
      from: () => ({
        where: async (condition) => {
          this.conditions.push(this.dialect.sqlToQuery(condition));
          return this.rows;
        },
      }),
    }),
  };

  public pushRows(rows: TRow[]): void {
    this.rows.push(...rows);
  }

  public reset(): void {
    this.settings.length = 0;
    this.conditions.length = 0;
    this.rows.length = 0;
  }

  public async setMockDb<TModule>(importModule: () => Promise<TModule>): Promise<TModule> {
    mock.module("../db.ts", { exports: { initDb: () => this.db } });
    return importModule();
  }
}
