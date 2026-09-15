import { config } from "../config.ts";
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from "jose";

interface TokenVerificationResult {
  subject: string;
  name: string;
}

const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyIdToken(
  token: string,
  keys: JWTVerifyGetKey = jwks,
): Promise<TokenVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: config.primary.googleClientId,
    });
    if (typeof payload.sub !== "string" || typeof payload.name !== "string") {
      throw new TokenError("claims");
    }
    return { subject: payload.sub, name: payload.name };
  } catch (e) {
    if (e instanceof TokenError) throw e;
    throw new TokenError(toReason(e));
  }
}

export type TokenFailureReason =
  "malformed" | "signature" | "expired" | "issuer" | "audience" | "claims";

export class TokenError extends Error {
  constructor(public readonly reason: TokenFailureReason) {
    super(`token ${reason}`);
  }
}

function toReason(e: unknown): TokenFailureReason {
  if (e instanceof errors.JWTExpired) return "expired";
  if (e instanceof errors.JWTClaimValidationFailed) {
    if (e.claim === "iss") return "issuer";
    if (e.claim === "aud") return "audience";
    return "claims";
  }
  if (e instanceof errors.JWSSignatureVerificationFailed) return "signature";
  if (e instanceof errors.JWKSNoMatchingKey) return "signature";
  return "malformed";
}
