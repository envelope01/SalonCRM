import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isLocal = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

async function main() {
  const connection = await pool.query(`
    select
      current_database() as database,
      current_schema() as schema
  `);

  const tables = await pool.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public', 'drizzle')
    order by table_schema, table_name
  `);

  console.log("Connected to:");
  console.table(connection.rows);

  console.log("Visible tables:");
  console.table(tables.rows);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
