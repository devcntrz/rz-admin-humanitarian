/**
 * Seed database from drizzle/data/seed.sql (prepared from backup.sql).
 *
 * Usage:
 *   pnpm db:seed
 *   SEED_SQL_PATH=/custom/path.sql pnpm db:seed
 */
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createDb } from "../db/client"
import "../db/env"

const TABLES = [
  "dr_documentations",
  "dr_partners",
  "dr_clusters",
  "distribution_reports",
  "sr_documentations",
  "sr_urgent_needs",
  "sr_refugee_infos",
  "sr_infrastructure_damages",
  "sr_victim_counts",
  "site_reports",
  "admins",
  "volunteers",
  "disaster_types",
  "villages",
  "districts",
  "regencies",
  "provinces",
] as const

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ""

  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("--")) continue

    current += (current ? "\n" : "") + line
    if (trimmed.endsWith(";")) {
      statements.push(current.slice(0, -1).trim())
      current = ""
    }
  }

  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements.filter(Boolean)
}

async function main() {
  const seedPath = resolve(
    process.env.SEED_SQL_PATH || "./drizzle/data/seed.sql",
  )
  console.log(`Loading seed from ${seedPath}`)
  const seedSql = await readFile(seedPath, "utf8")
  const statements = splitSqlStatements(seedSql)

  const { pool } = createDb()
  const client = await pool.connect()

  try {
    console.log("Truncating tables...")
    await client.query(
      `TRUNCATE TABLE ${TABLES.map((t) => `public.${t}`).join(", ")} RESTART IDENTITY CASCADE`,
    )

    console.log(`Executing ${statements.length} SQL statements...`)
    const batchSize = 500
    let executed = 0

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize)
      // Skip outer BEGIN/COMMIT from seed file; we control the transaction.
      const filtered = batch.filter(
        (s) => !/^BEGIN$/i.test(s) && !/^COMMIT$/i.test(s),
      )
      if (filtered.length === 0) continue

      await client.query("BEGIN")
      try {
        await client.query(filtered.map((s) => `${s};`).join("\n"))
        await client.query("COMMIT")
        executed += filtered.length
      } catch (err) {
        await client.query("ROLLBACK")
        throw err
      }

      if ((i / batchSize) % 20 === 0 || i + batchSize >= statements.length) {
        console.log(
          `  progress: ${Math.min(i + batchSize, statements.length)}/${statements.length}`,
        )
      }
    }

    console.log(`Seed complete (${executed} statements).`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
