import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { appSettings } from "../db/schema";

export const settingsRepository = {
  findAll() {
    return db.select().from(appSettings);
  },

  async upsertMany(values: Record<string, string>) {
    const entries = Object.entries(values);

    if (entries.length === 0) {
      return [];
    }

    return db.transaction(async (tx) => {
      const rows = [];

      for (const [key, value] of entries) {
        const [row] = await tx
          .insert(appSettings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              value,
              updatedAt: sql`now()`,
              version: sql`${appSettings.version} + 1`,
            },
          })
          .returning();

        rows.push(row);
      }

      return rows;
    });
  },

  deleteByKey(key: string) {
    return db.delete(appSettings).where(eq(appSettings.key, key)).returning();
  },
};
