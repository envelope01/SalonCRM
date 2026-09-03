import { queryRows } from "../db";

const clientColumns = `
  id,
  name,
  phone,
  notes,
  cast(is_active as bit) as isActive,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

const updateColumns: Record<string, string> = {
  name: "name",
  phone: "phone",
  notes: "notes",
  isActive: "is_active",
};

function buildUpdate(updates: Record<string, unknown>) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  const assignments = ["updated_at = @updatedAt"];

  Object.entries(updates).forEach(([key, value], index) => {
    const column = updateColumns[key];
    if (!column) return;
    const param = `value${index}`;
    assignments.push(`${column} = @${param}`);
    values[param] = value;
  });

  return { assignments: assignments.join(", "), values };
}

export const clientRepository = {
  create(values: { name: string; phone: string | null; notes: string; salonId: string }) {
    return queryRows(`
      insert into dbo.clients (name, phone, notes, tenant_id)
      output inserted.id, inserted.name, inserted.phone, inserted.notes, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      values (@name, @phone, @notes, @salonId)
    `, values);
  },

  findActive(salonId: string) {
    return queryRows(`
      select ${clientColumns}
      from dbo.clients
      where tenant_id = @salonId and is_active = 1
      order by name
    `, { salonId });
  },

  findById(id: string, salonId: string) {
    return queryRows(`
      select ${clientColumns}
      from dbo.clients
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },

  findVisitSummariesForClientIds(ids: string[]) {
    if (ids.length === 0) return [];

    const values: Record<string, string> = {};
    const params = ids.map((id, index) => {
      const key = `id${index}`;
      values[key] = id;
      return `@${key}`;
    });

    return queryRows(`
      select client_id as clientId, max(visit_date) as lastVisit, coalesce(sum(total_amount), 0) as totalSpent
      from dbo.visits
      where client_id in (${params.join(", ")}) and is_deleted = 0
      group by client_id
    `, values);
  },

  findActiveByPhone(phone: string, salonId: string) {
    return queryRows(`
      select ${clientColumns}
      from dbo.clients
      where tenant_id = @salonId and phone = @phone and is_active = 1
    `, { phone, salonId });
  },

  findActiveByPhoneExceptId(phone: string, id: string, salonId: string) {
    return queryRows(`
      select ${clientColumns}
      from dbo.clients
      where tenant_id = @salonId and phone = @phone and is_active = 1 and id <> @id
    `, { phone, id, salonId });
  },

  searchActive(query: string, salonId: string) {
    return queryRows(`
      select top (10) ${clientColumns}
      from dbo.clients
      where tenant_id = @salonId
        and is_active = 1
        and (name like @term or phone like @term)
    `, { term: `%${query}%`, salonId });
  },

  updateById(id: string, updates: Record<string, unknown>, salonId: string) {
    const built = buildUpdate(updates);
    return queryRows(`
      update dbo.clients
      set ${built.assignments}
      output inserted.id, inserted.name, inserted.phone, inserted.notes, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { ...built.values, id, salonId });
  },

  deactivateById(id: string, salonId: string) {
    return queryRows(`
      update dbo.clients
      set is_active = 0, updated_at = @updatedAt
      output inserted.id, inserted.name, inserted.phone, inserted.notes, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId, updatedAt: new Date() });
  },
};
