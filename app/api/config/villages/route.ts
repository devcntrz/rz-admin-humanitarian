import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  return withCors(async (req) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const district_id = searchParams.get('district_id')
    const regency_id = searchParams.get('regency_id')
    const province_id = searchParams.get('province_id')
    
    try {
      let villages
      
      if (q && q.trim() !== '') {
        const like = `%${q.trim()}%`
        if (district_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE v.district_id = ${district_id}
              AND (v.id ILIKE ${like} OR v.name ILIKE ${like} OR d.name ILIKE ${like})
            ORDER BY v.id ASC
          `
        } else if (regency_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE r.id = ${regency_id}
              AND (v.id ILIKE ${like} OR v.name ILIKE ${like} OR d.name ILIKE ${like})
            ORDER BY v.id ASC
          `
        } else if (province_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE p.id = ${province_id}
              AND (v.id ILIKE ${like} OR v.name ILIKE ${like} OR d.name ILIKE ${like})
            ORDER BY v.id ASC
          `
        } else {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE v.id ILIKE ${like} OR v.name ILIKE ${like} OR d.name ILIKE ${like}
            ORDER BY v.id ASC
          `
        }
      } else {
        if (district_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE v.district_id = ${district_id}
            ORDER BY v.id ASC
          `
        } else if (regency_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            WHERE r.id = ${regency_id}
            ORDER BY v.id ASC
          `
        } else if (province_id) {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            WHERE p.id = ${province_id}
            ORDER BY v.id ASC
          `
        } else {
          villages = await sql`
            SELECT v.id, v.district_id, v.name, d.name as district_name, r.name as regency_name, p.name as province_name
            FROM villages v
            LEFT JOIN districts d ON d.id = v.district_id
            LEFT JOIN regencies r ON r.id = d.regency_id
            LEFT JOIN provinces p ON p.id = r.province_id
            ORDER BY v.id ASC
          `
        }
      }
      
      return NextResponse.json({
        success: true,
        data: villages,
        total: villages.length
      })
    } catch (error) {
      console.error('Error fetching villages:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch villages' },
        { status: 500 }
      )
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return withCors(async (req) => {
    try {
      const body = await req.json()
      const { id, district_id, name } = body
      
      if (!id || !district_id || !name) {
        return NextResponse.json(
          { success: false, error: 'ID, district_id and name are required' },
          { status: 400 }
        )
      }
      
      const result = await sql`
        INSERT INTO villages (id, district_id, name)
        VALUES (${id}, ${district_id}, ${name})
        RETURNING id, district_id, name
      `
      
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Village created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating village:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create village' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})