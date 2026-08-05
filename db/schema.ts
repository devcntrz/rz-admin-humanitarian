import {
  bigint,
  bigserial,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ---------------------------------------------------------------------------
// Wilayah
// ---------------------------------------------------------------------------

export const provinces = pgTable("provinces", {
  id: char("id", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
})

export const regencies = pgTable(
  "regencies",
  {
    id: char("id", { length: 4 }).primaryKey(),
    provinceId: char("province_id", { length: 2 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (table) => [
    index("regencies_province_id_idx").on(table.provinceId),
    foreignKey({
      columns: [table.provinceId],
      foreignColumns: [provinces.id],
      name: "regencies_province_id_fkey",
    }).onDelete("restrict"),
  ],
)

export const districts = pgTable(
  "districts",
  {
    id: char("id", { length: 7 }).primaryKey(),
    regencyId: char("regency_id", { length: 4 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (table) => [
    index("districts_regency_id_idx").on(table.regencyId),
    foreignKey({
      columns: [table.regencyId],
      foreignColumns: [regencies.id],
      name: "districts_regency_id_fkey",
    }).onDelete("restrict"),
  ],
)

export const villages = pgTable(
  "villages",
  {
    id: char("id", { length: 10 }).primaryKey(),
    districtId: char("district_id", { length: 7 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (table) => [
    index("villages_district_id_idx").on(table.districtId),
    foreignKey({
      columns: [table.districtId],
      foreignColumns: [districts.id],
      name: "villages_district_id_fkey",
    }).onDelete("restrict"),
  ],
)

// ---------------------------------------------------------------------------
// Master / users
// ---------------------------------------------------------------------------

export const disasterTypes = pgTable(
  "disaster_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
  },
  (table) => [unique("disaster_types_name_key").on(table.name)],
)

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    unique("admins_email_key").on(table.email),
    check(
      "admins_role_check",
      sql`${table.role} IN ('super_admin', 'regional_admin', 'staff')`,
    ),
  ],
)

export const volunteers = pgTable(
  "volunteers",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    unique("volunteers_email_key").on(table.email),
    unique("volunteers_phone_number_key").on(table.phoneNumber),
  ],
)

// ---------------------------------------------------------------------------
// Situation reports
// ---------------------------------------------------------------------------

export const siteReports = pgTable(
  "site_reports",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    volunteerId: integer("volunteer_id"),
    disasterTypeId: integer("disaster_type_id"),
    fullAddress: text("full_address"),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    reportDate: date("report_date").notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    provinceId: char("province_id", { length: 2 }),
    regencyId: char("regency_id", { length: 4 }),
    districtId: char("district_id", { length: 7 }),
    villageId: char("village_id", { length: 10 }),
    subject: varchar("subject"),
  },
  (table) => [
    index("site_reports_volunteer_id_idx").on(table.volunteerId),
    index("site_reports_disaster_type_id_idx").on(table.disasterTypeId),
    index("site_reports_province_id_idx").on(table.provinceId),
    index("site_reports_regency_id_idx").on(table.regencyId),
    index("site_reports_district_id_idx").on(table.districtId),
    index("site_reports_village_id_idx").on(table.villageId),
    index("site_reports_report_date_idx").on(table.reportDate),
    index("site_reports_status_idx").on(table.status),
    foreignKey({
      columns: [table.volunteerId],
      foreignColumns: [volunteers.id],
      name: "site_reports_volunteer_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.disasterTypeId],
      foreignColumns: [disasterTypes.id],
      name: "site_reports_disaster_type_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.provinceId],
      foreignColumns: [provinces.id],
      name: "site_reports_fk_province",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.regencyId],
      foreignColumns: [regencies.id],
      name: "site_reports_fk_regency",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.districtId],
      foreignColumns: [districts.id],
      name: "site_reports_fk_district",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.villageId],
      foreignColumns: [villages.id],
      name: "site_reports_fk_village",
    }).onDelete("set null"),
  ],
)

export const srVictimCounts = pgTable(
  "sr_victim_counts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteReportId: bigint("site_report_id", { mode: "number" }).notNull(),
    victimType: varchar("victim_type", { length: 100 }).notNull(),
    quantity: integer("quantity").notNull(),
    description: varchar("description"),
    unit: integer("unit"),
  },
  (table) => [
    index("sr_victim_counts_site_report_id_idx").on(table.siteReportId),
    foreignKey({
      columns: [table.siteReportId],
      foreignColumns: [siteReports.id],
      name: "sr_victim_counts_site_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const srInfrastructureDamages = pgTable(
  "sr_infrastructure_damages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteReportId: bigint("site_report_id", { mode: "number" }).notNull(),
    damageType: varchar("damage_type", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    description: varchar("description"),
    damageLevel: varchar("damage_level"),
  },
  (table) => [
    index("sr_infrastructure_damages_site_report_id_idx").on(table.siteReportId),
    foreignKey({
      columns: [table.siteReportId],
      foreignColumns: [siteReports.id],
      name: "sr_infrastructure_damages_site_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const srRefugeeInfos = pgTable(
  "sr_refugee_infos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteReportId: bigint("site_report_id", { mode: "number" }).notNull(),
    locationName: varchar("location_name", { length: 255 }).notNull(),
    numberOfRefugees: integer("number_of_refugees").notNull(),
    description: varchar("description"),
  },
  (table) => [
    index("sr_refugee_infos_site_report_id_idx").on(table.siteReportId),
    foreignKey({
      columns: [table.siteReportId],
      foreignColumns: [siteReports.id],
      name: "sr_refugee_infos_site_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const srUrgentNeeds = pgTable(
  "sr_urgent_needs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteReportId: bigint("site_report_id", { mode: "number" }).notNull(),
    needItem: varchar("need_item", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    description: varchar("description"),
  },
  (table) => [
    index("sr_urgent_needs_site_report_id_idx").on(table.siteReportId),
    foreignKey({
      columns: [table.siteReportId],
      foreignColumns: [siteReports.id],
      name: "sr_urgent_needs_site_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const srDocumentations = pgTable(
  "sr_documentations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    siteReportId: bigint("site_report_id", { mode: "number" }).notNull(),
    fileUrl: text("file_url").notNull(),
    description: text("description"),
  },
  (table) => [
    index("sr_documentations_site_report_id_idx").on(table.siteReportId),
    foreignKey({
      columns: [table.siteReportId],
      foreignColumns: [siteReports.id],
      name: "sr_documentations_site_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

// ---------------------------------------------------------------------------
// Distribution reports
// ---------------------------------------------------------------------------

export const distributionReports = pgTable(
  "distribution_reports",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    spkNumber: varchar("spk_number", { length: 50 }),
    eventName: varchar("event_name", { length: 255 }).notNull(),
    eventDate: date("event_date").notNull(),
    disasterTypeId: integer("disaster_type_id"),
    picVolunteerId: integer("pic_volunteer_id"),
    fullAddress: text("full_address"),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    beneficiaryCount: integer("beneficiary_count"),
    volunteerCount: integer("volunteer_count"),
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    provinceId: char("province_id", { length: 2 }),
    regencyId: char("regency_id", { length: 4 }),
    districtId: char("district_id", { length: 7 }),
    villageId: char("village_id", { length: 10 }),
  },
  (table) => [
    unique("distribution_reports_spk_number_key").on(table.spkNumber),
    index("distribution_reports_disaster_type_id_idx").on(table.disasterTypeId),
    index("distribution_reports_pic_volunteer_id_idx").on(table.picVolunteerId),
    index("distribution_reports_province_id_idx").on(table.provinceId),
    index("distribution_reports_regency_id_idx").on(table.regencyId),
    index("distribution_reports_district_id_idx").on(table.districtId),
    index("distribution_reports_village_id_idx").on(table.villageId),
    index("distribution_reports_event_date_idx").on(table.eventDate),
    foreignKey({
      columns: [table.disasterTypeId],
      foreignColumns: [disasterTypes.id],
      name: "distribution_reports_disaster_type_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.picVolunteerId],
      foreignColumns: [volunteers.id],
      name: "distribution_reports_pic_volunteer_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.provinceId],
      foreignColumns: [provinces.id],
      name: "distribution_reports_fk_province",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.regencyId],
      foreignColumns: [regencies.id],
      name: "distribution_reports_fk_regency",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.districtId],
      foreignColumns: [districts.id],
      name: "distribution_reports_fk_district",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.villageId],
      foreignColumns: [villages.id],
      name: "distribution_reports_fk_village",
    }).onDelete("set null"),
  ],
)

export const drClusters = pgTable(
  "dr_clusters",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    distributionReportId: bigint("distribution_report_id", { mode: "number" }).notNull(),
    clusterName: varchar("cluster_name", { length: 150 }).notNull(),
    programName: varchar("program_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    description: varchar("description"),
  },
  (table) => [
    index("dr_clusters_distribution_report_id_idx").on(table.distributionReportId),
    foreignKey({
      columns: [table.distributionReportId],
      foreignColumns: [distributionReports.id],
      name: "dr_clusters_distribution_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const drPartners = pgTable(
  "dr_partners",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    distributionReportId: bigint("distribution_report_id", { mode: "number" }).notNull(),
    partnerName: varchar("partner_name", { length: 255 }).notNull(),
    description: varchar("description"),
  },
  (table) => [
    index("dr_partners_distribution_report_id_idx").on(table.distributionReportId),
    foreignKey({
      columns: [table.distributionReportId],
      foreignColumns: [distributionReports.id],
      name: "dr_partners_distribution_report_id_fkey",
    }).onDelete("cascade"),
  ],
)

export const drDocumentations = pgTable(
  "dr_documentations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    distributionReportId: bigint("distribution_report_id", { mode: "number" }).notNull(),
    fileUrl: text("file_url").notNull(),
    description: varchar("description"),
  },
  (table) => [
    index("dr_documentations_distribution_report_id_idx").on(
      table.distributionReportId,
    ),
    foreignKey({
      columns: [table.distributionReportId],
      foreignColumns: [distributionReports.id],
      name: "dr_documentations_distribution_report_id_fkey",
    }).onDelete("cascade"),
  ],
)
