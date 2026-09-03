import { queryRows } from "../db";

const authColumns = `
  u.id,
  u.email,
  u.name,
  u.password_hash as passwordHash,
  cast(u.must_change_password as bit) as mustChangePassword,
  u.role,
  u.tenant_id as salonId,
  t.name as salonName,
  u.created_at as createdAt,
  u.updated_at as updatedAt,
  u.[__v] as version
`;

const publicColumns = `
  u.id,
  u.email,
  u.name,
  u.role,
  u.tenant_id as salonId,
  u.created_at as createdAt,
  cast(u.must_change_password as bit) as mustChangePassword
`;

export const userRepository = {
  findByEmail(email: string) {
    return queryRows(`
      select ${authColumns}
      from dbo.users u
      left join dbo.tenants t on t.id = u.tenant_id
      where u.email = @email
    `, { email });
  },

  findAuthUserById(id: string) {
    return queryRows(`
      select
        u.id,
        u.email,
        u.name,
        u.role,
        u.tenant_id as salonId,
        t.name as salonName,
        cast(u.must_change_password as bit) as mustChangePassword
      from dbo.users u
      left join dbo.tenants t on t.id = u.tenant_id
      where u.id = @id
    `, { id });
  },

  create(values: {
    email: string;
    name: string;
    passwordHash: string;
    mustChangePassword?: boolean;
    role: "owner" | "staff" | "admin" | "dev";
    salonId?: string | null;
  }) {
    return queryRows(`
      insert into dbo.users (email, name, password_hash, role, tenant_id, must_change_password)
      output inserted.id, inserted.email, inserted.name, inserted.role, inserted.tenant_id as salonId,
        inserted.created_at as createdAt, inserted.must_change_password as mustChangePassword
      values (@email, @name, @passwordHash, @role, @salonId, @mustChangePassword)
    `, {
      ...values,
      salonId: values.salonId ?? null,
      mustChangePassword: values.mustChangePassword ?? false,
    });
  },

  updatePassword(id: string, values: { passwordHash: string; mustChangePassword?: boolean }) {
    return queryRows(`
      update dbo.users
      set password_hash = @passwordHash, must_change_password = @mustChangePassword, updated_at = @updatedAt
      output inserted.id, inserted.email, inserted.name, inserted.role, inserted.tenant_id as salonId,
        inserted.created_at as createdAt, inserted.must_change_password as mustChangePassword
      where id = @id
    `, {
      id,
      passwordHash: values.passwordHash,
      mustChangePassword: values.mustChangePassword ?? false,
      updatedAt: new Date(),
    });
  },

  findSalonOwner(salonId: string) {
    return queryRows(`
      select top (1) ${publicColumns}
      from dbo.users u
      where u.tenant_id = @salonId and u.role = N'owner'
      order by u.created_at
    `, { salonId });
  },

  findPlatformUsers() {
    return queryRows(`
      select ${publicColumns}
      from dbo.users u
      where u.role in (N'admin', N'dev')
      order by u.name
    `);
  },

  findTenantStaff(salonId: string) {
    return queryRows(`
      select ${publicColumns}
      from dbo.users u
      where u.tenant_id = @salonId and u.role in (N'owner', N'staff')
      order by u.role, u.name
    `, { salonId });
  },
};
