import { queryRows, transaction, txRows } from "../db";

type OwnerValues = {
  email: string;
  name: string;
  passwordHash: string;
  mustChangePassword?: boolean;
  role: "owner";
};

export const salonRepository = {
  listWithStats() {
    return queryRows(`
      select
        t.id,
        t.name,
        t.[plan],
        cast(t.is_active as bit) as isActive,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        t.[__v] as version,
        owner.name as ownerName,
        owner.email as ownerEmail,
        cast(coalesce(user_counts.count, 0) as int) as userCount,
        cast(coalesce(staff_counts.count, 0) as int) as staffCount,
        cast(coalesce(customer_counts.count, 0) as int) as customerCount,
        (select max(value) from (values
          (t.updated_at),
          (coalesce(client_activity.last_at, t.updated_at)),
          (coalesce(visit_activity.last_at, t.updated_at))
        ) as activity(value)) as lastActivity
      from dbo.tenants t
      outer apply (
        select top (1) u.name, u.email
        from dbo.users u
        where u.tenant_id = t.id and u.role = N'owner'
        order by u.created_at
      ) owner
      outer apply (
        select count(*) as count
        from dbo.users u
        where u.tenant_id = t.id and u.role in (N'owner', N'staff')
      ) user_counts
      outer apply (
        select count(*) as count
        from dbo.users u
        where u.tenant_id = t.id and u.role = N'staff'
      ) staff_counts
      outer apply (
        select count(*) as count
        from dbo.clients c
        where c.tenant_id = t.id and c.is_active = 1
      ) customer_counts
      outer apply (
        select max(c.updated_at) as last_at
        from dbo.clients c
        where c.tenant_id = t.id
      ) client_activity
      outer apply (
        select max(v.updated_at) as last_at
        from dbo.visits v
        where v.tenant_id = t.id
      ) visit_activity
      order by t.name
    `);
  },

  async createWithOwner(values: { name: string; plan: string; isActive: boolean; owner: OwnerValues }) {
    return transaction(async (tx) => {
      const [salon] = await txRows(tx, `
        insert into dbo.tenants (name, [plan], is_active)
        output inserted.id, inserted.name, inserted.is_active as isActive,
          inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
        values (@name, @plan, @isActive)
      `, { name: values.name, plan: values.plan, isActive: values.isActive });

      const [owner] = await txRows(tx, `
        insert into dbo.users (email, name, password_hash, role, tenant_id, must_change_password)
        output inserted.id, inserted.email, inserted.name, inserted.role, inserted.tenant_id as salonId,
          inserted.must_change_password as mustChangePassword
        values (@email, @name, @passwordHash, @role, @salonId, @mustChangePassword)
      `, {
        email: values.owner.email,
        name: values.owner.name,
        passwordHash: values.owner.passwordHash,
        role: values.owner.role,
        salonId: salon.id,
        mustChangePassword: values.owner.mustChangePassword ?? false,
      });

      await txRows(tx, "update dbo.tenants set owner_user_id = @ownerId where id = @salonId", {
        ownerId: owner.id,
        salonId: salon.id,
      });

      return { salon, owner };
    });
  },

  updateStatus(id: string, isActive: boolean) {
    return queryRows(`
      update dbo.tenants
      set is_active = @isActive, updated_at = @updatedAt
      output inserted.id, inserted.name, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id
    `, { id, isActive, updatedAt: new Date() });
  },

  findById(id: string) {
    return queryRows(`
      select id, name, cast(is_active as bit) as isActive, created_at as createdAt, updated_at as updatedAt, [__v] as version
      from dbo.tenants
      where id = @id
    `, { id });
  },

  async deleteAllData(id: string) {
    return transaction(async (tx) => {
      const counts: Record<string, number> = {};
      const deleteFrom = async (tableName: string, query: string) => {
        const rows = await txRows(tx, query, { id });
        counts[tableName] = rows.length;
      };

      await txRows(tx, "update dbo.tenants set owner_user_id = null where id = @id", { id });
      await deleteFrom("visit_services", "delete from dbo.visit_services output deleted.id where tenant_id = @id");
      await deleteFrom("appointments", "delete from dbo.appointments output deleted.id where tenant_id = @id");
      await deleteFrom("visits", "delete from dbo.visits output deleted.id where tenant_id = @id");
      await deleteFrom("expenses", "delete from dbo.expenses output deleted.id where tenant_id = @id");
      await deleteFrom("services", "delete from dbo.services output deleted.id where tenant_id = @id");
      await deleteFrom("app_settings", "delete from dbo.app_settings output deleted.id where tenant_id = @id");
      await deleteFrom("users", "delete from dbo.users output deleted.id where tenant_id = @id");
      await deleteFrom("tenants", "delete from dbo.tenants output deleted.id where id = @id");

      return counts;
    });
  },

  findDefaultTenant() {
    return queryRows(`
      select top (1) id
      from dbo.tenants
      where is_active = 1
      order by created_at
    `);
  },
};
