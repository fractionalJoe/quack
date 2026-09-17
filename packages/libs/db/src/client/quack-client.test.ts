import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { QuackClient as QuackClientClass } from "./quack-client.ts";
import { DbFake } from "./db-fake.ts";

const pondId = "pond-1";

const dbFake = new DbFake<never>();

let QuackClient: typeof QuackClientClass;

before(async () => {
  ({ QuackClient } = await dbFake.setMockDb(() => import("./quack-client.ts")));
});

beforeEach(() => {
  dbFake.reset();
});

test("sets the pond and the duck when only the duck is known", async () => {
  // given
  const client = new QuackClient({ duckId: "duck-1" }, pondId);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    dbFake.settings.map((s) => s.params),
    [[pondId], ["duck-1"]],
  );
  assert.match(dbFake.settings[0]!.sql, /set_config\('app\.pond_id', \$1, true\)/);
  assert.match(dbFake.settings[1]!.sql, /set_config\('app\.duck_id', \$1, true\)/);
});

test("sets the pond and the subject when only the subject is known", async () => {
  // given
  const client = new QuackClient({ googleSubject: "sub-1" }, pondId);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    dbFake.settings.map((s) => s.params),
    [[pondId], ["sub-1"]],
  );
  assert.match(dbFake.settings[1]!.sql, /set_config\('app\.google_subject', \$1, true\)/);
});

test("sets all three when both are known", async () => {
  // given
  const client = new QuackClient({ duckId: "duck-1", googleSubject: "sub-1" }, pondId);

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    dbFake.settings.map((s) => s.params),
    [[pondId], ["duck-1"], ["sub-1"]],
  );
});

test("sets only the subject when no pond is given", async () => {
  // given
  const client = new QuackClient({ googleSubject: "sub-1" });

  // when
  await client.execute(async () => undefined);

  // then
  assert.deepEqual(
    dbFake.settings.map((s) => s.params),
    [["sub-1"]],
  );
  assert.match(dbFake.settings[0]!.sql, /set_config\('app\.google_subject', \$1, true\)/);
});

test("the settings are in place before the query runs and its result is returned", async () => {
  // given
  const client = new QuackClient({ duckId: "duck-1" }, pondId);

  // when
  const result = await client.execute(async () => dbFake.settings.length);

  // then
  assert.equal(result, 2);
});

test("a query failure propagates", async () => {
  // given
  const client = new QuackClient({ duckId: "duck-1" }, pondId);

  // when
  const result = client.execute(async () => {
    throw new Error("query failed");
  });

  // then
  await assert.rejects(result, /query failed/);
});
