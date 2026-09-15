import { test, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { logger } from "./logger.ts";

afterEach(() => mock.restoreAll());

test("writeLog writes the entry as one JSON line on stdout", () => {
  // given
  const stdout = mock.method(process.stdout, "write", () => true);
  const entry = {
    level: "error" as const,
    requestId: "req-1",
    method: "GET",
    url: "/x",
    status: 500,
    error: "internal error",
    message: "kaboom",
  };

  // when
  logger().writeLog(entry);

  // then
  // The test reporter also writes to stdout, so keep only the JSON line.
  const lines = stdout.mock.calls
    .map((c) => String(c.arguments[0]))
    .filter((l) => l.startsWith("{"));
  assert.equal(lines.length, 1);
  const line = lines[0]!;
  assert.ok(line.endsWith("\n"));
  assert.equal(line.indexOf("\n"), line.length - 1);
  assert.deepEqual(JSON.parse(line), entry);
});

test("logger returns the same instance every time", () => {
  // given
  const first = logger();

  // when
  const second = logger();

  // then
  assert.equal(second, first);
});
