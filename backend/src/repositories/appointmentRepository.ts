import { queryRows } from "../db";

type AppointmentValues = {
  clientId: string;
  salonId: string;
  title: string;
  appointmentStart: Date;
  appointmentEnd: Date;
  status: string;
  notes: string;
};

const appointmentColumns = `
  id,
  client_id as clientId,
  title,
  appointment_start as appointmentStart,
  appointment_end as appointmentEnd,
  status,
  notes,
  created_at as createdAt,
  updated_at as updatedAt,
  [__v] as version
`;

const updateColumns: Record<string, string> = {
  clientId: "client_id",
  title: "title",
  appointmentStart: "appointment_start",
  appointmentEnd: "appointment_end",
  status: "status",
  notes: "notes",
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

export const appointmentRepository = {
  findActiveClientById(id: string, salonId: string) {
    return queryRows(`
      select id, name, phone
      from dbo.clients
      where id = @id and tenant_id = @salonId and is_active = 1
    `, { id, salonId });
  },

  create(values: AppointmentValues) {
    return queryRows(`
      insert into dbo.appointments (client_id, tenant_id, title, appointment_start, appointment_end, status, notes)
      output inserted.id, inserted.client_id as clientId, inserted.title,
        inserted.appointment_start as appointmentStart, inserted.appointment_end as appointmentEnd,
        inserted.status, inserted.notes, inserted.created_at as createdAt,
        inserted.updated_at as updatedAt, inserted.[__v] as version
      values (@clientId, @salonId, @title, @appointmentStart, @appointmentEnd, @status, @notes)
    `, values);
  },

  updateById(id: string, updates: Partial<Omit<AppointmentValues, "salonId">>, salonId: string) {
    const built = buildUpdate(updates as Record<string, unknown>);
    return queryRows(`
      update dbo.appointments
      set ${built.assignments}
      output inserted.id, inserted.client_id as clientId, inserted.title,
        inserted.appointment_start as appointmentStart, inserted.appointment_end as appointmentEnd,
        inserted.status, inserted.notes, inserted.created_at as createdAt,
        inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { ...built.values, id, salonId });
  },

  deleteById(id: string, salonId: string) {
    return queryRows(`
      delete from dbo.appointments
      output deleted.id, deleted.client_id as clientId, deleted.title,
        deleted.appointment_start as appointmentStart, deleted.appointment_end as appointmentEnd,
        deleted.status, deleted.notes, deleted.created_at as createdAt,
        deleted.updated_at as updatedAt, deleted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },

  cancelById(id: string, salonId: string) {
    return queryRows(`
      update dbo.appointments
      set status = N'cancelled', updated_at = @updatedAt
      output inserted.id, inserted.client_id as clientId, inserted.title,
        inserted.appointment_start as appointmentStart, inserted.appointment_end as appointmentEnd,
        inserted.status, inserted.notes, inserted.created_at as createdAt,
        inserted.updated_at as updatedAt, inserted.[__v] as version
      where id = @id and tenant_id = @salonId
    `, { id, salonId, updatedAt: new Date() });
  },

  findById(id: string, salonId: string) {
    return queryRows(`
      select ${appointmentColumns}
      from dbo.appointments
      where id = @id and tenant_id = @salonId
    `, { id, salonId });
  },

  findByDateRange(salonId: string, from?: Date, to?: Date, status?: string) {
    const filters = ["a.tenant_id = @salonId"];
    const values: Record<string, unknown> = { salonId };

    if (from) {
      filters.push("a.appointment_start >= @from");
      values.from = from;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push("a.appointment_start <= @to");
      values.to = toDate;
    }
    if (status) {
      filters.push("a.status = @status");
      values.status = status;
    }

    return queryRows(`
      select
        a.id as appointment_id,
        a.client_id as appointment_clientId,
        a.title as appointment_title,
        a.appointment_start as appointment_appointmentStart,
        a.appointment_end as appointment_appointmentEnd,
        a.status as appointment_status,
        a.notes as appointment_notes,
        a.created_at as appointment_createdAt,
        a.updated_at as appointment_updatedAt,
        a.[__v] as appointment_version,
        a.tenant_id as appointment_salonId,
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone
      from dbo.appointments a
      inner join dbo.clients c on c.id = a.client_id
      where ${filters.join(" and ")}
      order by a.appointment_start
    `, values).then((rows) => rows.map((row: any) => ({
      appointment: {
        id: row.appointment_id,
        clientId: row.appointment_clientId,
        title: row.appointment_title,
        appointmentStart: row.appointment_appointmentStart,
        appointmentEnd: row.appointment_appointmentEnd,
        status: row.appointment_status,
        notes: row.appointment_notes,
        createdAt: row.appointment_createdAt,
        updatedAt: row.appointment_updatedAt,
        version: row.appointment_version,
        salonId: row.appointment_salonId,
      },
      client: {
        id: row.client_id,
        name: row.client_name,
        phone: row.client_phone,
      },
    })));
  },

  findOverlapping(salonId: string, start: Date, end: Date, ignoredAppointmentId?: string) {
    const filters = [
      "tenant_id = @salonId",
      "appointment_start < @end",
      "appointment_end > @start",
      "status <> N'cancelled'",
    ];
    const values: Record<string, unknown> = { salonId, start, end };

    if (ignoredAppointmentId) {
      filters.push("id <> @ignoredAppointmentId");
      values.ignoredAppointmentId = ignoredAppointmentId;
    }

    return queryRows(`
      select top (1) ${appointmentColumns}
      from dbo.appointments
      where ${filters.join(" and ")}
    `, values);
  },

  completePastAppointments(now: Date, salonId: string) {
    return queryRows(`
      update dbo.appointments
      set status = N'completed', updated_at = @now
      output inserted.id, inserted.client_id as clientId, inserted.title,
        inserted.appointment_start as appointmentStart, inserted.appointment_end as appointmentEnd,
        inserted.status, inserted.notes, inserted.created_at as createdAt,
        inserted.updated_at as updatedAt, inserted.[__v] as version
      where tenant_id = @salonId and appointment_end < @now and status in (N'scheduled')
    `, { now, salonId });
  },

  deletePastCancelledAppointments(now: Date, salonId: string) {
    return queryRows(`
      delete from dbo.appointments
      output deleted.id, deleted.client_id as clientId, deleted.title,
        deleted.appointment_start as appointmentStart, deleted.appointment_end as appointmentEnd,
        deleted.status, deleted.notes, deleted.created_at as createdAt,
        deleted.updated_at as updatedAt, deleted.[__v] as version
      where tenant_id = @salonId and appointment_end < @now and status = N'cancelled'
    `, { now, salonId });
  },
};
