import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { resolveDuck as resolveDuckFn } from "./resolve-duck.ts";
import { DbFake } from "./db-fake.ts";

let resolveDuck: typeof resolveDuckFn;
type Row = { duckId: string; name: string };
const dbFake = new DbFake<Row>();

before(async () => {
  ({ resolveDuck } = await dbFake.setMockDb(() => import("./resolve-duck.ts")));
});

beforeEach(() => {
  dbFake.reset();
});

test("returns the duck for the subject in the pond", async () => {
  // given
  const duck = { duckId: "duck-1", name: "Donald" };
  dbFake.pushRows([duck]);

  // when
  const result = await resolveDuck("pond-1", "sub-1");

  // then
  assert.deepEqual(result, duck);
});

test("returns undefined when the subject has no duck in the pond", async () => {
  // given
  dbFake.pushRows([]);

  // when
  const result = await resolveDuck("pond-1", "sub-1");

  // then
  assert.equal(result, undefined);
});

test("runs as the subject inside the pond", async () => {
  // given
  const pondId = "pond-1";
  const subject = "sub-1";

  // when
  await resolveDuck(pondId, subject);

  // then
  assert.deepEqual(
    dbFake.settings.map((s) => s.params),
    [[pondId], [subject]],
  );
  assert.match(dbFake.settings[0]!.sql, /app\.pond_id/);
  assert.match(dbFake.settings[1]!.sql, /app\.google_subject/);
});

test("filters ducks by the subject", async () => {
  // given
  const subject = "sub-1";

  // when
  await resolveDuck("pond-1", subject);

  // then
  assert.equal(dbFake.conditions.length, 1);
  assert.match(dbFake.conditions[0]!.sql, /"google_subject" = \$1/);
  assert.deepEqual(dbFake.conditions[0]!.params, [subject]);
});
