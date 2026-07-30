import "dotenv/config";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { inArray, sql } from "drizzle-orm";
import { db, pool } from "../src/db/index";
import { clients, expenses, services, users, visits, visitServices } from "../src/db/schema";

const ClientModel = require("../models/Client");
const ExpenseModel = require("../models/Expense");
const ServiceModel = require("../models/Service");
const UserModel = require("../models/User");
const VisitModel = require("../models/Visit");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mongoUri() {
  const uri =
    process.env.ActiveDb === "Dev"
      ? process.env.MONGO_URI_DEV
      : process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI or MONGO_URI_DEV is required for data migration");
  }

  return uri;
}

function objectIdToUuid(value: unknown) {
  const raw = String(value);
  if (uuidPattern.test(raw)) return raw.toLowerCase();

  const bytes = crypto
    .createHash("sha256")
    .update(`saloncrm:${raw}`)
    .digest()
    .subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function asDate(value: unknown, fallback = new Date()) {
  return value ? new Date(value as string | number | Date) : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asVersion(doc: any) {
  return typeof doc.__v === "number" ? doc.__v : 0;
}

async function upsertUsers() {
  const docs = await UserModel.find().lean();
  const rows = docs.map((doc: any) => ({
    id: objectIdToUuid(doc._id),
    email: String(doc.email || "").toLowerCase(),
    name: doc.name || "Salon Owner",
    passwordHash: doc.passwordHash,
    role: doc.role || "staff",
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    version: asVersion(doc),
  }));

  if (rows.length === 0) return 0;

  await db.insert(users).values(rows).onConflictDoUpdate({
    target: users.id,
    set: {
      email: sql`excluded.email`,
      name: sql`excluded.name`,
      passwordHash: sql`excluded.password_hash`,
      role: sql`excluded.role`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      version: sql`excluded.__v`,
    },
  });

  return rows.length;
}

async function upsertClients() {
  const docs = await ClientModel.find().lean();
  const rows = docs.map((doc: any) => ({
    id: objectIdToUuid(doc._id),
    name: doc.name,
    phone: doc.phone || null,
    notes: doc.notes || "",
    isActive: doc.isActive !== false,
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    version: asVersion(doc),
  }));

  if (rows.length === 0) return 0;

  await db.insert(clients).values(rows).onConflictDoUpdate({
    target: clients.id,
    set: {
      name: sql`excluded.name`,
      phone: sql`excluded.phone`,
      notes: sql`excluded.notes`,
      isActive: sql`excluded.is_active`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      version: sql`excluded.__v`,
    },
  });

  return rows.length;
}

async function upsertServices() {
  const docs = await ServiceModel.find().lean();
  const rows = docs.map((doc: any) => ({
    id: objectIdToUuid(doc._id),
    name: doc.name,
    category: doc.category || "",
    price: asNumber(doc.price),
    isActive: doc.isActive !== false,
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    version: asVersion(doc),
  }));

  if (rows.length === 0) return 0;

  await db.insert(services).values(rows).onConflictDoUpdate({
    target: services.id,
    set: {
      name: sql`excluded.name`,
      category: sql`excluded.category`,
      price: sql`excluded.price`,
      isActive: sql`excluded.is_active`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      version: sql`excluded.__v`,
    },
  });

  return rows.length;
}

async function upsertExpenses() {
  const docs = await ExpenseModel.find().lean();
  const rows = docs.map((doc: any) => ({
    id: objectIdToUuid(doc._id),
    date: asDate(doc.date),
    category: doc.category,
    amount: asNumber(doc.amount),
    notes: doc.notes || "",
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    version: asVersion(doc),
  }));

  if (rows.length === 0) return 0;

  await db.insert(expenses).values(rows).onConflictDoUpdate({
    target: expenses.id,
    set: {
      date: sql`excluded.date`,
      category: sql`excluded.category`,
      amount: sql`excluded.amount`,
      notes: sql`excluded.notes`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      version: sql`excluded.__v`,
    },
  });

  return rows.length;
}

async function upsertVisits() {
  const docs = await VisitModel.find().lean();
  const visitRows = docs.map((doc: any) => ({
    id: objectIdToUuid(doc._id),
    clientId: objectIdToUuid(doc.client),
    visitDate: asDate(doc.visitDate),
    totalAmount: asNumber(doc.totalAmount),
    notes: doc.notes || "",
    isDeleted: doc.isDeleted === true,
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    version: asVersion(doc),
  }));

  const lineRows = docs.flatMap((doc: any) => {
    const visitId = objectIdToUuid(doc._id);
    return (doc.services || []).map((line: any, index: number) => ({
      visitId,
      serviceId: line.service ? objectIdToUuid(line.service) : null,
      position: index,
      name: line.name,
      basePrice: asNumber(line.basePrice),
      chargedPrice: asNumber(line.chargedPrice),
      lineTotal: asNumber(line.lineTotal),
    }));
  });

  if (visitRows.length === 0) return { visits: 0, visitServices: 0 };

  await db.transaction(async (tx) => {
    await tx.insert(visits).values(visitRows).onConflictDoUpdate({
      target: visits.id,
      set: {
        clientId: sql`excluded.client_id`,
        visitDate: sql`excluded.visit_date`,
        totalAmount: sql`excluded.total_amount`,
        notes: sql`excluded.notes`,
        isDeleted: sql`excluded.is_deleted`,
        createdAt: sql`excluded.created_at`,
        updatedAt: sql`excluded.updated_at`,
        version: sql`excluded.__v`,
      },
    });

    await tx
      .delete(visitServices)
      .where(inArray(visitServices.visitId, visitRows.map((row: { id: string }) => row.id)));

    if (lineRows.length > 0) {
      await tx.insert(visitServices).values(lineRows);
    }
  });

  return { visits: visitRows.length, visitServices: lineRows.length };
}

async function main() {
  await mongoose.connect(mongoUri());

  const migratedUsers = await upsertUsers();
  const migratedClients = await upsertClients();
  const migratedServices = await upsertServices();
  const migratedExpenses = await upsertExpenses();
  const migratedVisits = await upsertVisits();

  console.log("MongoDB to PostgreSQL migration complete");
  console.table({
    users: migratedUsers,
    clients: migratedClients,
    services: migratedServices,
    expenses: migratedExpenses,
    visits: migratedVisits.visits,
    visitServices: migratedVisits.visitServices,
  });
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await pool.end();
  });
