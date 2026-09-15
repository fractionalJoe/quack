import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import { AuthError, callerHook } from "./caller-hook.ts";
import { TokenError } from "./auth/verify-id-token.ts";

const tokenIdentity = { subject: "sub-1", name: "Token Name" };
const storedDuck = { duckId: "duck-1", name: "Stored Name" };

async function verifyToken(token: string) {
  if (token === "good") return tokenIdentity;
  if (token === "expired") throw new TokenError("expired");
  if (token === "boom") throw new Error("keys unreachable");
  throw new TokenError("malformed");
}

async function resolve(pondId: string, subject: string) {
  return pondId === "pond-1" && subject === "sub-1" ? storedDuck : undefined;
}

let app: FastifyInstance;

before(async () => {
  app = Fastify();
  app.addHook("onRequest", callerHook({ verifyToken, resolve }));
  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof AuthError) return reply.code(401).send({ reason: error.reason });
    return reply.code(500).send({ error: "internal" });
  });
  const echo = (request: { identity: unknown; pondId?: string }) => ({
    identity: request.identity,
    pondId: request.pondId ?? null,
  });
  app.get("/me", async (request) => echo(request));
  app.get("/ponds/:pondId/me", async (request) => echo(request));
  await app.ready();
});

after(() => app.close());

function get(url: string, authorization?: string) {
  return app.inject({ method: "GET", url, headers: authorization ? { authorization } : {} });
}

test("no Authorization header is 401 missing", async () => {
  // given
  const url = "/me";

  // when
  const res = await get(url);

  // then
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { reason: "missing" });
});

test("a non-bearer Authorization header is 401 missing", async () => {
  // given
  const authorization = "Basic abc";

  // when
  const res = await get("/me", authorization);

  // then
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { reason: "missing" });
});

test("a failed token carries the token reason", async () => {
  // given
  const authorization = "Bearer expired";

  // when
  const res = await get("/me", authorization);

  // then
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { reason: "expired" });
});

test("a route without a pond gets the token identity and no duck", async () => {
  // given
  const authorization = "Bearer good";

  // when
  const res = await get("/me", authorization);

  // then
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { identity: tokenIdentity, pondId: null });
});

test("a pond route resolves the duck and uses its stored name", async () => {
  // given
  const authorization = "Bearer good";

  // when
  const res = await get("/ponds/pond-1/me", authorization);

  // then
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    identity: { subject: "sub-1", name: "Stored Name", duckId: "duck-1" },
    pondId: "pond-1",
  });
});

test("a pond the caller is not in is 401 no duck", async () => {
  // given
  const authorization = "Bearer good";

  // when
  const res = await get("/ponds/pond-2/me", authorization);

  // then
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { reason: "no duck" });
});

test("a verifier failure that is not a token failure is not 401", async () => {
  // given
  const authorization = "Bearer boom";

  // when
  const res = await get("/me", authorization);

  // then
  assert.equal(res.statusCode, 500);
});
