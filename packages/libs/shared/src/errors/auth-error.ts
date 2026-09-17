import type { TokenFailureReason } from "../auth/verify-id-token.ts";

export type AuthFailureReason = TokenFailureReason | "missing" | "no duck";

export class AuthError extends Error {
  constructor(public readonly reason: AuthFailureReason) {
    super(`unauthorized: ${reason}`);
  }
}
