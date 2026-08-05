import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env.local"), quiet: true })
config({ path: resolve(process.cwd(), ".env"), quiet: true })

export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("Missing DATABASE_URL. Set it in .env.local or .env")
  }
  return url
}
