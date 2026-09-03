import { queryRows, transaction, txRows } from "../db";

type VisitLineInput = {
  serviceId: string;
  name: string;
  basePrice: number;
  chargedPrice: number;
  lineTotal: number;
};

const visitColumns = `
  id,
  client_id as clientId,
  visit_date as visitDate,
  total_amount as totalAmount,
  notes,
  cast(is_deleted as bit) as isDeleted,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

const lineItemColumns = `
  id,
  visit_id as visitId,
  service_id as serviceId,
  position,
  name,
  base_price as basePrice,
  charged_price as chargedPrice,
  line_total as lineTotal,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

export const visitRepository = {
  findClientById(id: string, salonId: string) {
    return queryRows(`
      select id
      from dbo.clients
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },

  findServicesByIds(ids: string[], salonId: string) {
    if (ids.length === 0) return [];

    const values: Record<string, string> = { salonId };
    const params = ids.map((id, index) => {
      const key = `id${index}`;
      values[key] = id;
      return `@${key}`;
    });

    return queryRows(`
      select id, name, category, price, cast(is_active as bit) as isActive,
        created_at as createdAt, updated_at as updatedAt, [__v] as version
      from dbo.services
      where tenant_id = @salonId and id in (${params.join(", ")})
    `, values);
  },

  async createVisitWithServices(values: {
    clientId: string;
    salonId: string;
    visitDate: Date;
    totalAmount: number;
    notes: string;
    lineItems: VisitLineInput[];
  }) {
    return transaction(async (tx) => {
      const [visit] = await txRows(tx, `
        insert into dbo.visits (client_id, tenant_id, visit_date, total_amount, notes)
        output inserted.id, inserted.client_id as clientId, inserted.visit_date as visitDate,
          inserted.total_amount as totalAmount, inserted.notes, inserted.is_deleted as isDeleted,
          inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
        values (@clientId, @salonId, @visitDate, @totalAmount, @notes)
      `, values);

      const lineItems: any[] = [];
      for (const [index, service] of values.lineItems.entries()) {
        const [lineItem] = await txRows(tx, `
          insert into dbo.visit_services (visit_id, tenant_id, service_id, position, name, base_price, charged_price, line_total)
          output inserted.id, inserted.visit_id as visitId, inserted.service_id as serviceId,
            inserted.position, inserted.name, inserted.base_price as basePrice,
            inserted.charged_price as chargedPrice, inserted.line_total as lineTotal,
            inserted.created_at as createdAt, inserted.updated_at as updatedAt, inserted.[__v] as version
          values (@visitId, @salonId, @serviceId, @position, @name, @basePrice, @chargedPrice, @lineTotal)
        `, {
          visitId: visit.id,
          salonId: values.salonId,
          serviceId: service.serviceId,
          position: index,
          name: service.name,
          basePrice: service.basePrice,
          chargedPrice: service.chargedPrice,
          lineTotal: service.lineTotal,
        });
        lineItems.push(lineItem);
      }

      return { visit, lineItems };
    });
  },

  findByClientId(clientId: string, salonId: string) {
    return queryRows(`
      select ${visitColumns}
      from dbo.visits
      where client_id = @clientId and tenant_id = @salonId
      order by visit_date desc
    `, { clientId, salonId });
  },

  findLineItemsForVisitIds(visitIds: string[]) {
    if (visitIds.length === 0) return [];

    const values: Record<string, string> = {};
    const params = visitIds.map((id, index) => {
      const key = `id${index}`;
      values[key] = id;
      return `@${key}`;
    });

    return queryRows(`
      select ${lineItemColumns}
      from dbo.visit_services
      where visit_id in (${params.join(", ")})
      order by position
    `, values);
  },

  deleteById(id: string, salonId: string) {
    return queryRows(`
      delete from dbo.visits
      output deleted.id, deleted.client_id as clientId, deleted.visit_date as visitDate,
        deleted.total_amount as totalAmount, deleted.notes, deleted.is_deleted as isDeleted,
        deleted.created_at as createdAt, deleted.updated_at as updatedAt, deleted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },
};
