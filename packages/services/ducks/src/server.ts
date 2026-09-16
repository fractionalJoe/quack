import Fastify, { type FastifyInstance } from "fastify";
import { QuackClient, ducks, ponds } from "@quack/db";
import { callerHook, registerErrorHandler } from "@quack/shared";

// The load balancer stamps every request with this header; log lines carry it as the request ID.
const app = Fastify({ requestIdHeader: "x-amzn-trace-id" });
registerErrorHandler(app);

// The target group's health check carries no token, so it stays outside the authenticated scope.
app.get("/health", async () => ({ status: "ok" }));

app.register(async (api: FastifyInstance) => {
  api.addHook("onRequest", callerHook({ resolve }));

  // Sign-in (WFL-01). No pond in the path: the service assigns the one pond and returns it.
  api.put("/ducks/me", async (request) => {
    const { subject, name } = request.identity;
    const pondId = await onlyPond(subject);
    const [duck] = await new QuackClient({ googleSubject: subject }, pondId).execute((tx) =>
      tx
        .insert(ducks)
        .values({ pondId, googleSubject: subject, displayName: name })
        .onConflictDoUpdate({
          target: [ducks.pondId, ducks.googleSubject],
          set: { displayName: name },
        })
        .returning({ duckId: ducks.id, displayName: ducks.displayName }),
    );
    return { ...duck!, pondId };
  });
});

// The ponds policy admits every row, but a client needs a pond to open its transaction.
const anyPond = "00000000-0000-0000-0000-000000000000";

async function onlyPond(subject: string): Promise<string> {
  const [pond] = await new QuackClient(anyPond, { googleSubject: subject }).execute((tx) =>
    tx.select({ id: ponds.id }).from(ponds),
  );
  if (!pond) throw new Error("no pond");
  return pond.id;
}

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
