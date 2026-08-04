import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const regency_id = searchParams.get('regency_id')
    const province_id = searchParams.get('province_id')
    
    try {
      let districts
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        if (regency_id) {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE d.regency_id = ${regency_id}
              AND (d.id ILIKE ${like} OR d.name ILIKE ${like} OR r.name ILIKE ${like})
            ORDER BY d.id ASC
          `
        } else if (province_id) {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE p.id = ${province_id}
              AND (d.id ILIKE ${like} OR d.name ILIKE ${like} OR r.name ILIKE ${like})
            ORDER BY d.id ASC
          `
        } else {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE d.id ILIKE ${like} OR d.name ILIKE ${like} OR r.name ILIKE ${like}
            ORDER BY d.id ASC
          `
        }
      } else {
        if (regency_id) {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE d.regency_id = ${regency_id}
            ORDER BY d.id ASC
          `
        } else if (province_id) {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE p.id = ${province_id}
            ORDER BY d.id ASC
          `
        } else {
          districts = await sql`
            SELECT d.id, d.regency_id, d.name, r.name as regency_name, p.name as province_name
            FROM districts d
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            ORDER BY d.id ASC
          `
        }
      }
      
      return NextResponse.json({
        success: true,
        data: districts,
        total: districts.length
      })
    } catch (error) {
      console.error('Error fetching districts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch districts' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, regency_id, name } = body
      
      if (!id || !regency_id || !name) {
        return NextResponse.json(
          { success: false, error: 'ID, regency_id and name are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO districts (id, regency_id, name)
        VALUES (${id}, ${regency_id}, ${name})
        RETURNING id, regency_id, name
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'District created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating district:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create district' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})