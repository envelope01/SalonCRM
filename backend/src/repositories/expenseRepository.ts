import { queryRows } from "../db";

const expenseColumns = `
  id,
  [date],
  category,
  amount,
  notes,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

export const expenseRepository = {
  create(values: { date: Date; category: string; amount: number; notes: string; salonId: string }) {
    return queryRows(`
      insert into dbo.expenses ([date], category, amount, notes, tenant_id)
      output inserted.id, inserted.[date], inserted.category, inserted.amount, inserted.notes,
        inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
      values (@date, @category, @amount, @notes, @salonId)
    `, values);
  },

  findByDateRange(salonId: string, from?: Date, to?: Date) {
    const filters = ["tenant_id = @salonId"];
    const values: Record<string, unknown> = { salonId };

    if (from) {
      filters.push("[date] >= @from");
      values.from = from;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push("[date] <= @to");
      values.to = toDate;
    }

    return queryRows(`
      select ${expenseColumns}
      from dbo.expenses
      where ${filters.join(" and ")}
      order by [date] desc
    `, values);
  },

  deleteById(id: string, salonId: string) {
    return queryRows(`
      delete from dbo.expenses
      output deleted.id, deleted.[date], deleted.category, deleted.amount, deleted.notes,
        deleted.created_at as createdAt, deleted.updated_at as updatedAt, deleted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },
};
