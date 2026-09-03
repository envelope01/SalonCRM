import { queryRows } from "../db";

const serviceColumns = `
  id,
  name,
  category,
  price,
  cast(is_active as bit) as isActive,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

const updateColumns: Record<string, string> = {
  name: "name",
  category: "category",
  price: "price",
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

export const serviceRepository = {
  create(values: { name: string; category: string; price: number; salonId: string }) {
    return queryRows(`
      insert into dbo.services (name, category, price, tenant_id)
      output inserted.id, inserted.name, inserted.category, inserted.price, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      values (@name, @category, @price, @salonId)
    `, values);
  },

  findAll(salonId: string) {
    return queryRows(`
      select ${serviceColumns}
      from dbo.services
      where tenant_id = @salonId
      order by name
    `, { salonId });
  },

  findById(id: string, salonId: string) {
    return queryRows(`
      select ${serviceColumns}
      from dbo.services
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },

  findByName(name: string, salonId: string) {
    return queryRows(`
      select ${serviceColumns}
      from dbo.services
      where name = @name and tenant_id = @salonId
    `, { name, salonId });
  },

  updateById(id: string, updates: Record<string, unknown>, salonId: string) {
    const built = buildUpdate(updates);
    return queryRows(`
      update dbo.services
      set ${built.assignments}
      output inserted.id, inserted.name, inserted.category, inserted.price, inserted.is_active as isActive,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { ...built.values, id, salonId });
  },

  deleteById(id: string, salonId: string) {
    return queryRows(`
      delete from dbo.services
      output deleted.id, deleted.name, deleted.category, deleted.price, deleted.is_active as isActive,
        deleted.created_at as createdAt, deleted.updated_at as updatedAt, deleted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },
};
