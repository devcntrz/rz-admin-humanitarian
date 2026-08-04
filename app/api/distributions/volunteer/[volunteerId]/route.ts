import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { withCors } from '@/lib/cors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ volunteerId: string }> }
) {
  return withCors(async (req) => {
    try {
      const resolvedParams = await params
      const volunteerId = parseInt(resolvedParams.volunteerId)
      
      if (isNaN(volunteerId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid volunteer ID format' },
          { status: 400 }
        )
      }

      // Cek apakah volunteer ada
      const volunteer = await sql`
        SELECT id, full_name, email 
        FROM volunteers 
        WHERE id = ${volunteerId}
      `
      
      if (volunteer.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Volunteer not found' },
          { status: 404 }
        )
      }

      // Pagination params
      const { searchParams } = new URL(req.url)
      const pageParam = parseInt(searchParams.get('page') || '1')
      const limitParam = parseInt(searchParams.get('limit') || '5')
      const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
      const limit = isNaN(limitParam) || limitParam < 1 ? 5 : Math.min(limitParam, 100)
      const offset = (page - 1) * limit

      // Hitung total
      const totalResult = await sql<{ count: string }>`
        SELECT COUNT(*)::text as count
        FROM distribution_reports dr
        WHERE dr.pic_volunteer_id = ${volunteerId}
      `
      const totalItems = parseInt(totalResult[0]?.count || '0')
      const totalPages = Math.max(1, Math.ceil(totalItems / limit))

      // Ambil page
      const distributionReports = await sql`
        SELECT 
          dr.id,
          dr.spk_number,
          dr.event_name,
          to_char(dr.event_date, 'YYYY-MM-DD') as event_date,
          dr.beneficiary_count,
          dr.volunteer_count,
          dr.full_address,
          dr.latitude,
          dr.longitude,
          dr.created_at,
          d.name as disaster_name,
          vill.name as village_name,
          dist.name as district_name,
          reg.name as regency_name,
          prov.name as province_name
        FROM distribution_reports dr
        LEFT JOIN disaster_types d ON d.id = dr.disaster_type_id
        LEFT JOIN villages vill ON vill.id = dr.village_id
        LEFT JOIN districts dist ON dist.id = vill.district_id
        LEFT JOIN regencies reg ON reg.id = dist.regency_id
        LEFT JOIN provinces prov ON prov.id = reg.province_id
        WHERE dr.pic_volunteer_id = ${volunteerId}
        ORDER BY dr.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `

      return NextResponse.json({
        success: true,
        data: {
          volunteer: volunteer[0],
          distributionReports: distributionReports,
          pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            pageSize: limit,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
          }
        }
      })
    } catch (error) {
      console.error('Error fetching distribution reports by volunteer:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch distribution reports' },
        { status: 500 }
      )
    }
  })(request)
}

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = withCors(async (request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})