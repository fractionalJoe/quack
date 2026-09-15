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
  const token = await sign({ name: "Donald" });
  assert.deepEqual(await verifyIdToken(token, keys), {
    subject: "1234567890",
    name: "Donald",
  });
});

test("the second issuer form is accepted", async () => {
  const token = await sign({ name: "Donald", issuer: "accounts.google.com" });
  assert.equal((await verifyIdToken(token, keys)).subject, "1234567890");
});

test("an expired token is refused with reason expired", async () => {
  const token = await sign({ name: "Donald", expiresAt: Math.floor(Date.now() / 1000) - 60 });
  await assert.rejects(verifyIdToken(token, keys), rejectsWith("expired"));
});

test("a token for another client is refused with reason audience", async () => {
  const token = await sign({ name: "Donald", audience: "someone-else" });
  await assert.rejects(verifyIdToken(token, keys), rejectsWith("audience"));
});

test("a token from another issuer is refused with reason issuer", async () => {
  const token = await sign({ name: "Donald", issuer: "https://example.com" });
  await assert.rejects(verifyIdToken(token, keys), rejectsWith("issuer"));
});

test("a token signed by another key is refused with reason signature", async () => {
  const other = await generateKeyPair("RS256");
  const token = await sign({ name: "Donald", signWith: other.privateKey });
  await assert.rejects(verifyIdToken(token, keys), rejectsWith("signature"));
});

test("a token without a name claim is refused with reason claims", async () => {
  const token = await sign();
  await assert.rejects(verifyIdToken(token, keys), rejectsWith("claims"));
});

test("a string that is not a JWT is refused with reason malformed", async () => {
  await assert.rejects(verifyIdToken("not a token", keys), rejectsWith("malformed"));
});

test("the error message never carries the token", async () => {
  const token = await sign({ name: "Donald", audience: "someone-else" });
  await assert.rejects(verifyIdToken(token, keys), (e: unknown) => {
    assert.ok(e instanceof TokenError);
    assert.ok(!e.message.includes(token));
    return true;
  });
});
