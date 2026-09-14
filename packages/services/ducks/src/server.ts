import Fastify from "fastify";

const app = Fastify();
app.get("/health", async () => ({ status: "ok" }));
app.get("/ducks/me", async () => ({ message: "hello from ducks" }));

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
