import { Signer } from "@aws-sdk/rds-signer";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.ts";
import { readFileSync } from "fs";
import { join } from "path";

let db: NodePgDatabase<typeof schema>;
export function initDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    const dbPort = 5432;
    const dbHost = verifyEnvVar("DB_HOST");
    const dbUser = verifyEnvVar("DB_USER");
    const dbName = verifyEnvVar("DB_NAME");

    const authSigner = new Signer({
      hostname: dbHost,
      port: dbPort,
      username: dbUser,
    });

    const ca = readFileSync(join(import.meta.dirname, "../global-bundle.pem"), "utf8");
    const pool = new Pool({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: () => authSigner.getAuthToken(),
      ssl: { rejectUnauthorized: true, ca },
    });

    db = drizzle(pool, { schema });
  }
  return db;
}

function verifyEnvVar(varName: string): string {
  const value = process.env[varName];
  if (value === undefined) {
    throw new Error(`${varName} environment variable missing in QuackClient`);
  }
  return value;
}
