import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function buildDb(url: string) {
  const client = postgres(url, { max: 5 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof buildDb>;

// one pool per process — createDb() used to open a fresh 10-connection pool on
// every call, which exhausted Postgres (FATAL: too many clients) within hours
const g = globalThis as unknown as { __finenessDb?: { url: string; db: Db } };

export function createDb(url = process.env.DATABASE_URL): Db {
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!g.__finenessDb || g.__finenessDb.url !== url) {
    g.__finenessDb = { url, db: buildDb(url) };
  }
  return g.__finenessDb.db;
}

export * as schema from "./schema";
