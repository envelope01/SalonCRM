import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;
const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(connectionString);
const ssl = env.NODE_ENV === "production" && !isLocalDatabase
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({
  connectionString,
  ssl,
  max: env.NODE_ENV === "production" ? 10 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
export const db = drizzle(pool, { schema });
