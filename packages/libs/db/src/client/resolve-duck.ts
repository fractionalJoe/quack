import { eq } from "drizzle-orm";
import { QuackClient } from "./quack-client.ts";
import { ducks } from "../schema/ducks.ts";

export async function resolveDuck(pondId: string, subject: string) {
  const [duck] = await new QuackClient({ googleSubject: subject }, pondId).execute((tx) =>
    tx
      .select({ duckId: ducks.id, name: ducks.displayName })
      .from(ducks)
      .where(eq(ducks.googleSubject, subject)),
  );
  return duck;
}
