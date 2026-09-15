import { test, before } from "node:test";
import assert from "node:assert/strict";
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type CryptoKey,
  type JWTVerifyGetKey,
} from "jose";
import { config } from "../config.ts";
import { TokenError, verifyIdToken } from "../auth/verify-id-token.ts";

const KID = "test-key";
let privateKey: CryptoKey;
let keys: JWTVerifyGetKey;

before(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  keys = createLocalJWKSet({ keys: [{ ...jwk, kid: KID, alg: "RS256" }] });
});

interface TokenOptions {
  audience?: string;
  issuer?: string;
  expiresAt?: number;
  name?: string;
  signWith?: CryptoKey;
}

function sign(options: TokenOptions = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims = options.name === undefined ? {} : { name: options.name };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(options.issuer ?? "https://accounts.google.com")
    .setAudience(options.audience ?? config.primary.googleClientId)
    .setSubject("1234567890")
    .setIssuedAt(now - 60)
    .setExpirationTime(options.expiresAt ?? now + 3600)
    .sign(options.signWith ?? privateKey);
}

function rejectsWith(reason: string) {
  return (e: unknown) => e instanceof TokenError && e.reason === reason;
}

test("a valid token returns subject and name", async () => {
  // given
  const token = await sign({ name: "Donald" });

  // when
  const identity = await verifyIdToken(token, keys);

  // then
  assert.deepEqual(identity, { subject: "1234567890", name: "Donald" });
});

test("the second issuer form is accepted", async () => {
  // given
  const token = await sign({ name: "Donald", issuer: "accounts.google.com" });

  // when
  const identity = await verifyIdToken(token, keys);

  // then
  assert.equal(identity.subject, "1234567890");
});

test("an expired token is refused with reason expired", async () => {
  // given
  const token = await sign({ name: "Donald", expiresAt: Math.floor(Date.now() / 1000) - 60 });

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("expired"));
});

test("a token for another client is refused with reason audience", async () => {
  // given
  const token = await sign({ name: "Donald", audience: "someone-else" });

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("audience"));
});

test("a token from another issuer is refused with reason issuer", async () => {
  // given
  const token = await sign({ name: "Donald", issuer: "https://example.com" });

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("issuer"));
});

test("a token signed by another key is refused with reason signature", async () => {
  // given
  const other = await generateKeyPair("RS256");
  const token = await sign({ name: "Donald", signWith: other.privateKey });

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("signature"));
});

test("a token without a name claim is refused with reason claims", async () => {
  // given
  const token = await sign();

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("claims"));
});

test("a string that is not a JWT is refused with reason malformed", async () => {
  // given
  const token = "not a token";

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, rejectsWith("malformed"));
});

test("the error message never carries the token", async () => {
  // given
  const token = await sign({ name: "Donald", audience: "someone-else" });

  // when
  const result = verifyIdToken(token, keys);

  // then
  await assert.rejects(result, (e: unknown) => {
    assert.ok(e instanceof TokenError);
    assert.ok(!e.message.includes(token));
    return true;
  });
});
