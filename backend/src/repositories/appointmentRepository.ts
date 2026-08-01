import { and, asc, eq, gt, gte, inArray, lt, lte, ne } from "drizzle-orm";
import { db } from "../db";
import { appointments, clients } from "../db/schema";

type AppointmentValues = {
  clientId: string;
  title: string;
  appointmentStart: Date;
  appointmentEnd: Date;
  status: string;
  notes: string;
};

export const appointmentRepository = {
  findActiveClientById(id: string) {
    return db
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.isActive, true)))
      .limit(1);
  },

  create(values: AppointmentValues) {
    return db.insert(appointments).values(values).returning();
  },

  updateById(id: string, updates: Partial<AppointmentValues>) {
    return db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
  },

  deleteById(id: string) {
    return db.delete(appointments).where(eq(appointments.id, id)).returning();
  },

  cancelById(id: string) {
    return db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
  },

  findById(id: string) {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
  },

  findByDateRange(from?: Date, to?: Date, status?: string) {
    const filters = [];

    if (from) filters.push(gte(appointments.appointmentStart, from));
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push(lte(appointments.appointmentStart, toDate));
    }
    if (status) filters.push(eq(appointments.status, status));

    const query = db
      .select({
        appointment: appointments,
        client: {
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
        },
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id));

    return filters.length > 0
      ? query.where(and(...filters)).orderBy(asc(appointments.appointmentStart))
      : query.orderBy(asc(appointments.appointmentStart));
  },

  findOverlapping(start: Date, end: Date, ignoredAppointmentId?: string) {
    const filters = [
      lt(appointments.appointmentStart, end),
      gt(appointments.appointmentEnd, start),
      ne(appointments.status, "cancelled"),
    ];

    if (ignoredAppointmentId) {
      filters.push(ne(appointments.id, ignoredAppointmentId));
    }

    return db
      .select()
      .from(appointments)
      .where(and(...filters))
      .limit(1);
  },

  completePastAppointments(now: Date) {
    return db
      .update(appointments)
      .set({ status: "completed", updatedAt: now })
      .where(and(
        lt(appointments.appointmentEnd, now),
        inArray(appointments.status, ["scheduled"]),
      ))
      .returning();
  },

  deletePastCancelledAppointments(now: Date) {
    return db
      .delete(appointments)
      .where(and(
        lt(appointments.appointmentEnd, now),
        eq(appointments.status, "cancelled"),
      ))
      .returning();
  },
};
