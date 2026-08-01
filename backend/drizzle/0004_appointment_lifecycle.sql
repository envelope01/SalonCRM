UPDATE "appointments" SET "status" = 'scheduled' WHERE "status" = 'confirmed';
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_status_valid";
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_status_valid" CHECK ("appointments"."status" in ('scheduled', 'completed', 'cancelled'));
