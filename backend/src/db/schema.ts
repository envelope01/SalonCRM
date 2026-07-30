import { relations, type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "staff", "dev"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("__v").notNull().default(0),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull().default("Salon Owner"),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("staff"),
    ...timestamps,
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    phoneIdx: index("clients_phone_idx").on(table.phone),
  }),
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull().default(""),
    price: doublePrecision("price").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    priceNonNegative: check("services_price_non_negative", sql`${table.price} >= 0`),
  }),
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    category: text("category").notNull(),
    amount: doublePrecision("amount").notNull(),
    notes: text("notes").notNull().default(""),
    ...timestamps,
  },
  (table) => ({
    dateIdx: index("expenses_date_idx").on(table.date),
    amountNonNegative: check("expenses_amount_non_negative", sql`${table.amount} >= 0`),
  }),
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    visitDate: timestamp("visit_date", { withTimezone: true }).notNull().defaultNow(),
    totalAmount: doublePrecision("total_amount").notNull(),
    notes: text("notes").notNull().default(""),
    isDeleted: boolean("is_deleted").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("visits_client_idx").on(table.clientId),
    visitDateIdx: index("visits_visit_date_idx").on(table.visitDate),
    totalAmountNonNegative: check("visits_total_amount_non_negative", sql`${table.totalAmount} >= 0`),
  }),
);

export const visitServices = pgTable(
  "visit_services",
  {
    id: serial("id").primaryKey(),
    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    position: integer("position").notNull().default(0),
    name: text("name").notNull(),
    basePrice: doublePrecision("base_price").notNull(),
    chargedPrice: doublePrecision("charged_price").notNull(),
    lineTotal: doublePrecision("line_total").notNull(),
  },
  (table) => ({
    visitIdx: index("visit_services_visit_idx").on(table.visitId),
    serviceIdx: index("visit_services_service_idx").on(table.serviceId),
    visitPositionUnique: uniqueIndex("visit_services_visit_position_unique").on(table.visitId, table.position),
    basePriceNonNegative: check("visit_services_base_price_non_negative", sql`${table.basePrice} >= 0`),
    chargedPriceNonNegative: check("visit_services_charged_price_non_negative", sql`${table.chargedPrice} >= 0`),
    lineTotalNonNegative: check("visit_services_line_total_non_negative", sql`${table.lineTotal} >= 0`),
  }),
);

export const usersRelations = relations(users, () => ({}));

export const clientsRelations = relations(clients, ({ many }) => ({
  visits: many(visits),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  visitServices: many(visitServices),
}));

export const expensesRelations = relations(expenses, () => ({}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  client: one(clients, {
    fields: [visits.clientId],
    references: [clients.id],
  }),
  services: many(visitServices),
}));

export const visitServicesRelations = relations(visitServices, ({ one }) => ({
  visit: one(visits, {
    fields: [visitServices.visitId],
    references: [visits.id],
  }),
  service: one(services, {
    fields: [visitServices.serviceId],
    references: [services.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Client = InferSelectModel<typeof clients>;
export type NewClient = InferInsertModel<typeof clients>;
export type Service = InferSelectModel<typeof services>;
export type NewService = InferInsertModel<typeof services>;
export type Expense = InferSelectModel<typeof expenses>;
export type NewExpense = InferInsertModel<typeof expenses>;
export type Visit = InferSelectModel<typeof visits>;
export type NewVisit = InferInsertModel<typeof visits>;
export type VisitService = InferSelectModel<typeof visitServices>;
export type NewVisitService = InferInsertModel<typeof visitServices>;
