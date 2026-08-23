import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // file assente
  }
}

loadEnv(path.resolve(process.cwd(), ".env"));
loadEnv(path.resolve(process.cwd(), ".env.local"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL mancante. Impostalo e rilancia npm run db:apply");
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, "") || "desy_nails");
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = "/";

const sqlDir = path.resolve(process.cwd(), "sql");
const files = fs
  .readdirSync(sqlDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const connection = await mysql.createConnection({
  uri: adminUrl.toString(),
  multipleStatements: true,
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${dbName}\``);
  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    console.log(`Applico ${file}…`);
    await connection.query(fs.readFileSync(filePath, "utf8"));
  }
  console.log("Schema e seed applicati.");
} finally {
  await connection.end();
}
