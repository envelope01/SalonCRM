import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { env } from "../src/config/env";

const tenantTables = [
  "clients",
  "services",
  "expenses",
  "appointments",
  "visits",
  "visit_services",
  "app_settings",
];

function q(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function columnExists(client: any, table: string, column: string) {
  const result = await client.query(
    `select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column],
  );
  return result.rowCount > 0;
}

async function tableExists(client: any, table: string) {
  const result = await client.query(
    `select 1 from information_schema.tables where table_schema = 'public' and table_name = $1 and table_type = 'BASE TABLE'`,
    [table],
  );
  return result.rowCount > 0;
}

async function main() {
  if (env.NODE_ENV !== "development") {
    throw new Error("This seed script only runs in development.");
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("begin");

    if (!(await tableExists(client, "tenants"))) {
      await client.query(`
        create table "tenants" (
          "id" uuid primary key default gen_random_uuid() not null,
          "name" text not null,
          "plan" text default 'trial' not null,
          "is_active" boolean default true not null,
          "created_at" timestamp with time zone default now() not null,
          "updated_at" timestamp with time zone default now() not null,
          "__v" integer default 0 not null
        )
      `);
    }

    await client.query(`alter table "tenants" add column if not exists "plan" text default 'trial' not null`);
    await client.query(`alter table "tenants" add column if not exists "is_active" boolean default true not null`);

    if (await columnExists(client, "tenants", "slug")) {
      await client.query(`alter table "tenants" alter column "slug" drop not null`);
    }

    const tenantInsertColumns = ['"name"', '"plan"', '"is_active"'];
    const tenantInsertValues = ["$1", "$2", "true"];
    const tenantParams = ["Demo Salon", "trial"];

    if (await columnExists(client, "tenants", "slug")) {
      tenantInsertColumns.push('"slug"');
      tenantInsertValues.push("$3");
      tenantParams.push("demo-salon");
    }

    const existingTenant = await client.query(
      `select "id" from "tenants" where lower("name") = lower($1) order by "created_at" limit 1`,
      ["Demo Salon"],
    );

    let tenantId = existingTenant.rows[0]?.id;
    if (!tenantId) {
      const inserted = await client.query(
        `insert into "tenants" (${tenantInsertColumns.join(", ")}) values (${tenantInsertValues.join(", ")}) returning "id"`,
        tenantParams,
      );
      tenantId = inserted.rows[0].id;
    }

    await client.query(
      `update "tenants" set "name" = 'Demo Salon', "plan" = 'trial', "is_active" = true, "updated_at" = now() where "id" = $1`,
      [tenantId],
    );

    if (!(await columnExists(client, "users", "tenant_id"))) {
      await client.query(`alter table "users" add column "tenant_id" uuid`);
    }

    await client.query(`alter table if exists "appointments" drop constraint if exists "appointments_client_tenant_fk"`);
    await client.query(`alter table if exists "visits" drop constraint if exists "visits_client_tenant_fk"`);
    await client.query(`alter table if exists "visit_services" drop constraint if exists "visit_services_visit_tenant_fk"`);
    await client.query(`drop index if exists "app_settings_tenant_key_unique"`);

    for (const table of tenantTables) {
      if (await tableExists(client, table)) {
        if (!(await columnExists(client, table, "tenant_id"))) {
          await client.query(`alter table ${q(table)} add column "tenant_id" uuid`);
        }
        await client.query(`update ${q(table)} set "tenant_id" = $1`, [tenantId]);
      }
    }

    const vivekHash = await bcrypt.hash("vivek123", 10);
    const omkarHash = await bcrypt.hash("omkar123", 10);

    await client.query(`
      insert into "users" ("email", "name", "password_hash", "role", "tenant_id")
      values ($1, $2, $3, 'dev', $4)
      on conflict ("email") do update set
        "name" = excluded."name",
        "password_hash" = excluded."password_hash",
        "role" = 'dev',
        "tenant_id" = excluded."tenant_id",
        "updated_at" = now()
    `, ["vivek@admin.com", "Vivek Platform Admin", vivekHash, tenantId]);

    const omkar = await client.query(`
      insert into "users" ("email", "name", "password_hash", "role", "tenant_id")
      values ($1, $2, $3, 'owner', $4)
      on conflict ("email") do update set
        "name" = excluded."name",
        "password_hash" = excluded."password_hash",
        "role" = 'owner',
        "tenant_id" = excluded."tenant_id",
        "updated_at" = now()
      returning "id"
    `, ["omkar@demo.com", "Omkar", omkarHash, tenantId]);

    if (await columnExists(client, "tenants", "owner_user_id")) {
      await client.query(`update "tenants" set "owner_user_id" = $1 where "id" = $2`, [omkar.rows[0].id, tenantId]);
    }

    await client.query(`update "users" set "tenant_id" = $1 where "role" in ('owner', 'staff')`, [tenantId]);
    await client.query(`update "users" set "tenant_id" = null where "role" = 'admin'`);

    if (await tableExists(client, "app_settings")) {
      await client.query(`
        delete from "app_settings" a
        using "app_settings" b
        where a."tenant_id" = b."tenant_id"
          and a."key" = b."key"
          and a.ctid < b.ctid
      `);
      await client.query(`create unique index if not exists "app_settings_tenant_key_unique" on "app_settings" ("tenant_id", "key")`);
    }

    await client.query(`create index if not exists "users_tenant_idx" on "users" ("tenant_id")`);

    for (const table of tenantTables) {
      if (await tableExists(client, table)) {
        await client.query(`create index if not exists ${q(`${table}_tenant_idx`)} on ${q(table)} ("tenant_id")`);
      }
    }

    await client.query("commit");

    console.log("Demo tenant and users seeded.");
    console.log("Admin login: vivek@admin.com / vivek123");
    console.log("Demo owner login: omkar@demo.com / omkar123");
    console.log(`Demo tenant id: ${tenantId}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
