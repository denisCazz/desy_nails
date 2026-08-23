import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  pg?: ReturnType<typeof postgres>;
  db?: Db;
};

export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL non configurato");
  }

  if (!globalForDb.pg) {
    globalForDb.pg = postgres(url, { max: 4, idle_timeout: 20 });
  }
  if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.pg, { schema });
  }
  return globalForDb.db;
}
