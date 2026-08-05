import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    try {
      let coordinators

      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        coordinators = await sql`
          SELECT id, full_name, phone_number as phone
          FROM field_coordinators
          WHERE full_name ILIKE ${like}
             OR COALESCE(phone_number, '') ILIKE ${like}
          ORDER BY full_name ASC
        `
      } else {
        coordinators = await sql`
          SELECT id, full_name, phone_number as phone
          FROM field_coordinators
          ORDER BY full_name ASC
        `
      }

      return NextResponse.json({
        success: true,
        data: coordinators,
        total: coordinators.length,
      })
    } catch (error) {
      console.error('Error fetching field coordinators:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch field coordinators' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { full_name, phone_number, phone } = body
      const phoneValue = phone_number || phone || null

      if (!full_name) {
        return NextResponse.json(
          { success: false, error: 'Full name is required' },
          { status: 400 }
        )
      }

      const result = await sql`
        INSERT INTO field_coordinators (full_name, phone_number)
        VALUES (${full_name}, ${phoneValue})
        RETURNING id, full_name, phone_number as phone
      `

      return NextResponse.json(
        {
          success: true,
          data: result[0],
          message: 'Field coordinator created successfully',
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error creating field coordinator:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create field coordinator' },
        { status: 500 }
      )
    }
  })(request)
}

export const OPTIONS = withCors(async () => {
  return new NextResponse(null, { status: 200 })
})
