import { env } from "../config/env";
import * as sql from "mssql";

const connectionPool = new sql.ConnectionPool(env.DATABASE_URL);
const poolReady = connectionPool.connect();

export { sql };

export async function getPool() {
  return poolReady;
}

export function bind(request: sql.Request, values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    if (value instanceof Date) {
      request.input(key, sql.DateTimeOffset, value);
    } else if (typeof value === "boolean") {
      request.input(key, sql.Bit, value);
    } else if (typeof value === "number") {
      request.input(key, Number.isInteger(value) ? sql.Int : sql.Float, value);
    } else {
      request.input(key, value ?? null);
    }
  }

  return request;
}

export async function queryRows<T = any>(query: string, values: Record<string, unknown> = {}) {
  const pool = await getPool();
  const request = bind(pool.request(), values);
  const result = await request.query<T>(query);
  return result.recordset;
}

export async function transaction<T>(callback: (tx: sql.Transaction) => Promise<T>) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function txRows<T = any>(tx: sql.Transaction, query: string, values: Record<string, unknown> = {}) {
  const request = bind(new sql.Request(tx), values);
  const result = await request.query<T>(query);
  return result.recordset;
}

export const pool = {
  async query(query: string) {
    const rows = await queryRows(query);
    return { rows };
  },
  async end() {
    await (await poolReady).close();
  },
};
