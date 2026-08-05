import { migrate } from "drizzle-orm/node-postgres/migrator"
import { createDb } from "../db/client"
import "../db/env"

async function main() {
  const { db, pool } = createDb()
  console.log("Running Drizzle migrations...")
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("Migrations complete.")
  await pool.end()
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
