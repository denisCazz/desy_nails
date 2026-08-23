import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL mancante. Impostalo e rilancia npm run db:apply");
  process.exit(1);
}

const sqlDir = path.resolve(process.cwd(), "sql");
const files = fs
  .readdirSync(sqlDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const sql = postgres(databaseUrl, { max: 1 });

try {
  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    console.log(`Applico ${file}…`);
    await sql.file(filePath);
  }
  console.log("Schema e seed applicati.");
} finally {
  await sql.end();
}
