import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { requireDatabaseUrl } from "./env"
import * as schema from "./schema"

export function createDb() {
  const pool = new Pool({ connectionString: requireDatabaseUrl() })
  const db = drizzle(pool, { schema })
  return { db, pool }
}
