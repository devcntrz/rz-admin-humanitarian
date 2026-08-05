/**
 * Normalize incident_at for storage as timestamptz.
 * Naive local datetimes (no offset) are treated as Asia/Jakarta (WIB, UTC+7).
 * ISO strings that already include Z / ±offset are kept as-is.
 */
export function normalizeIncidentAt(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  if (!trimmed) return null

  // Already has timezone: Z or ±HH:MM / ±HHMM
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  // datetime-local / mobile naive: YYYY-MM-DDTHH:mm[:ss][.sss]
  const naiveMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d+)?$/
  )
  if (naiveMatch) {
    const [, day, hm, sec = "00"] = naiveMatch
    const withOffset = `${day}T${hm}:${sec}+07:00`
    const date = new Date(withOffset)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  // Date only → start of day Jakarta
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00+07:00`)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }

  const fallback = new Date(trimmed)
  if (Number.isNaN(fallback.getTime())) return null
  return fallback.toISOString()
}

/** Today's calendar date in Asia/Jakarta as YYYY-MM-DD */
export function todayJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
