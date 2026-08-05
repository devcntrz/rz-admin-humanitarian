CREATE TABLE "field_coordinators" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "incident_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "chronology" text;--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "disaster_status" text;--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "latest_condition" text;--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "field_coordinator_id" integer;--> statement-breakpoint
ALTER TABLE "site_reports" ADD COLUMN "information_source" text;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_field_coordinator_id_fkey" FOREIGN KEY ("field_coordinator_id") REFERENCES "public"."field_coordinators"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_reports_field_coordinator_id_idx" ON "site_reports" USING btree ("field_coordinator_id");