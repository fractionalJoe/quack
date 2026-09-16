import { test } from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { QuackClient, type Transaction } from "./quack-client.ts";

const dialect = new PgDialect();

// A stand-in for the Drizzle database: records every statement the transaction runs.
function fakeDb() {
  const statements: { sql: string; params: unknown[] }[] = [];
  const tx = {
    execute: async (query: SQL) => {
      statements.push(dialect.sqlToQuery(query));
      return [];
    },
  };
  const db = {
    transaction: async <T>(fn: (tx: Transaction) => Promise<T>) => fn(tx as unknown as Transaction),
  };
  return { db: db as unknown as ConstructorParameters<typeof QuackClient>[2], statements };
}

const pondId = "pond-1";

test("sets the pond and the duck when only the duck is known", async () => {
  // given
  const { db, statements } = fakeDb();
  const client = new QuackClient({ duckId: "duck-1" }, pondId, db);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    statements.map((s) => s.params),
    [[pondId], ["duck-1"]],
  );
  assert.match(statements[0]!.sql, /set_config\('app\.pond_id', \$1, true\)/);
  assert.match(statements[1]!.sql, /set_config\('app\.duck_id', \$1, true\)/);
});

test("sets the pond and the subject when only the subject is known", async () => {
  // given
  const { db, statements } = fakeDb();
  const client = new QuackClient({ googleSubject: "sub-1" }, pondId, db);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    statements.map((s) => s.params),
    [[pondId], ["sub-1"]],
  );
  assert.match(statements[1]!.sql, /set_config\('app\.google_subject', \$1, true\)/);
});

test("sets all three when both are known", async () => {
  // given
  const { db, statements } = fakeDb();
  const client = new QuackClient({ duckId: "duck-1", googleSubject: "sub-1" }, pondId, db);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    statements.map((s) => s.params),
    [[pondId], ["duck-1"], ["sub-1"]],
  );
});

test("sets only the subject when no pond is given", async () => {
  // given
  const { db, statements } = fakeDb();
  const client = new QuackClient({ googleSubject: "sub-1" }, undefined, db);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    statements.map((s) => s.params),
    [["sub-1"]],
  );
  assert.match(statements[0]!.sql, /set_config\('app\.google_subject', \$1, true\)/);
});

test("the settings are in place before the query runs and its result is returned", async () => {
  // given
  const { db, statements } = fakeDb();
  const client = new QuackClient({ duckId: "duck-1" }, pondId, db);

  // when
  const result = await client.execute(async () => statements.length);

  // then
  assert.equal(result, 2);
});

test("a query failure propagates", async () => {
  // given
  const { db } = fakeDb();
  const client = new QuackClient({ duckId: "duck-1" }, pondId, db);

  // when
  const result = client.execute(async () => {
    throw new Error("query failed");
  });

  // then
  await assert.rejects(result, /query failed/);
});
