import { relations, type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "staff", "admin", "dev"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("__v").notNull().default(0),
};

export const salons = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    plan: text("plan").notNull().default("trial"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("salons_name_idx").on(table.name),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull().default("Salon Owner"),
    passwordHash: text("password_hash").notNull(),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    role: userRole("role").notNull().default("staff"),
    salonId: uuid("tenant_id").references(() => salons.id, { onDelete: "set null" }),
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
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("clients_salon_idx").on(table.salonId),
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
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("services_salon_idx").on(table.salonId),
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
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("expenses_salon_idx").on(table.salonId),
    dateIdx: index("expenses_date_idx").on(table.date),
    amountNonNegative: check("expenses_amount_non_negative", sql`${table.amount} >= 0`),
  }),
);

export const appSettings = pgTable(
  "app_settings",
  {
    key: text("key").notNull(),
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    value: text("value").notNull().default(""),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.salonId, table.key] }),
    salonIdx: index("app_settings_salon_idx").on(table.salonId),
  }),
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    appointmentStart: timestamp("appointment_start", { withTimezone: true }).notNull(),
    appointmentEnd: timestamp("appointment_end", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes").notNull().default(""),
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("appointments_salon_idx").on(table.salonId),
    clientIdx: index("appointments_client_idx").on(table.clientId),
    startIdx: index("appointments_start_idx").on(table.appointmentStart),
    endIdx: index("appointments_end_idx").on(table.appointmentEnd),
    dateOrderIdx: index("appointments_date_order_idx").on(table.appointmentStart, table.appointmentEnd),
    appointmentTimeOrder: check("appointments_time_order", sql`${table.appointmentEnd} > ${table.appointmentStart}`),
    appointmentStatusValid: check("appointments_status_valid", sql`${table.status} in ('scheduled', 'completed', 'cancelled')`),
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
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    salonIdx: index("visits_salon_idx").on(table.salonId),
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
    salonId: uuid("tenant_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    position: integer("position").notNull().default(0),
    name: text("name").notNull(),
    basePrice: doublePrecision("base_price").notNull(),
    chargedPrice: doublePrecision("charged_price").notNull(),
    lineTotal: doublePrecision("line_total").notNull(),
  },
  (table) => ({
    salonIdx: index("visit_services_tenant_idx").on(table.salonId),
    visitIdx: index("visit_services_visit_idx").on(table.visitId),
    serviceIdx: index("visit_services_service_idx").on(table.serviceId),
    visitPositionUnique: uniqueIndex("visit_services_visit_position_unique").on(table.visitId, table.position),
    basePriceNonNegative: check("visit_services_base_price_non_negative", sql`${table.basePrice} >= 0`),
    chargedPriceNonNegative: check("visit_services_charged_price_non_negative", sql`${table.chargedPrice} >= 0`),
    lineTotalNonNegative: check("visit_services_line_total_non_negative", sql`${table.lineTotal} >= 0`),
  }),
);

export const salonsRelations = relations(salons, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  services: many(services),
  expenses: many(expenses),
  appointments: many(appointments),
  visits: many(visits),
  settings: many(appSettings),
}));

export const usersRelations = relations(users, ({ one }) => ({
  salon: one(salons, {
    fields: [users.salonId],
    references: [salons.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  salon: one(salons, {
    fields: [clients.salonId],
    references: [salons.id],
  }),
  visits: many(visits),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  salon: one(salons, {
    fields: [services.salonId],
    references: [salons.id],
  }),
  visitServices: many(visitServices),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  salon: one(salons, {
    fields: [expenses.salonId],
    references: [salons.id],
  }),
}));
export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  salon: one(salons, {
    fields: [appSettings.salonId],
    references: [salons.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  salon: one(salons, {
    fields: [appointments.salonId],
    references: [salons.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  salon: one(salons, {
    fields: [visits.salonId],
    references: [salons.id],
  }),
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
export type Salon = InferSelectModel<typeof salons>;
export type NewSalon = InferInsertModel<typeof salons>;
export type Client = InferSelectModel<typeof clients>;
export type NewClient = InferInsertModel<typeof clients>;
export type Service = InferSelectModel<typeof services>;
export type NewService = InferInsertModel<typeof services>;
export type Expense = InferSelectModel<typeof expenses>;
export type NewExpense = InferInsertModel<typeof expenses>;
export type AppSetting = InferSelectModel<typeof appSettings>;
export type NewAppSetting = InferInsertModel<typeof appSettings>;
export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
export type Visit = InferSelectModel<typeof visits>;
export type NewVisit = InferInsertModel<typeof visits>;
export type VisitService = InferSelectModel<typeof visitServices>;
export type NewVisitService = InferInsertModel<typeof visitServices>;
