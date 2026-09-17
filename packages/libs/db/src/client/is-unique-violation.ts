// Postgres raises 23505 for a unique constraint violation; drizzle wraps the driver error as cause.
export function isUniqueViolation(error: unknown): boolean {
  const pgError = error instanceof Error && error.cause ? error.cause : error;
  return (
    typeof pgError === "object" && pgError !== null && "code" in pgError && pgError.code === "23505"
  );
}
