import { formatAppointment } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalDate, optionalText, requireText, requireUuid } from "../lib/validation";
import { appointmentRepository } from "../repositories/appointmentRepository";

const allowedStatuses = new Set(["scheduled", "completed", "cancelled"]);
const maxAppointmentMinutes = 12 * 60;

function requireAppointmentDate(value: unknown, fieldName: string) {
  const date = optionalDate(value, fieldName);
  if (!date) throw badRequest(`${fieldName} is required`);
  return date;
}

function validateStatus(value: unknown) {
  const status = String(value || "scheduled").trim().toLowerCase();
  if (!allowedStatuses.has(status)) {
    throw badRequest("Appointment status is invalid");
  }

  return status;
}

function validateAppointmentWindow(start: Date, end: Date) {
  if (end <= start) {
    throw badRequest("Appointment end time must be after start time");
  }

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (durationMinutes > maxAppointmentMinutes) {
    throw badRequest("Appointment cannot be longer than 12 hours");
  }
}

async function ensureNoOverlap(start: Date, end: Date, status: string, ignoredAppointmentId?: string) {
  if (status === "cancelled") return;

  const [existing] = await appointmentRepository.findOverlapping(start, end, ignoredAppointmentId);
  if (existing) {
    throw badRequest("Another appointment already exists for this time period");
  }
}

async function reconcileAppointmentLifecycle() {
  const now = new Date();
  await appointmentRepository.completePastAppointments(now);
  await appointmentRepository.deletePastCancelledAppointments(now);
}

export const appointmentService = {
  async createAppointment(body: any) {
    await reconcileAppointmentLifecycle();

    const clientId = requireUuid(body.clientId, "clientId");
    const [client] = await appointmentRepository.findActiveClientById(clientId);
    if (!client) throw notFound("Client not found");

    const appointmentStart = requireAppointmentDate(body.appointmentStart, "Appointment start");
    const appointmentEnd = requireAppointmentDate(body.appointmentEnd, "Appointment end");
    const status = appointmentEnd < new Date() ? "completed" : "scheduled";

    validateAppointmentWindow(appointmentStart, appointmentEnd);
    await ensureNoOverlap(appointmentStart, appointmentEnd, status);

    const [appointment] = await appointmentRepository.create({
      clientId,
      title: requireText(body.title, "Title", { max: 120 }),
      appointmentStart,
      appointmentEnd,
      status,
      notes: optionalText(body.notes, { max: 1000 }),
    });

    return formatAppointment(appointment, client);
  },

  async getAppointments(query: any) {
    await reconcileAppointmentLifecycle();

    const from = optionalDate(query.from, "From date");
    const to = optionalDate(query.to, "To date");
    const status = query.status ? validateStatus(query.status) : undefined;
    const rows = await appointmentRepository.findByDateRange(from, to, status);

    return rows.map((row) => formatAppointment(row.appointment, row.client));
  },

  async updateAppointment(id: string, body: any) {
    await reconcileAppointmentLifecycle();

    const appointmentId = requireUuid(id);
    const [existing] = await appointmentRepository.findById(appointmentId);
    if (!existing) throw notFound("Appointment not found");
    if (existing.status !== "scheduled") {
      throw badRequest("Only scheduled appointments can be edited");
    }

    const nextClientId = body.clientId !== undefined
      ? requireUuid(body.clientId, "clientId")
      : existing.clientId;
    const [client] = await appointmentRepository.findActiveClientById(nextClientId);
    if (!client) throw notFound("Client not found");

    const appointmentStart = body.appointmentStart !== undefined
      ? requireAppointmentDate(body.appointmentStart, "Appointment start")
      : existing.appointmentStart;
    const appointmentEnd = body.appointmentEnd !== undefined
      ? requireAppointmentDate(body.appointmentEnd, "Appointment end")
      : existing.appointmentEnd;
    const status = "scheduled";

    validateAppointmentWindow(appointmentStart, appointmentEnd);
    await ensureNoOverlap(appointmentStart, appointmentEnd, status, appointmentId);

    const [appointment] = await appointmentRepository.updateById(appointmentId, {
      clientId: nextClientId,
      title: body.title !== undefined
        ? requireText(body.title, "Title", { max: 120 })
        : existing.title,
      appointmentStart,
      appointmentEnd,
      status,
      notes: body.notes !== undefined
        ? optionalText(body.notes, { max: 1000 })
        : existing.notes,
    });

    return formatAppointment(appointment, client);
  },

  async deleteAppointment(id: string) {
    await reconcileAppointmentLifecycle();

    const appointmentId = requireUuid(id);
    const [existing] = await appointmentRepository.findById(appointmentId);
    if (!existing) throw notFound("Appointment not found");

    if (existing.status === "cancelled") {
      const [deleted] = await appointmentRepository.deleteById(appointmentId);
      if (!deleted) throw notFound("Appointment not found");
      return { message: "Cancelled appointment deleted", action: "deleted" };
    }

    if (existing.status === "completed") {
      throw badRequest("Completed appointments cannot be deleted");
    }

    const [cancelled] = await appointmentRepository.cancelById(appointmentId);
    if (!cancelled) throw notFound("Appointment not found");

    return { message: "Appointment cancelled", action: "cancelled" };
  },
};
