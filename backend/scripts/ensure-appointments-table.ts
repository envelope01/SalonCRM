import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const backendRoot = path.resolve(__dirname, "..");
const nodeEnv = process.env.NODE_ENV || "development";
const originalProcessEnv = { ...process.env };

function loadEnvFile(fileName: string, override: boolean) {
  const filePath = path.join(backendRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override, quiet: true });
  }
}

loadEnvFile(".env", false);
loadEnvFile(`.env.${nodeEnv}`, true);
loadEnvFile(`.env.${nodeEnv}.local`, true);

for (const [key, value] of Object.entries(originalProcessEnv)) {
  if (value !== undefined) {
    process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isLocal = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: nodeEnv === "production" && !isLocal ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

async function main() {
  await pool.query(`
    create table if not exists "appointments" (
      "id" uuid primary key default gen_random_uuid() not null,
      "client_id" uuid not null,
      "title" text not null,
      "appointment_start" timestamp with time zone not null,
      "appointment_end" timestamp with time zone not null,
      "status" text default 'scheduled' not null,
      "notes" text default '' not null,
      "created_at" timestamp with time zone default now() not null,
      "updated_at" timestamp with time zone default now() not null,
      "__v" integer default 0 not null
    );
  `);

  await pool.query(`
    do $$
    begin
      if not exists (
        select 1 from pg_constraint where conname = 'appointments_client_id_clients_id_fk'
      ) then
        alter table "appointments"
        add constraint "appointments_client_id_clients_id_fk"
        foreign key ("client_id") references "public"."clients"("id")
        on delete cascade on update no action;
      end if;

      if not exists (
        select 1 from pg_constraint where conname = 'appointments_time_order'
      ) then
        alter table "appointments"
        add constraint "appointments_time_order"
        check ("appointment_end" > "appointment_start");
      end if;

      if not exists (
        select 1 from pg_constraint where conname = 'appointments_status_valid'
      ) then
        alter table "appointments"
        add constraint "appointments_status_valid"
        check ("status" in ('scheduled', 'completed', 'cancelled'));
      end if;
    end $$;
  `);

  await pool.query(`update "appointments" set "status" = 'scheduled' where "status" = 'confirmed';`);
  await pool.query(`alter table "appointments" drop constraint if exists "appointments_status_valid";`);
  await pool.query(`
    alter table "appointments"
    add constraint "appointments_status_valid"
    check ("status" in ('scheduled', 'completed', 'cancelled'));
  `);

  await pool.query(`create index if not exists "appointments_client_idx" on "appointments" using btree ("client_id");`);
  await pool.query(`create index if not exists "appointments_start_idx" on "appointments" using btree ("appointment_start");`);
  await pool.query(`create index if not exists "appointments_end_idx" on "appointments" using btree ("appointment_end");`);
  await pool.query(`create index if not exists "appointments_date_order_idx" on "appointments" using btree ("appointment_start", "appointment_end");`);

  console.log("Appointments table is ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
