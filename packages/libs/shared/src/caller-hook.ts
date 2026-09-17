import type { FastifyRequest } from "fastify";
import { TokenError, verifyIdToken, type TokenFailureReason } from "./auth/verify-id-token.ts";

type Identity = {
  duckId?: string;
  subject: string;
  name: string;
};

interface CallerHookDeps {
  verifyToken?: typeof verifyIdToken;
  resolveDuck: (
    pondId: string,
    subject: string,
  ) => Promise<{ duckId: string; name: string } | undefined>;
}

declare module "fastify" {
  interface FastifyRequest {
    identity: Identity;
    pondId?: string;
  }
}

export function callerHook({ verifyToken = verifyIdToken, resolveDuck }: CallerHookDeps) {
  return async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization ?? "";
    if (!authHeader.startsWith("Bearer ")) throw new AuthError("missing");

    try {
      request.identity = await verifyToken(authHeader.slice("Bearer ".length));
    } catch (e) {
      if (e instanceof TokenError) throw new AuthError(e.reason);
      throw e;
    }

    const { pondId } = request.params as { pondId?: string };
    if (pondId === undefined) return;

    const duck = await resolveDuck(pondId, request.identity.subject);
    if (!duck) throw new AuthError("no duck");
    request.pondId = pondId;
    request.identity.duckId = duck.duckId;
    request.identity.name = duck.name;
  };
}

export type AuthFailureReason = TokenFailureReason | "missing" | "no duck";

export class AuthError extends Error {
  constructor(public readonly reason: AuthFailureReason) {
    super(`unauthorized: ${reason}`);
  }
}
