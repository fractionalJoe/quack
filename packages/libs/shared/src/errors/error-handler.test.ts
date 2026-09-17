import { test, before, after, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import { AuthError } from "./auth-error.ts";
import { ConflictError } from "./conflict-error.ts";
import { registerErrorHandler } from "./error-handler.ts";
import { logger } from "../logger.ts";

let app: FastifyInstance;
let writeLog: ReturnType<typeof mock.method>;

before(async () => {
  app = Fastify();
  registerErrorHandler(app);
  app.get("/auth", async () => {
    throw new AuthError("expired");
  });
  app.post(
    "/validated",
    { schema: { body: { type: "object", required: ["name"] } } },
    async () => ({
      ok: true,
    }),
  );
  app.get("/conflict", async () => {
    throw new ConflictError("display name taken");
  });
  app.get("/status", async () => {
    throw Object.assign(new Error("payload too large"), { statusCode: 413 });
  });
  app.get("/plain", async () => {
    throw new Error("kaboom");
  });
  await app.ready();
});

after(() => app.close());

beforeEach(() => {
  writeLog = mock.method(logger(), "writeLog", () => undefined);
});

afterEach(() => writeLog.mock.restore());

function logged(): Record<string, unknown> {
  assert.equal(writeLog.mock.callCount(), 1);
  return writeLog.mock.calls[0]!.arguments[0] as Record<string, unknown>;
}

test("an AuthError is 401 with a fixed body and its reason in the log line", async () => {
  // given
  const url = "/auth";

  // when
  const res = await app.inject({ method: "GET", url });

  // then
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { error: "unauthorized" });
  const entry = logged();
  assert.equal(entry.level, "error");
  assert.equal(entry.status, 401);
  assert.equal(entry.reason, "expired");
  assert.equal(entry.method, "GET");
  assert.equal(entry.url, "/auth");
  assert.equal(typeof entry.requestId, "string");
});

test("a ConflictError is 409 with a fixed body and its reason in the log line", async () => {
  // given
  const url = "/conflict";

  // when
  const res = await app.inject({ method: "GET", url });

  // then
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.json(), { error: "conflict" });
  const entry = logged();
  assert.equal(entry.status, 409);
  assert.equal(entry.reason, "display name taken");
});

test("a schema validation failure keeps Fastify's 400", async () => {
  // given
  const body = {};

  // when
  const res = await app.inject({ method: "POST", url: "/validated", payload: body });

  // then
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), { error: "bad request" });
  assert.equal(logged().status, 400);
});

test("an error with a status outside the label table keeps its status", async () => {
  // given
  const url = "/status";

  // when
  const res = await app.inject({ method: "GET", url });

  // then
  assert.equal(res.statusCode, 413);
  assert.deepEqual(res.json(), { error: "error" });
  assert.equal(logged().status, 413);
});

test("a plain error is 500 with the message in the log line and not in the body", async () => {
  // given
  const url = "/plain";

  // when
  const res = await app.inject({ method: "GET", url });

  // then
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.json(), { error: "internal error" });
  const entry = logged();
  assert.equal(entry.status, 500);
  assert.equal(entry.message, "kaboom");
  assert.equal(entry.reason, undefined);
});
