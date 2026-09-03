import fs from "node:fs";
import path from "node:path";
import * as sql from "mssql";
import { env } from "../src/config/env";

async function main() {
  const schemaPath = path.resolve(__dirname, "azure-sql/001-create-saloncrm-schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const pool = new sql.ConnectionPool(env.DATABASE_URL);

  await pool.connect();
  try {
    const request = pool.request();
    await request.query(schemaSql);
    console.log("Azure SQL schema is ready.");
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
