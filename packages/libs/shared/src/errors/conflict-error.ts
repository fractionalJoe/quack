export class ConflictError extends Error {
  constructor(public readonly reason: string) {
    super(`conflict: ${reason}`);
  }
}
