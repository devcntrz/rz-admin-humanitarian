// Usage: const rows = await sql`SELECT * FROM volunteers WHERE id = ${id}`

import "server-only"
import type { QueryResultRow } from "pg"

type QueryFn = <T = any>(text: string, params?: any[]) => Promise<T[]>
export type SQLTag = <T = any>(strings: TemplateStringsArray, ...values: any[]) => Promise<T[]>

let cachedSql: SQLTag | null = null
let cachedQuery: QueryFn | null = null

function toPgQuery(strings: TemplateStringsArray, values: any[]) {
  // Compose "text" with $1 placeholders and values[]
  // Example: sql`select * from t where id = ${id} and name = ${name}`
  // -> text: "select * from t where id = $1 and name = $2"
  let text = ""
  const params: any[] = []
  for (let i = 0; i < strings.length; i++) {
    text += strings[i]
    if (i < values.length) {
      params.push(values[i])
      text += `$${params.length}`
    }
  }
  return { text, params }
}

function toPgPlaceholders(text: string) {
  let i = 0
  return text.replace(/\?/g, () => `$${++i}`)
}

async function initDb() {
  const client = (process.env.DB_CLIENT || "neon").toLowerCase()
  const conn = process.env.DATABASE_URL
  if (!conn) throw new Error("Missing DATABASE_URL")

  if (client === "neon") {
    const { neon } = await import("@neondatabase/serverless")
    const neonSql = neon(conn)
    const sqlTag = neonSql as unknown as SQLTag
    const queryFn: QueryFn = async <T = any>(text: string, params: any[] = []) => {
      const rows = await neonSql.query(toPgPlaceholders(text), params)
      return rows as T[]
    }
    return { sqlTag, queryFn }
  }

  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: conn })
  const sqlTag: SQLTag = (async <T = any>(strings: TemplateStringsArray, ...values: any[]) => {
    const { text, params } = toPgQuery(strings, values)
    const res = await pool.query<QueryResultRow>(text, params)
    return res.rows as T[]
  }) as SQLTag
  const queryFn: QueryFn = async <T = any>(text: string, params: any[] = []) => {
    const res = await pool.query<QueryResultRow>(toPgPlaceholders(text), params)
    return res.rows as T[]
  }
  return { sqlTag, queryFn }
}

async function ensureDb() {
  if (!cachedSql || !cachedQuery) {
    const db = await initDb()
    cachedSql = db.sqlTag
    cachedQuery = db.queryFn
  }
}

export const sql: SQLTag = async function sql(strings: TemplateStringsArray, ...values: any[]) {
  await ensureDb()
  return cachedSql!(strings, ...values)
} as unknown as SQLTag

/** Parameterized query helper (`?` placeholders → Postgres `$1`, `$2`, …). */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  await ensureDb()
  return cachedQuery!<T>(text, params)
}
