import { defineConfig } from "drizzle-kit"
import "./db/env"

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Only needed for drizzle-kit push/pull; migrate uses local SQL files.
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/rz_admin",
  },
  strict: true,
  verbose: true,
})
