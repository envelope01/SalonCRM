import { queryRows, transaction, txRows } from "../db";

const settingColumns = `
  id,
  [key],
  value,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

export const settingsRepository = {
  findAll(salonId: string) {
    return queryRows(`
      select ${settingColumns}
      from dbo.app_settings
      where tenant_id = @salonId
    `, { salonId });
  },

  async upsertMany(values: Record<string, string>, salonId: string) {
    const entries = Object.entries(values);

    if (entries.length === 0) {
      return [];
    }

    return transaction(async (tx) => {
      const rows = [];

      for (const [key, value] of entries) {
        const [row] = await txRows(tx, `
          merge dbo.app_settings as target
          using (select @salonId as tenant_id, @key as [key], @value as value) as source
          on target.tenant_id = source.tenant_id and target.[key] = source.[key]
          when matched then
            update set value = source.value, updated_at = sysdatetimeoffset(), [__v] = target.[__v] + 1
          when not matched then
            insert ([key], value, tenant_id) values (source.[key], source.value, source.tenant_id)
          output inserted.id, inserted.[key], inserted.value, inserted.created_at as createdAt,
            inserted.updated_at as updatedAt, inserted.[__v] as version;
        `, { key, value, salonId });

        rows.push(row);
      }

      return rows;
    });
  },

  deleteByKey(key: string, salonId: string) {
    return queryRows(`
      delete from dbo.app_settings
      output deleted.id, deleted.[key], deleted.value, deleted.created_at as createdAt,
        deleted.updated_at as updatedAt, deleted.[__v] as version
      where [key] = @key and tenant_id = @salonId
    `, { key, salonId });
  },
};
