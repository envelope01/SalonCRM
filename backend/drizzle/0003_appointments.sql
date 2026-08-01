CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "title" text NOT NULL,
  "appointment_start" timestamp with time zone NOT NULL,
  "appointment_end" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'scheduled' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "__v" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "appointments_time_order" CHECK ("appointments"."appointment_end" > "appointments"."appointment_start"),
  CONSTRAINT "appointments_status_valid" CHECK ("appointments"."status" in ('scheduled', 'confirmed', 'completed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "appointments_client_idx" ON "appointments" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "appointments_start_idx" ON "appointments" USING btree ("appointment_start");
--> statement-breakpoint
CREATE INDEX "appointments_end_idx" ON "appointments" USING btree ("appointment_end");
--> statement-breakpoint
CREATE INDEX "appointments_date_order_idx" ON "appointments" USING btree ("appointment_start","appointment_end");
