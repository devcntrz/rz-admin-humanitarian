import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const province_id = searchParams.get('province_id')
    
    try {
      let regencies
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        if (province_id) {
          regencies = await sql`
            SELECT r.id, r.province_id, r.name, p.name as province_name
            FROM regencies r
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE r.province_id = ${province_id}
              AND (r.id ILIKE ${like} OR r.name ILIKE ${like} OR p.name ILIKE ${like})
            ORDER BY r.id ASC
          `
        } else {
          regencies = await sql`
            SELECT r.id, r.province_id, r.name, p.name as province_name
            FROM regencies r
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE r.id ILIKE ${like} OR r.name ILIKE ${like} OR p.name ILIKE ${like}
            ORDER BY r.id ASC
          `
        }
      } else {
        if (province_id) {
          regencies = await sql`
            SELECT r.id, r.province_id, r.name, p.name as province_name
            FROM regencies r
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE r.province_id = ${province_id}
            ORDER BY r.id ASC
          `
        } else {
          regencies = await sql`
            SELECT r.id, r.province_id, r.name, p.name as province_name
            FROM regencies r
            LEFT JOIN provinces p ON p.id = r.province_id
            ORDER BY r.id ASC
          `
        }
      }
      
      return NextResponse.json({
        success: true,
        data: regencies,
        total: regencies.length
      })
    } catch (error) {
      console.error('Error fetching regencies:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch regencies' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, province_id, name } = body
      
      if (!id || !province_id || !name) {
        return NextResponse.json(
          { success: false, error: 'ID, province_id and name are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO regencies (id, province_id, name)
        VALUES (${id}, ${province_id}, ${name})
        RETURNING id, province_id, name
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Regency created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating regency:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create regency' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})