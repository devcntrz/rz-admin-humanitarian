import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'
import { hashPassword } from '@/lib/auth'
import * as XLSX from 'xlsx'

type ImportError = { row: number; email?: string; reason: string }

function normalizeHeader(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function getCell(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const formData = await req.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'File is required' },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        return NextResponse.json(
          { success: false, error: 'Excel sheet not found' },
          { status: 400 }
        )
      }

      const sheet = workbook.Sheets[sheetName]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })

      if (rawRows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No data rows found in file' },
          { status: 400 }
        )
      }

      const rows = rawRows.map((row) => {
        const normalized: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(row)) {
          normalized[normalizeHeader(key)] = value
        }
        return normalized
      })

      let successCount = 0
      const errors: ImportError[] = []

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2 // header is row 1
        const row = rows[i]
        const fullName = getCell(row, ['full_name', 'fullname', 'nama'])
        const email = getCell(row, ['email', 'username']).toLowerCase()
        const password = getCell(row, ['password', 'kata_sandi'])
        const phone = getCell(row, ['phone', 'phone_number', 'telepon', 'no_telepon']) || null

        if (!fullName || !email || !password) {
          errors.push({
            row: rowNumber,
            email: email || undefined,
            reason: 'full_name, email, and password are required',
          })
          continue
        }

        if (!email.includes('@')) {
          errors.push({
            row: rowNumber,
            email,
            reason: 'Invalid email format',
          })
          continue
        }

        try {
          const existingByEmail = await sql`
            SELECT id FROM volunteers WHERE email = ${email} LIMIT 1
          `
          if (existingByEmail.length > 0) {
            errors.push({
              row: rowNumber,
              email,
              reason: 'Email already exists',
            })
            continue
          }

          if (phone) {
            const existingByPhone = await sql`
              SELECT id FROM volunteers WHERE phone_number = ${phone} LIMIT 1
            `
            if (existingByPhone.length > 0) {
              errors.push({
                row: rowNumber,
                email,
                reason: 'Phone already exists',
              })
              continue
            }
          }

          const hashedPassword = await hashPassword(password)
          await sql`
            INSERT INTO volunteers (full_name, email, phone_number, password_hash)
            VALUES (${fullName}, ${email}, ${phone}, ${hashedPassword})
          `
          successCount += 1
        } catch (err: any) {
          errors.push({
            row: rowNumber,
            email,
            reason: err?.message || 'Failed to insert volunteer',
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          success_count: successCount,
          failed_count: errors.length,
          errors,
        },
        message: `Import finished: ${successCount} success, ${errors.length} failed`,
      })
    } catch (error) {
      console.error('Error importing volunteers:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to import volunteers' },
        { status: 500 }
      )
    }
  })(request)
}

export const OPTIONS = withCors(async () => {
  return new NextResponse(null, { status: 200 })
})
