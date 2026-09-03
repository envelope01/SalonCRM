import { and, asc, eq, gt, gte, inArray, lt, lte, ne } from "drizzle-orm";
import { db } from "../db";
import { appointments, clients } from "../db/schema";

type AppointmentValues = {
  clientId: string;
  salonId: string;
  title: string;
  appointmentStart: Date;
  appointmentEnd: Date;
  status: string;
  notes: string;
};

export const appointmentRepository = {
  findActiveClientById(id: string, salonId: string) {
    return db
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.salonId, salonId), eq(clients.isActive, true)))
      .limit(1);
  },

  create(values: AppointmentValues) {
    return db.insert(appointments).values(values).returning();
  },

  updateById(id: string, updates: Partial<Omit<AppointmentValues, "salonId">>, salonId: string) {
    return db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
      .returning();
  },

  deleteById(id: string, salonId: string) {
    return db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.salonId, salonId))).returning();
  },

  cancelById(id: string, salonId: string) {
    return db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
      .returning();
  },

  findById(id: string, salonId: string) {
    return db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.salonId, salonId)))
      .limit(1);
  },

  findByDateRange(salonId: string, from?: Date, to?: Date, status?: string) {
    const filters = [eq(appointments.salonId, salonId)];

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

    return query.where(and(...filters)).orderBy(asc(appointments.appointmentStart));
  },

  findOverlapping(salonId: string, start: Date, end: Date, ignoredAppointmentId?: string) {
    const filters = [
      eq(appointments.salonId, salonId),
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

  completePastAppointments(now: Date, salonId: string) {
    return db
      .update(appointments)
      .set({ status: "completed", updatedAt: now })
      .where(and(
        eq(appointments.salonId, salonId),
        lt(appointments.appointmentEnd, now),
        inArray(appointments.status, ["scheduled"]),
      ))
      .returning();
  },

  deletePastCancelledAppointments(now: Date, salonId: string) {
    return db
      .delete(appointments)
      .where(and(
        eq(appointments.salonId, salonId),
        lt(appointments.appointmentEnd, now),
        eq(appointments.status, "cancelled"),
      ))
      .returning();
  },
};
