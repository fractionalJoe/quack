import type { FastifyInstance } from "fastify";
import { AuthError } from "./caller-hook-draft.ts";
import { logger } from "./logger.ts";

// Every error thrown by a hook or a handler ends here. The response body is a fixed label per
// status; the detail goes to the error log line, which never carries a token.
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, request, reply) => {
    const { status, label, reason } = classify(error);
    logger().writeLog({
      level: "error",
      requestId: request.id,
      method: request.method,
      url: request.url,
      status,
      error: label,
      reason,
      message: error instanceof Error ? error.message : String(error),
    });
    return reply.code(status).send({ error: label });
  });
}

type Status = 400 | 401 | 403 | 404 | 409 | 500;

const labels: Record<Status, string> = {
  400: "bad request",
  401: "unauthorized",
  403: "forbidden",
  404: "not found",
  409: "conflict",
  500: "internal error",
};

function classify(error: unknown): { status: number; label: string; reason?: string } {
  if (error instanceof AuthError) return { status: 401, label: labels[401], reason: error.reason };
  // Fastify's own errors, such as schema validation failures, carry their status.
  const status = hasStatusCode(error) ? error.statusCode : 500;
  const label = status in labels ? labels[status as Status] : "error";
  return { status, label };
}

function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  );
}
