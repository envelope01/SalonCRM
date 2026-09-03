import { asc, eq } from "drizzle-orm";
import { db, pool } from "../db";
import { salons, users } from "../db/schema";

type OwnerValues = {
  email: string;
  name: string;
  passwordHash: string;
  mustChangePassword?: boolean;
  role: "owner";
};

export const salonRepository = {
  listWithStats() {
    return pool.query(
      `
        select
          t.id,
          t.name,
          t.plan,
          t.is_active as "isActive",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.__v as "version",
          owner.name as "ownerName",
          owner.email as "ownerEmail",
          cast(coalesce(user_counts.count, 0) as integer) as "userCount",
          cast(coalesce(staff_counts.count, 0) as integer) as "staffCount",
          cast(coalesce(customer_counts.count, 0) as integer) as "customerCount",
          greatest(
            t.updated_at,
            coalesce(client_activity.last_at, t.updated_at),
            coalesce(visit_activity.last_at, t.updated_at)
          ) as "lastActivity"
        from tenants t
        left join lateral (
          select u.name, u.email
          from users u
          where u.tenant_id = t.id and u.role = 'owner'
          order by u.created_at
          limit 1
        ) owner on true
        left join lateral (
          select count(*) as count
          from users u
          where u.tenant_id = t.id and u.role in ('owner', 'staff')
        ) user_counts on true
        left join lateral (
          select count(*) as count
          from users u
          where u.tenant_id = t.id and u.role = 'staff'
        ) staff_counts on true
        left join lateral (
          select count(*) as count
          from clients c
          where c.tenant_id = t.id and c.is_active = true
        ) customer_counts on true
        left join lateral (
          select max(c.updated_at) as last_at
          from clients c
          where c.tenant_id = t.id
        ) client_activity on true
        left join lateral (
          select max(v.updated_at) as last_at
          from visits v
          where v.tenant_id = t.id
        ) visit_activity on true
        order by t.name
      `,
    ).then((result) => result.rows);
  },

  async createWithOwner(values: { name: string; plan: string; isActive: boolean; owner: OwnerValues }) {
    return db.transaction(async (tx) => {
      const [salon] = await tx
        .insert(salons)
        .values({ name: values.name, plan: values.plan, isActive: values.isActive })
        .returning();

      const [owner] = await tx
        .insert(users)
        .values({
          email: values.owner.email,
          name: values.owner.name,
          passwordHash: values.owner.passwordHash,
          mustChangePassword: values.owner.mustChangePassword ?? false,
          role: values.owner.role,
          salonId: salon.id,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          salonId: users.salonId,
          mustChangePassword: users.mustChangePassword,
        });

      return { salon, owner };
    });
  },

  updateStatus(id: string, isActive: boolean) {
    return db
      .update(salons)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(salons.id, id))
      .returning();
  },

  findById(id: string) {
    return db.select().from(salons).where(eq(salons.id, id)).limit(1);
  },

  async deleteAllData(id: string) {
    const client = await pool.connect();

    try {
      await client.query("begin");

      const counts: Record<string, number> = {};
      const deleteFrom = async (tableName: string, sql: string) => {
        const result = await client.query(sql, [id]);
        counts[tableName] = result.rowCount || 0;
      };

      await deleteFrom("visit_services", "delete from visit_services where tenant_id = $1");
      await deleteFrom("appointments", "delete from appointments where tenant_id = $1");
      await deleteFrom("visits", "delete from visits where tenant_id = $1");
      await deleteFrom("expenses", "delete from expenses where tenant_id = $1");
      await deleteFrom("services", "delete from services where tenant_id = $1");
      await deleteFrom("app_settings", "delete from app_settings where tenant_id = $1");
      await deleteFrom("clients", "delete from clients where tenant_id = $1");
      await deleteFrom("users", "delete from users where tenant_id = $1");
      await deleteFrom("tenants", "delete from tenants where id = $1");

      await client.query("commit");
      return counts;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },

  findDefaultTenant() {
    return db
      .select({ id: salons.id })
      .from(salons)
      .where(eq(salons.isActive, true))
      .orderBy(asc(salons.createdAt))
      .limit(1);
  },
};
