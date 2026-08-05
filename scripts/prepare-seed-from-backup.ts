/**
 * Extract public INSERT + setval statements from a pg_dump backup,
 * reorder them for FK-safe seeding, and write drizzle/data/seed.sql.
 *
 * Usage:
 *   pnpm db:prepare-seed -- /path/to/backup.sql
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const SEED_ORDER = [
  "provinces",
  "regencies",
  "districts",
  "villages",
  "disaster_types",
  "admins",
  "volunteers",
  "site_reports",
  "distribution_reports",
  "sr_victim_counts",
  "sr_infrastructure_damages",
  "sr_refugee_infos",
  "sr_urgent_needs",
  "sr_documentations",
  "dr_clusters",
  "dr_partners",
  "dr_documentations",
] as const

async function main() {
  const inputArg =
    process.argv.slice(2).find((arg) => arg !== "--") ||
    process.env.BACKUP_SQL_PATH
  if (!inputArg) {
    throw new Error(
      "Provide backup path: pnpm db:prepare-seed -- /path/to/backup.sql",
    )
  }

  const inputPath = resolve(inputArg)
  const outputPath = resolve(process.cwd(), "drizzle/data/seed.sql")
  const sql = await readFile(inputPath, "utf8")
  const lines = sql.split(/\r?\n/)

  const insertsByTable = new Map<string, string[]>()
  const setvals: string[] = []

  for (const line of lines) {
    const insertMatch = line.match(
      /^INSERT INTO public\.([a-z0-9_]+) VALUES/i,
    )
    if (insertMatch) {
      const table = insertMatch[1]
      const bucket = insertsByTable.get(table) ?? []
      bucket.push(line.endsWith(";") ? line : `${line};`)
      insertsByTable.set(table, bucket)
      continue
    }

    if (/^SELECT pg_catalog\.setval\('public\./i.test(line)) {
      setvals.push(line.endsWith(";") ? line : `${line};`)
    }
  }

  const parts: string[] = [
    "-- Auto-generated from backup.sql for Drizzle seed",
    "-- Do not edit by hand; regenerate with: pnpm db:prepare-seed -- <backup.sql>",
    "",
    "BEGIN;",
    "",
  ]

  for (const table of SEED_ORDER) {
    const rows = insertsByTable.get(table) ?? []
    parts.push(`-- ${table} (${rows.length} rows)`)
    parts.push(...rows)
    parts.push("")
    insertsByTable.delete(table)
  }

  const leftovers = [...insertsByTable.keys()].filter((t) => t !== "users_sync")
  if (leftovers.length > 0) {
    throw new Error(`Unhandled public tables in backup: ${leftovers.join(", ")}`)
  }

  parts.push("-- sequence setval")
  parts.push(...setvals)
  parts.push("")
  parts.push("COMMIT;")
  parts.push("")

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, parts.join("\n"), "utf8")

  const insertCount = parts.filter((l) => l.startsWith("INSERT INTO")).length
  console.log(`Wrote ${outputPath}`)
  console.log(
    `Tables: ${SEED_ORDER.length}, inserts: ${insertCount}, setvals: ${setvals.length}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
