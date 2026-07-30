CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff', 'dev');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"notes" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"__v" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"category" text NOT NULL,
	"amount" double precision NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"__v" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "expenses_amount_non_negative" CHECK ("expenses"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"price" double precision NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"__v" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "services_price_non_negative" CHECK ("services"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT 'Salon Owner' NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"__v" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"visit_id" uuid NOT NULL,
	"service_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"base_price" double precision NOT NULL,
	"charged_price" double precision NOT NULL,
	"line_total" double precision NOT NULL,
	CONSTRAINT "visit_services_base_price_non_negative" CHECK ("visit_services"."base_price" >= 0),
	CONSTRAINT "visit_services_charged_price_non_negative" CHECK ("visit_services"."charged_price" >= 0),
	CONSTRAINT "visit_services_line_total_non_negative" CHECK ("visit_services"."line_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"visit_date" timestamp with time zone DEFAULT now() NOT NULL,
	"total_amount" double precision NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"__v" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visits_total_amount_non_negative" CHECK ("visits"."total_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "visit_services" ADD CONSTRAINT "visit_services_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_services" ADD CONSTRAINT "visit_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "visit_services_visit_idx" ON "visit_services" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "visit_services_service_idx" ON "visit_services" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visit_services_visit_position_unique" ON "visit_services" USING btree ("visit_id","position");--> statement-breakpoint
CREATE INDEX "visits_client_idx" ON "visits" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "visits_visit_date_idx" ON "visits" USING btree ("visit_date");