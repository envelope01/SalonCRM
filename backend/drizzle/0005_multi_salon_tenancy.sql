CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "plan" text DEFAULT 'trial' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "__v" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");
--> statement-breakpoint
INSERT INTO "tenants" ("name", "plan")
VALUES ('Demo Salon', 'trial');
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "visit_services" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "tenant_id" uuid;
--> statement-breakpoint
UPDATE "clients" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
UPDATE "services" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
UPDATE "expenses" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
UPDATE "appointments" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
UPDATE "visits" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
UPDATE "visit_services" SET "tenant_id" = (SELECT "tenant_id" FROM "visits" WHERE "visits"."id" = "visit_services"."visit_id" LIMIT 1);
--> statement-breakpoint
UPDATE "app_settings" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1);
--> statement-breakpoint
INSERT INTO "users" ("email", "name", "password_hash", "role", "tenant_id")
VALUES ('omkar@demo.com', 'Omkar', '$2b$10$rmwLgqF4l.ky5RhtLFidmOHKgZIn8PL1GaN53LinkoxLozXApTJjO', 'owner', (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1))
ON CONFLICT ("email") DO UPDATE SET
  "name" = 'Omkar',
  "role" = 'owner',
  "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1),
  "updated_at" = now();
--> statement-breakpoint
UPDATE "users"
SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1)
WHERE "email" NOT IN ('vivek@admin.com');
--> statement-breakpoint
INSERT INTO "users" ("email", "name", "password_hash", "role", "tenant_id")
VALUES ('vivek@admin.com', 'Vivek Platform Admin', '$2b$10$/SR6wYFwCIBaHMBQsxxO2uScCKdHGIL0A6nEhJZiYA9MTRiCRafIu', 'dev', (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1))
ON CONFLICT ("email") DO UPDATE SET
  "name" = 'Vivek Platform Admin',
  "password_hash" = EXCLUDED."password_hash",
  "role" = 'dev',
  "tenant_id" = (SELECT "id" FROM "tenants" WHERE "name" = 'Demo Salon' LIMIT 1),
  "updated_at" = now();
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "visits" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "visit_services" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "visit_services" ADD CONSTRAINT "visit_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_pkey";
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("tenant_id", "key");
--> statement-breakpoint
CREATE INDEX "clients_tenant_idx" ON "clients" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "services_tenant_idx" ON "services" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "expenses_tenant_idx" ON "expenses" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "appointments_tenant_idx" ON "appointments" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "visits_tenant_idx" ON "visits" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "visit_services_tenant_idx" ON "visit_services" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "app_settings_tenant_idx" ON "app_settings" USING btree ("tenant_id");
