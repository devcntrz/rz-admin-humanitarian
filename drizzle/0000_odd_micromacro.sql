CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "admins_email_key" UNIQUE("email"),
	CONSTRAINT "admins_role_check" CHECK ("admins"."role" IN ('super_admin', 'regional_admin', 'staff'))
);
--> statement-breakpoint
CREATE TABLE "disaster_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "disaster_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "distribution_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"spk_number" varchar(50),
	"event_name" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"disaster_type_id" integer,
	"pic_volunteer_id" integer,
	"full_address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"beneficiary_count" integer,
	"volunteer_count" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"province_id" char(2),
	"regency_id" char(4),
	"district_id" char(7),
	"village_id" char(10),
	CONSTRAINT "distribution_reports_spk_number_key" UNIQUE("spk_number")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" char(7) PRIMARY KEY NOT NULL,
	"regency_id" char(4) NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_clusters" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"distribution_report_id" bigint NOT NULL,
	"cluster_name" varchar(150) NOT NULL,
	"program_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"description" varchar
);
--> statement-breakpoint
CREATE TABLE "dr_documentations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"distribution_report_id" bigint NOT NULL,
	"file_url" text NOT NULL,
	"description" varchar
);
--> statement-breakpoint
CREATE TABLE "dr_partners" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"distribution_report_id" bigint NOT NULL,
	"partner_name" varchar(255) NOT NULL,
	"description" varchar
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" char(2) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regencies" (
	"id" char(4) PRIMARY KEY NOT NULL,
	"province_id" char(2) NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"volunteer_id" integer,
	"disaster_type_id" integer,
	"full_address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"report_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"province_id" char(2),
	"regency_id" char(4),
	"district_id" char(7),
	"village_id" char(10),
	"subject" varchar
);
--> statement-breakpoint
CREATE TABLE "sr_documentations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_report_id" bigint NOT NULL,
	"file_url" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "sr_infrastructure_damages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_report_id" bigint NOT NULL,
	"damage_type" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"description" varchar,
	"damage_level" varchar
);
--> statement-breakpoint
CREATE TABLE "sr_refugee_infos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_report_id" bigint NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"number_of_refugees" integer NOT NULL,
	"description" varchar
);
--> statement-breakpoint
CREATE TABLE "sr_urgent_needs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_report_id" bigint NOT NULL,
	"need_item" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"description" varchar
);
--> statement-breakpoint
CREATE TABLE "sr_victim_counts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_report_id" bigint NOT NULL,
	"victim_type" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"description" varchar,
	"unit" integer
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" char(10) PRIMARY KEY NOT NULL,
	"district_id" char(7) NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "volunteers_email_key" UNIQUE("email"),
	CONSTRAINT "volunteers_phone_number_key" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_disaster_type_id_fkey" FOREIGN KEY ("disaster_type_id") REFERENCES "public"."disaster_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_pic_volunteer_id_fkey" FOREIGN KEY ("pic_volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_fk_province" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_fk_regency" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_fk_district" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_fk_village" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dr_clusters" ADD CONSTRAINT "dr_clusters_distribution_report_id_fkey" FOREIGN KEY ("distribution_report_id") REFERENCES "public"."distribution_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dr_documentations" ADD CONSTRAINT "dr_documentations_distribution_report_id_fkey" FOREIGN KEY ("distribution_report_id") REFERENCES "public"."distribution_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dr_partners" ADD CONSTRAINT "dr_partners_distribution_report_id_fkey" FOREIGN KEY ("distribution_report_id") REFERENCES "public"."distribution_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_disaster_type_id_fkey" FOREIGN KEY ("disaster_type_id") REFERENCES "public"."disaster_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_fk_province" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_fk_regency" FOREIGN KEY ("regency_id") REFERENCES "public"."regencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_fk_district" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_reports" ADD CONSTRAINT "site_reports_fk_village" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sr_documentations" ADD CONSTRAINT "sr_documentations_site_report_id_fkey" FOREIGN KEY ("site_report_id") REFERENCES "public"."site_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sr_infrastructure_damages" ADD CONSTRAINT "sr_infrastructure_damages_site_report_id_fkey" FOREIGN KEY ("site_report_id") REFERENCES "public"."site_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sr_refugee_infos" ADD CONSTRAINT "sr_refugee_infos_site_report_id_fkey" FOREIGN KEY ("site_report_id") REFERENCES "public"."site_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sr_urgent_needs" ADD CONSTRAINT "sr_urgent_needs_site_report_id_fkey" FOREIGN KEY ("site_report_id") REFERENCES "public"."site_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sr_victim_counts" ADD CONSTRAINT "sr_victim_counts_site_report_id_fkey" FOREIGN KEY ("site_report_id") REFERENCES "public"."site_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "distribution_reports_disaster_type_id_idx" ON "distribution_reports" USING btree ("disaster_type_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_pic_volunteer_id_idx" ON "distribution_reports" USING btree ("pic_volunteer_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_province_id_idx" ON "distribution_reports" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_regency_id_idx" ON "distribution_reports" USING btree ("regency_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_district_id_idx" ON "distribution_reports" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_village_id_idx" ON "distribution_reports" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "distribution_reports_event_date_idx" ON "distribution_reports" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "districts_regency_id_idx" ON "districts" USING btree ("regency_id");--> statement-breakpoint
CREATE INDEX "dr_clusters_distribution_report_id_idx" ON "dr_clusters" USING btree ("distribution_report_id");--> statement-breakpoint
CREATE INDEX "dr_documentations_distribution_report_id_idx" ON "dr_documentations" USING btree ("distribution_report_id");--> statement-breakpoint
CREATE INDEX "dr_partners_distribution_report_id_idx" ON "dr_partners" USING btree ("distribution_report_id");--> statement-breakpoint
CREATE INDEX "regencies_province_id_idx" ON "regencies" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "site_reports_volunteer_id_idx" ON "site_reports" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "site_reports_disaster_type_id_idx" ON "site_reports" USING btree ("disaster_type_id");--> statement-breakpoint
CREATE INDEX "site_reports_province_id_idx" ON "site_reports" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "site_reports_regency_id_idx" ON "site_reports" USING btree ("regency_id");--> statement-breakpoint
CREATE INDEX "site_reports_district_id_idx" ON "site_reports" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "site_reports_village_id_idx" ON "site_reports" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "site_reports_report_date_idx" ON "site_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "site_reports_status_idx" ON "site_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sr_documentations_site_report_id_idx" ON "sr_documentations" USING btree ("site_report_id");--> statement-breakpoint
CREATE INDEX "sr_infrastructure_damages_site_report_id_idx" ON "sr_infrastructure_damages" USING btree ("site_report_id");--> statement-breakpoint
CREATE INDEX "sr_refugee_infos_site_report_id_idx" ON "sr_refugee_infos" USING btree ("site_report_id");--> statement-breakpoint
CREATE INDEX "sr_urgent_needs_site_report_id_idx" ON "sr_urgent_needs" USING btree ("site_report_id");--> statement-breakpoint
CREATE INDEX "sr_victim_counts_site_report_id_idx" ON "sr_victim_counts" USING btree ("site_report_id");--> statement-breakpoint
CREATE INDEX "villages_district_id_idx" ON "villages" USING btree ("district_id");