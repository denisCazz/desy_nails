import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema, mysql.Pool>>;

const globalForDb = globalThis as unknown as {
  mysql?: mysql.Pool;
  db?: Db;
};

export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL non configurato");
  }

  const pool =
    globalForDb.mysql ??
    mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 4,
      timezone: "Z",
      dateStrings: false,
    });
  globalForDb.mysql = pool;

  if (!globalForDb.db) {
    globalForDb.db = drizzle(pool, { schema, mode: "default" });
  }
  return globalForDb.db;
}
