import { test } from "node:test";
import assert from "node:assert/strict";
import { isUniqueViolation } from "./is-unique-violation.ts";

// The shape pg raises: an Error carrying the Postgres error code.
function pgError(code: string): Error {
  return Object.assign(new Error("duplicate key value violates unique constraint"), { code });
}

test("a driver error with code 23505 is a unique violation", () => {
  // given
  const error = pgError("23505");

  // when
  const result = isUniqueViolation(error);

  // then
  assert.equal(result, true);
});

test("a drizzle error wrapping a 23505 cause is a unique violation", () => {
  // given
  const error = new Error("Failed query: insert into ducks", { cause: pgError("23505") });

  // when
  const result = isUniqueViolation(error);

  // then
  assert.equal(result, true);
});

test("another Postgres error code is not a unique violation", () => {
  // given
  const error = new Error("Failed query", { cause: pgError("23503") });

  // when
  const result = isUniqueViolation(error);

  // then
  assert.equal(result, false);
});

test("an error with no code is not a unique violation", () => {
  // given
  const error = new Error("connection refused");

  // when
  const result = isUniqueViolation(error);

  // then
  assert.equal(result, false);
});

test("a wrapper's own code is ignored when it has a cause", () => {
  // given
  const error = Object.assign(new Error("wrapper", { cause: new Error("inner") }), {
    code: "23505",
  });

  // when
  const result = isUniqueViolation(error);

  // then
  assert.equal(result, false);
});

test("a value that is not an error is not a unique violation", () => {
  // given
  const values = [undefined, null, "23505", 23505];

  // when
  const results = values.map((value) => isUniqueViolation(value));

  // then
  assert.deepEqual(results, [false, false, false, false]);
});
