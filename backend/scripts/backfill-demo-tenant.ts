import bcrypt from "bcryptjs";
import { Pool, type PoolClient } from "pg";
import { env } from "../src/config/env";

const tenantName = "Demo Salon";
const ownerEmail = "demo@salon.com";
const ownerName = "Demo";
const ownerPassword = "demo123";
const devEmail = "vivek@admin.com";
const devName = "Vivek";
const devPassword = "vivek123";

const tenantOwnedTables = [
  "clients",
  "services",
  "appointments",
  "visits",
  "visit_services",
  "expenses",
  "app_settings",
];

const blockingConstraints = [
  { table: "appointments", constraint: "appointments_client_tenant_fk" },
  { table: "visits", constraint: "visits_client_tenant_fk" },
  { table: "visit_services", constraint: "visit_services_visit_tenant_fk" },
];

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function tableExists(client: PoolClient, tableName: string) {
  const result = await client.query(
    `
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
        and table_type = 'BASE TABLE'
    `,
    [tableName],
  );

  return (result.rowCount ?? 0) > 0;
}

async function columnExists(client: PoolClient, tableName: string, columnName: string) {
  const result = await client.query(
    `
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = $2
    `,
    [tableName, columnName],
  );

  return (result.rowCount ?? 0) > 0;
}

async function constraintExists(client: PoolClient, tableName: string, constraintName: string) {
  const result = await client.query(
    `
      select 1
      from pg_constraint
      where connamespace = 'public'::regnamespace
        and conrelid = $1::regclass
        and conname = $2
    `,
    [`public.${tableName}`, constraintName],
  );

  return (result.rowCount ?? 0) > 0;
}

async function indexExists(client: PoolClient, indexName: string) {
  const result = await client.query(
    `
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = $1
    `,
    [indexName],
  );

  return (result.rowCount ?? 0) > 0;
}

async function relaxLegacyTenantColumns(client: PoolClient) {
  if (await columnExists(client, "tenants", "slug")) {
    await client.query(`alter table "tenants" alter column "slug" drop not null`);
  }

  await client.query(`alter table "tenants" add column if not exists "plan" text default 'trial' not null`);
  await client.query(`alter table "tenants" add column if not exists "is_active" boolean default true not null`);
  await client.query(`alter table "tenants" add column if not exists "created_at" timestamp with time zone default now() not null`);
  await client.query(`alter table "tenants" add column if not exists "updated_at" timestamp with time zone default now() not null`);
  await client.query(`alter table "tenants" add column if not exists "__v" integer default 0 not null`);
}

async function ensureTenantsTable(client: PoolClient) {
  if (await tableExists(client, "tenants")) {
    await relaxLegacyTenantColumns(client);
    return;
  }

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

async function findOrCreateDemoTenant(client: PoolClient) {
  await ensureTenantsTable(client);

  const existing = await client.query(
    `
      select id
      from "tenants"
      where lower(name) = lower($1)
      order by created_at
      limit 1
    `,
    [tenantName],
  );

  if (existing.rows[0]?.id) {
    const tenantId = existing.rows[0].id;
    await client.query(
      `
        update "tenants"
        set name = $1,
            plan = coalesce(nullif(plan, ''), 'trial'),
            is_active = true,
            updated_at = now()
        where id = $2
      `,
      [tenantName, tenantId],
    );
    return tenantId as string;
  }

  const columns = ['"name"', '"plan"', '"is_active"'];
  const placeholders = ["$1", "$2", "true"];
  const params = [tenantName, "trial"];

  if (await columnExists(client, "tenants", "slug")) {
    columns.push('"slug"');
    placeholders.push("$3");
    params.push("demo-salon");
  }

  const created = await client.query(
    `
      insert into "tenants" (${columns.join(", ")})
      values (${placeholders.join(", ")})
      returning id
    `,
    params,
  );

  return created.rows[0].id as string;
}

async function ensureTenantIdColumn(client: PoolClient, tableName: string) {
  if (!(await tableExists(client, tableName))) {
    return false;
  }

  if (!(await columnExists(client, tableName, "tenant_id"))) {
    await client.query(`alter table ${quoteIdentifier(tableName)} add column "tenant_id" uuid`);
  }

  return true;
}

async function dropKnownBlockingConstraints(client: PoolClient) {
  for (const item of blockingConstraints) {
    if ((await tableExists(client, item.table)) && (await constraintExists(client, item.table, item.constraint))) {
      await client.query(`alter table ${quoteIdentifier(item.table)} drop constraint ${quoteIdentifier(item.constraint)}`);
    }
  }
}

async function relaxAppSettingsTenantKeyUniqueness(client: PoolClient) {
  if (!(await tableExists(client, "app_settings"))) return;

  if (await constraintExists(client, "app_settings", "app_settings_pkey")) {
    const result = await client.query(
      `
        select array_agg(a.attname order by k.ordinality) as columns
        from pg_constraint c
        cross join lateral unnest(c.conkey) with ordinality as k(attnum, ordinality)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
        where c.connamespace = 'public'::regnamespace
          and c.conrelid = 'public.app_settings'::regclass
          and c.conname = 'app_settings_pkey'
        group by c.oid
      `,
    );
    const columns = result.rows[0]?.columns || [];
    if (columns.length === 2 && columns.includes("tenant_id") && columns.includes("key")) {
      await client.query(`alter table "app_settings" drop constraint "app_settings_pkey"`);
    }
  }

  if (await indexExists(client, "app_settings_tenant_key_unique")) {
    await client.query(`drop index "app_settings_tenant_key_unique"`);
  }
}

async function assignTableToTenant(client: PoolClient, tableName: string, tenantId: string) {
  const exists = await ensureTenantIdColumn(client, tableName);
  if (!exists) return 0;

  const result = await client.query(
    `update ${quoteIdentifier(tableName)} set "tenant_id" = $1`,
    [tenantId],
  );

  return result.rowCount ?? 0;
}

async function maybeCreateAppSettingsUniqueIndex(client: PoolClient) {
  if (!(await tableExists(client, "app_settings"))) return;
  if (await indexExists(client, "app_settings_tenant_key_unique")) return;

  const duplicates = await client.query(`
    select tenant_id, key, count(*)::int as count
    from "app_settings"
    group by tenant_id, key
    having count(*) > 1
    limit 1
  `);

  if (duplicates.rowCount === 0) {
    await client.query(`create unique index "app_settings_tenant_key_unique" on "app_settings" ("tenant_id", "key")`);
  }
}

async function upsertUser(client: PoolClient, values: {
  email: string;
  name: string;
  password: string;
  role: "owner" | "dev";
  tenantId: string | null;
}) {
  const passwordHash = await bcrypt.hash(values.password, 10);
  const result = await client.query(
    `
      insert into "users" ("email", "name", "password_hash", "role", "tenant_id")
      values ($1, $2, $3, $4, $5)
      on conflict ("email") do update set
        "name" = excluded."name",
        "password_hash" = excluded."password_hash",
        "role" = excluded."role",
        "tenant_id" = excluded."tenant_id",
        "updated_at" = now()
      returning "id"
    `,
    [values.email, values.name, passwordHash, values.role, values.tenantId],
  );

  return result.rows[0].id as string;
}

async function main() {
  if (env.NODE_ENV !== "development") {
    throw new Error("This backfill is intended for development only. Set NODE_ENV=development.");
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();
  const assignedCounts: Record<string, number> = {};

  try {
    await client.query("begin");

    const tenantId = await findOrCreateDemoTenant(client);

    if (!(await columnExists(client, "users", "tenant_id"))) {
      await client.query(`alter table "users" add column "tenant_id" uuid`);
    }

    await dropKnownBlockingConstraints(client);
    await relaxAppSettingsTenantKeyUniqueness(client);

    for (const tableName of tenantOwnedTables) {
      assignedCounts[tableName] = await assignTableToTenant(client, tableName, tenantId);
    }

    const ownerId = await upsertUser(client, {
      email: ownerEmail,
      name: ownerName,
      password: ownerPassword,
      role: "owner",
      tenantId,
    });

    await client.query(
      `
        update "users"
        set "role" = 'staff',
            "updated_at" = now()
        where "tenant_id" = $1
          and "role" = 'owner'
          and lower("email") <> lower($2)
      `,
      [tenantId, ownerEmail],
    );

    await upsertUser(client, {
      email: devEmail,
      name: devName,
      password: devPassword,
      role: "dev",
      tenantId: null,
    });

    if (await columnExists(client, "tenants", "owner_user_id")) {
      await client.query(`update "tenants" set "owner_user_id" = $1 where "id" = $2`, [ownerId, tenantId]);
    }

    await maybeCreateAppSettingsUniqueIndex(client);

    for (const tableName of tenantOwnedTables) {
      if (await tableExists(client, tableName)) {
        await client.query(`create index if not exists ${quoteIdentifier(`${tableName}_tenant_idx`)} on ${quoteIdentifier(tableName)} ("tenant_id")`);
      }
    }
    await client.query(`create index if not exists "users_tenant_idx" on "users" ("tenant_id")`);

    await client.query("commit");

    console.log("Demo tenant backfill completed successfully.");
    console.log(`Demo Salon tenant ID: ${tenantId}`);
    console.log(`Owner login: ${ownerEmail} / ${ownerPassword}`);
    console.log(`Dev login: ${devEmail} / ${devPassword}`);
    console.log("Rows assigned:");
    for (const tableName of tenantOwnedTables) {
      console.log(`- ${tableName}: ${assignedCounts[tableName] ?? 0}`);
    }
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
