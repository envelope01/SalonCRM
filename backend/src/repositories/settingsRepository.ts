import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { appSettings } from "../db/schema";

export const settingsRepository = {
  findAll(salonId: string) {
    return db.select().from(appSettings).where(eq(appSettings.salonId, salonId));
  },

  async upsertMany(values: Record<string, string>, salonId: string) {
    const entries = Object.entries(values);

    if (entries.length === 0) {
      return [];
    }

    return db.transaction(async (tx) => {
      const rows = [];

      for (const [key, value] of entries) {
        const [row] = await tx
          .insert(appSettings)
          .values({ key, value, salonId })
          .onConflictDoUpdate({
            target: [appSettings.salonId, appSettings.key],
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

  deleteByKey(key: string, salonId: string) {
    return db.delete(appSettings).where(and(eq(appSettings.key, key), eq(appSettings.salonId, salonId))).returning();
  },
};
