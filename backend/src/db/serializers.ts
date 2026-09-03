import type { Appointment, Client, Expense, Salon, Service, User, Visit, VisitService } from "./schema";

const version = (row: { version?: number | null }) => row.version ?? 0;

export function formatClient(row: Client & { lastVisit?: Date | null; totalSpent?: number | string | null }) {
  return {
    _id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes,
    isActive: row.isActive,
    lastVisit: row.lastVisit ?? null,
    totalSpent: Number(row.totalSpent || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatService(row: Service) {
  return {
    _id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatExpense(row: Expense) {
  return {
    _id: row.id,
    date: row.date,
    category: row.category,
    amount: row.amount,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatAppointment(
  row: Appointment,
  client?: Pick<Client, "id" | "name" | "phone"> | null,
) {
  return {
    _id: row.id,
    title: row.title,
    clientId: row.clientId,
    client: client
      ? {
          _id: client.id,
          name: client.name,
          phone: client.phone,
        }
      : null,
    appointmentStart: row.appointmentStart,
    appointmentEnd: row.appointmentEnd,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatVisitService(row: VisitService) {
  return {
    service: row.serviceId,
    name: row.name,
    basePrice: row.basePrice,
    chargedPrice: row.chargedPrice,
    lineTotal: row.lineTotal,
  };
}

export function formatVisit(row: Visit, services: VisitService[] = []) {
  return {
    _id: row.id,
    client: row.clientId,
    visitDate: row.visitDate,
    services: services.map(formatVisitService),
    totalAmount: row.totalAmount,
    notes: row.notes,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatSalon(row: Salon & {
  ownerName?: string | null;
  ownerEmail?: string | null;
  userCount?: number | string | null;
  staffCount?: number | string | null;
  customerCount?: number | string | null;
  appointmentCount?: number | string | null;
  totalRevenue?: number | string | null;
  lastActivity?: Date | null;
}) {
  return {
    _id: row.id,
    name: row.name,
    isActive: row.isActive,
    owner: {
      name: row.ownerName ?? null,
      email: row.ownerEmail ?? null,
    },
    userCount: Number(row.userCount || 0),
    staffCount: Number(row.staffCount || 0),
    customerCount: Number(row.customerCount || 0),
    appointmentCount: Number(row.appointmentCount || 0),
    totalRevenue: Number(row.totalRevenue || 0),
    lastActivity: row.lastActivity ?? row.updatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: version(row),
  };
}

export function formatAuthUser(row: Pick<User, "id" | "email" | "name" | "role" | "salonId"> & { salonName?: string | null; mustChangePassword?: boolean | null }) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    salonId: row.salonId,
    salonName: row.salonName ?? null,
    mustChangePassword: Boolean(row.mustChangePassword),
  };
}
