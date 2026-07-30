import type { Client, Expense, Service, User, Visit, VisitService } from "./schema";

const version = (row: { version?: number | null }) => row.version ?? 0;

export function formatClient(row: Client) {
  return {
    _id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes,
    isActive: row.isActive,
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

export function formatAuthUser(row: Pick<User, "id" | "email" | "name" | "role">) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}
