// Usage: const rows = await sql`SELECT * FROM volunteers WHERE id = ${id}`

import "server-only"
import type { QueryResult } from "pg"

let cachedSql: SQLTag | null = null

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

export type SQLTag = <T = any>(strings: TemplateStringsArray, ...values: any[]) => Promise<T[]>

async function initSql(): Promise<SQLTag> {
  const client = (process.env.DB_CLIENT || "neon").toLowerCase()
  const conn = process.env.DATABASE_URL
  if (!conn) throw new Error("Missing DATABASE_URL")

  if (client === "neon") {
    const { neon } = await import("@neondatabase/serverless")
    const neonSql = neon(conn)
    return neonSql as unknown as SQLTag
  }

  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: conn })
  const tag: SQLTag = (async <T = any>(strings: TemplateStringsArray, ...values: any[]) => {
    const { text, params } = toPgQuery(strings, values)
    const res: QueryResult<T> = await pool.query(text, params)
    return res.rows
  }) as SQLTag
  return tag
}

export const sql: SQLTag = async function sql(strings: TemplateStringsArray, ...values: any[]) {
  if (!cachedSql) cachedSql = await initSql()
  return cachedSql(strings, ...values)
} as unknown as SQLTag
